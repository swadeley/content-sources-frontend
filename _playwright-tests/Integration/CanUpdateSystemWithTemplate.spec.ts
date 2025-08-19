import { test, expect, cleanupTemplates, randomName } from 'test-utils';
import { RHSMClient } from './helpers/rhsmClient';
import { navigateToTemplates } from '../UI/helpers/navHelpers';
import { closePopupsIfExist, getRowByNameOrUrl } from '../UI/helpers/helpers';

const templateNamePrefix = 'integration_test_template';
const templateName = `${templateNamePrefix}-${randomName()}`;
const regClient = new RHSMClient('RHSMClientTest');
let firstVersion;

test.describe('Test System With Template', async () => {
  test('Verify system updates with template', async ({ page, client, cleanup }) => {
    await test.step('Add cleanup, delete any templates and template test repos that exist', async () => {
      await cleanup.runAndAdd(() => cleanupTemplates(client, templateNamePrefix));
      cleanup.add(() => regClient.Destroy('rhc'));
    });
    await test.step('Navigate to templates, ensure the Create template button can be clicked', async () => {
      await navigateToTemplates(page);
      await closePopupsIfExist(page);
      await expect(page.getByRole('button', { name: 'Create template' })).toBeVisible();
    });
    await test.step('Create a template with oldest snapshots', async () => {
      await page.getByRole('button', { name: 'Create template' }).click();
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'x86_64' }).click();
      await page.getByRole('button', { name: 'filter OS version' }).click();
      await page.getByRole('menuitem', { name: 'el9' }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Additional Red Hat repositories', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Custom repositories', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByText('Use up to a specific date', { exact: true }).click();
      await page.getByPlaceholder('YYYY-MM-DD', { exact: true }).fill('2021-05-17'); // Older than any snapshot date
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByText('add template modal', { exact: true });
      await page.getByPlaceholder('Enter name').fill(`${templateName}`);
      await page.getByPlaceholder('Description').fill('Template test');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();
      const rowTemplate = await getRowByNameOrUrl(page, `${templateName}`);
      await expect(rowTemplate.getByText('Valid')).toBeVisible({ timeout: 60000 });
    });

    await test.step('Create RHSM client and register the template', async () => {
      // Start the rhel9 container
      await regClient.Boot('rhel9');

      // Register, overriding the default key and org (with retry logic)
      let reg;
      let registrationSucceeded = false;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`=== REGISTRATION ATTEMPT ${attempt}/${maxRetries} ===`);

        reg = await regClient.RegisterRHC(
          process.env.ACTIVATION_KEY_1,
          process.env.ORG_ID_1,
          templateName,
        );

        if (reg?.exitCode === 0) {
          console.log(`Registration succeeded on attempt ${attempt}`);
          registrationSucceeded = true;
          break;
        } else {
          console.log(`Registration failed on attempt ${attempt}:`);
          console.log('Exit code:', reg?.exitCode);
          console.log('stdout:', reg?.stdout);
          console.log('stderr:', reg?.stderr);

          if (attempt < maxRetries) {
            console.log(`Retrying in 5 seconds...`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      }

      if (!registrationSucceeded) {
        console.log(`=== REGISTRATION FAILED AFTER ${maxRetries} ATTEMPTS ===`);
      }

      expect(reg?.exitCode).toBe(0);

      // refresh subscription-manager
      const subManRefresh = await regClient.Exec(['subscription-manager', 'refresh', '--force']);
      expect(subManRefresh?.exitCode).toBe(0);

      // clean cached metadata
      const dnfCleanAll = await regClient.Exec(['dnf', 'clean', 'all']);
      expect(dnfCleanAll?.exitCode).toBe(0);

      // List errata the system is vulnerable to
      const exist = await regClient.Exec(
        ['sh', '-c', 'dnf updateinfo --list --all | grep RH | sort | tail -n 1'],
        10 * 60 * 1000,
      );
      if (exist?.exitCode != 0) {
        console.log(exist?.stdout);
        console.log(exist?.stderr);
      }
      expect(exist?.exitCode).toBe(0);
      firstVersion = exist?.stdout?.toString();
    });

    await test.step('Update the template date to latest', async () => {
      const rowTemplate = await getRowByNameOrUrl(page, templateName);
      await rowTemplate.getByRole('button', { name: templateName }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(templateName);
      await page.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await expect(
        page.getByRole('heading', { name: 'Define template content', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Additional Red Hat repositories', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Custom repositories', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByText('Use the latest content', { exact: true }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByText('Enter template details')).toBeVisible();
      await expect(page.getByPlaceholder('Enter name')).toHaveValue(`${templateName}`);
      await expect(page.getByPlaceholder('Description')).toHaveValue('Template test');
      await page.getByPlaceholder('Description').fill('Template test edited');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm changes', exact: true }).click();
    });

    await test.step('Refresh system', async () => {
      // refresh subscription-manager
      const subManRefresh = await regClient.Exec(['subscription-manager', 'refresh', '--force']);
      expect(subManRefresh?.exitCode).toBe(0);

      // clean cached metadata
      const dnfCleanAll = await regClient.Exec(['dnf', 'clean', 'all']);
      expect(dnfCleanAll?.exitCode).toBe(0);

      // List errata the system is vulnerable to
      const updateInfo = await regClient.Exec(
        ['sh', '-c', 'dnf updateinfo --list --all | grep RH | sort | tail -n 1'],
        10 * 60 * 1000,
      );
      if (updateInfo?.exitCode != 0) {
        console.log(updateInfo?.stdout);
        console.log(updateInfo?.stderr);
      }
      expect(updateInfo?.exitCode).toBe(0);
      const secondVersion = updateInfo?.stdout?.toString();
      expect(secondVersion).not.toBe(firstVersion);

      // vim-enhanced shouldn't be installed
      const notExist = await regClient.Exec(['rpm', '-q', 'vim-enhanced']);
      expect(notExist?.exitCode).not.toBe(0);

      // Install vim-enhanced, expect it to finish in 60 seconds
      const yumInstall = await regClient.Exec(['yum', 'install', '-y', 'vim-enhanced'], 60000);
      expect(yumInstall?.exitCode).toBe(0);

      // Now vim-enhanced should be installed
      const exist = await regClient.Exec(['rpm', '-q', 'vim-enhanced']);
      expect(exist?.exitCode).toBe(0);
    });
  });
});
