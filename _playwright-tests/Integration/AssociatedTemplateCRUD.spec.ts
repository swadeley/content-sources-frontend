import {
  test,
  expect,
  cleanupTemplates,
  ensureValidToken,
  randomName,
  waitInPatch,
  isInInventory,
  getTemplateSystemsCount,
  getTemplateUuidByName,
  INVENTORY_PATCH_POLL_TIMEOUT_MS,
  resolvePatchSystemIdsForHostname,
  expectHostnameAbsentFromPatchTemplate,
} from 'test-utils';
import { CONTENT_PROPAGATION_POLL } from '../testConstants';
import { RHSMClient } from './helpers/rhsmClient';
import { createApiConfigWithDynamicToken } from './helpers/apiHelpers';
import { navigateToTemplates } from '../UI/helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  waitForValidStatus,
} from '../UI/helpers/helpers';
import { createTemplateViaUI, setupSystemWithTemplate } from './helpers/templateActions';

test.describe('Associated Template CRUD', () => {
  // Variables at describe scope to ensure randomName() is called per test suite run for better test isolation
  const templateNamePrefix = 'associated_template_test';
  const templateName = `${templateNamePrefix}-${randomName()}`;
  const regClient = new RHSMClient(`AssociatedTemplateCRUDTest-${randomName()}`);

  let hostname: string;

  test('Warn against template deletion when associated to a system and not warn after unregistration', async ({
    page,
    client,
    cleanup,
  }) => {
    // Increase timeout for CI environment because template validation can take up to 11 minutes
    test.setTimeout(900000); // 15 minutes

    await test.step('Set up cleanup for templates and RHSM client', async () => {
      cleanup.add(() => regClient.Destroy('rhc'));
      await cleanup.runAndAdd(async () => {
        await ensureValidToken(page, 'ADMIN_TOKEN.json', 5);
        const apiBasePath = process.env.BASE_URL + '/api/content-sources/v1';
        const cleanupClient = createApiConfigWithDynamicToken('ADMIN_TOKEN', apiBasePath);
        await cleanupTemplates(cleanupClient, templateNamePrefix);
      });
    });

    await test.step('Navigate to templates and create a new template', async () => {
      await ensureValidToken(page, 'ADMIN_TOKEN.json');
      await navigateToTemplates(page);
      await closeGenericPopupsIfExist(page);

      await createTemplateViaUI({
        page,
        templateName,
        templateDescription: 'Template test for associated system CRUD',
      });

      await waitForValidStatus(page, templateName, 660000, 'template should show Valid status');
    });

    await test.step('Boot and register system with template via RHC', async () => {
      hostname = await setupSystemWithTemplate({ regClient, templateName });
    });

    await test.step('Verify template uses correct certificate URL', async () => {
      const repoConfig = await regClient.Exec(['cat', '/etc/yum.repos.d/redhat.repo'], 10000);

      const expectedCertHost =
        process.env.PROD === 'true' ? 'cert.console.redhat.com' : 'cert.console.stage.redhat.com';

      // Match baseurl with optional spaces around '=' and ignore the path after hostname
      const baseurlPattern = new RegExp(`^baseurl\\s*=\\s*https://${expectedCertHost}/`, 'm');

      expect(
        repoConfig?.stdout,
        `template should configure baseurl with certificate host ${expectedCertHost}`,
      ).toMatch(baseurlPattern);
    });

    await test.step('Verify system is attached to template', async () => {
      await ensureValidToken(page, 'ADMIN_TOKEN.json');
      await waitInPatch(page, hostname, true);
    });

    await test.step('Attempt to delete template and verify warning appears', async () => {
      const rowTemplate = await getRowByNameOrUrl(page, templateName);
      await rowTemplate.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();

      await test.step('Verify deletion warning appears for template with associated systems', async () => {
        await expect(
          page.getByText('Delete template?'),
          'delete template warning should be visible',
        ).toBeVisible();

        const modal = page.getByRole('dialog');
        await expect(modal, 'delete template modal should be visible').toBeVisible();

        const removeButton = modal.getByRole('button', { name: 'Delete' });
        await expect(removeButton, 'delete button should be enabled').toBeEnabled();

        await expect(
          modal.getByRole('link', { name: /This template is assigned to \d+ system/i }),
          'system assignment link should be visible',
        ).toBeVisible();

        await modal.getByRole('button', { name: 'Cancel' }).click();
      });
    });

    await test.step('Remove system from template in Patch before unregister', async () => {
      const templateUuid = await getTemplateUuidByName(client, templateName);
      expect(templateUuid, 'template UUID should be resolvable').toBeTruthy();

      // [HMS-10435] [QE] Use patch API to remove system in Integration/AssociatedTemplateCRUD
      // Unassign from template while the system is still registered, then unregister. (workaround for HMS-10394)
      const systemIds = await resolvePatchSystemIdsForHostname(page, templateUuid!, hostname);
      expect(
        systemIds.length,
        'system should still be listed on the template in Patch',
      ).toBeGreaterThan(0);

      const removeRes = await page.request.delete('/api/patch/v3/templates/systems', {
        data: { systems: systemIds },
      });
      if (!removeRes.ok()) {
        const errBody = await removeRes.text();
        throw new Error(
          `expected remove systems from template to succeed (templateUuid=${templateUuid}, systemIds=${JSON.stringify(systemIds)}), got ${removeRes.status()}: ${errBody}`,
        );
      }

      await expectHostnameAbsentFromPatchTemplate(page, templateUuid!, hostname);
    });

    await test.step('Unregister the system', async () => {
      const unreg = await regClient.Unregister(true);
      if (unreg?.exitCode != 0) {
        console.log('Unregistration stdout:', unreg?.stdout);
        console.log('Unregistration stderr:', unreg?.stderr);
      }
      expect(unreg?.exitCode, 'unregistration should be successful').toBe(0);
    });

    await test.step('Wait for system to be removed from inventory', async () => {
      await expect
        .poll(
          async () => {
            await ensureValidToken(page, 'ADMIN_TOKEN.json');
            return isInInventory(page, hostname);
          },
          {
            message: 'System still found in inventory',
            timeout: 600_000,
          },
        )
        .toBe(0);
    });

    await test.step('Wait for template to have no associated systems in Patch', async () => {
      const templateUuid = await getTemplateUuidByName(client, templateName);
      expect(templateUuid, 'template UUID should be resolvable').toBeTruthy();

      await expect
        .poll(
          async () => {
            await ensureValidToken(page, 'ADMIN_TOKEN.json');
            return getTemplateSystemsCount(page, templateUuid!);
          },
          {
            message: 'Template still has associated systems in Patch',
            timeout: INVENTORY_PATCH_POLL_TIMEOUT_MS,
            intervals: [...CONTENT_PROPAGATION_POLL.intervals],
          },
        )
        .toBe(0);
    });

    await test.step('Verify template can now be deleted without warning', async () => {
      await expect(page.getByRole('button', { name: 'Create template' })).toBeVisible();
      const rowTemplate = await getRowByNameOrUrl(page, templateName);
      await rowTemplate.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();

      await test.step('Verify no warning appears and deletion succeeds', async () => {
        await expect(
          page.getByText('Delete template?'),
          'delete template confirmation modal should be visible',
        ).toBeVisible();

        const modal = page.getByRole('dialog');

        await expect(
          modal.getByText(
            `Template ${templateName} and all its data will be deleted. This action cannot be undone.`,
          ),
          'delete template modal body should be visible',
        ).toBeVisible();

        await expect(
          modal.getByRole('link', { name: /This template is assigned to \d+ system/i }),
          'system assignment link should not be present',
        ).toHaveCount(0);

        const removeButton = modal.getByRole('button', { name: 'Delete' });
        await expect(removeButton, 'delete button should be enabled').toBeEnabled();
        await removeButton.click();
      });

      await test.step('Verify template is removed from the list', async () => {
        await expect(
          rowTemplate.getByText('Valid'),
          'template should be removed from the list',
        ).toHaveCount(0, { timeout: 30000 });
      });
    });
  });
});
