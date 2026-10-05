import {
  test,
  expect,
  cleanupTemplates,
  ensureValidToken,
  randomName,
  waitInPatch,
} from 'test-utils';
import {
  DNF_COMMAND_TIMEOUT_MS,
  LONG_TEST_TIMEOUT_MS,
  MODAL_VISIBILITY_TIMEOUT_MS,
  RHSM_RHCD_WAIT,
  SYSTEM_ROW_VISIBILITY_TIMEOUT_MS,
  CONTENT_PROPAGATION_POLL,
  TEMPLATE_VALID_STATUS_TIMEOUT_MS,
  YUM_INSTALL_TIMEOUT_MS,
} from '../testConstants';
import { RHSMClient, waitForRhcdActive, refreshSubscriptionManager } from './helpers/rhsmClient';
import { runCmd, installAndVerifyPackage, getPackageDownloadUrl } from './helpers/helpers';
import { navigateToTemplates } from '../UI/helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  getRowCellByHeader,
} from '../UI/helpers/helpers';
import { createTemplateViaUI } from './helpers/templateActions';
import { createApiConfigWithDynamicToken } from './helpers/apiHelpers';

const activationKey = process.env.ACTIVATION_KEY_1;
const orgId = process.env.ORG_ID_1;

test.describe('Assign Standard Template to System via UI', () => {
  const templateNamePrefix = 'standard_template_assignment_test';
  const templateName = `${templateNamePrefix}-${randomName()}`;
  const regClient = new RHSMClient(`AssignStandardTemplateTest-${randomName()}`);

  let hostname: string;

  test('Create standard template and assign it to a system using the "Via system list" method', async ({
    page,
    client,
    cleanup,
  }) => {
    void client; // Pull in fixture so Undici fetch dispatcher is configured for dynamic API cleanup
    test.setTimeout(LONG_TEST_TIMEOUT_MS);

    await test.step('Set up cleanup for templates and RHSM client', async () => {
      cleanup.add(() => regClient.Destroy('rhc'));
      await cleanup.runAndAdd(async () => {
        await ensureValidToken(page, 'ADMIN_TOKEN.json', 5);
        const apiBasePath = process.env.BASE_URL + '/api/content-sources/v1';
        const cleanupClient = createApiConfigWithDynamicToken('ADMIN_TOKEN', apiBasePath);
        await cleanupTemplates(cleanupClient, templateNamePrefix);
      });
    });

    await test.step('Boot RHEL 9 system and register without template', async () => {
      await regClient.Boot('rhel9');
      hostname = await regClient.GetHostname();

      const registration = await regClient.RegisterRHC(activationKey, orgId);

      if (registration?.exitCode !== 0) {
        console.error('Registration failed:', {
          exitCode: registration?.exitCode,
          stdout: registration?.stdout,
          stderr: registration?.stderr,
        });
      }

      expect(registration?.exitCode, 'registration should be successful').toBe(0);
    });

    await test.step('Wait for system to appear in Patch', async () => {
      await waitForRhcdActive(regClient, RHSM_RHCD_WAIT.maxAttempts, RHSM_RHCD_WAIT.delayMs);
      // Overnight CI can take longer than the default 3 minutes for Patch to list a new host
      await waitInPatch(page, hostname, false, 8 * 60 * 1000);
    });

    await test.step('Verify package URLs come from base CDN before assignment', async () => {
      const result = await runCmd(
        'Get download URL for vim-enhanced from base CDN',
        ['dnf', 'repoquery', '--quiet', '--location', 'vim-enhanced'],
        regClient,
        DNF_COMMAND_TIMEOUT_MS,
      );
      const output = [result?.stdout, result?.stderr].filter(Boolean).join('\n');
      console.log('Package download URL:', output);
      expect(output, 'Package download URL should be from base CDN, not template').not.toContain(
        '/templates/',
      );
    });

    await test.step('Create template via UI and open system assignment modal', async () => {
      await navigateToTemplates(page);
      await closeGenericPopupsIfExist(page);

      await createTemplateViaUI({
        page,
        templateName,
        templateDescription: 'Test template for system assignment',
        withSystemAssignment: true,
      });
    });

    await test.step('Assign template to system via system list', async () => {
      const modalPage = page.getByRole('dialog', { name: 'Assign template to systems' });
      await expect(modalPage).toBeVisible({ timeout: MODAL_VISIBILITY_TIMEOUT_MS });

      const saveButton = modalPage.getByRole('button', { name: 'Save', exact: true });
      await expect(saveButton).toBeDisabled({
        timeout: MODAL_VISIBILITY_TIMEOUT_MS,
      });

      const rowSystem = await getRowByNameOrUrl(modalPage, hostname, true);
      await rowSystem.getByRole('checkbox').check();

      // Save stays disabled until a system is selected *and* the template RHSM environment exists
      await expect(
        saveButton,
        'Save should enable after selecting a system and the template environment is ready',
      ).toBeEnabled({ timeout: TEMPLATE_VALID_STATUS_TIMEOUT_MS });
      await saveButton.click();
      await expect(modalPage).toBeHidden({ timeout: MODAL_VISIBILITY_TIMEOUT_MS });

      const systemRow = await getRowByNameOrUrl(page, hostname);
      await expect(systemRow).toBeVisible({ timeout: SYSTEM_ROW_VISIBILITY_TIMEOUT_MS });
    });

    await test.step('Check template table systems column, expect a system assigned', async () => {
      await navigateToTemplates(page);
      const row = await getRowByNameOrUrl(page, templateName);
      const cell = await getRowCellByHeader(page, row, 'Systems');
      const systemsButton = cell.getByRole('button');
      await expect(systemsButton).toHaveText('1');

      await systemsButton.click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(templateName);
    });

    await test.step('Verify filter bar remains visible when search yields no matching systems', async () => {
      const searchInput = page.getByPlaceholder('Filter by name');
      await searchInput.fill('nonexistent-system-xyz');

      await expect(page.getByText('No associated systems match the filter criteria')).toBeVisible();
      await expect(searchInput).toBeVisible();

      await page.getByRole('button', { name: 'Clear all filters' }).click();
      await expect(page.getByText(hostname)).toBeVisible();
    });

    await test.step('Wait for package URLs to be served from template', async () => {
      // Refresh the subscription manager so the system picks up the new template entitlements
      await refreshSubscriptionManager(regClient);
      await runCmd('Clean cached metadata', ['dnf', 'clean', 'all'], regClient);

      await expect
        // Poll for package URL (content propagation can be slow in CI)
        .poll(
          async () => {
            const output = await getPackageDownloadUrl(regClient, 'vim-enhanced');
            console.log('Package download URL:', output);
            return output;
          },
          {
            timeout: CONTENT_PROPAGATION_POLL.timeout,
            intervals: [...CONTENT_PROPAGATION_POLL.intervals],
          },
        )
        .toContain('/templates/');
    });

    await test.step('Install and verify vim-enhanced package from template', async () => {
      await installAndVerifyPackage({
        regClient,
        packageName: 'vim-enhanced',
        installTimeout: YUM_INSTALL_TIMEOUT_MS,
      });
    });
  });
});
