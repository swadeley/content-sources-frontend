import { test, cleanupTemplates, randomName, expect, waitInPatch } from 'test-utils';

import { RHSMClient, waitForRhcdActive, refreshSubscriptionManager } from './helpers/rhsmClient';
import { navigateToTemplates } from '../UI/helpers/navHelpers';
import { closeGenericPopupsIfExist, waitForValidStatus } from '../UI/helpers/helpers';
import { createTemplateViaUI, setupSystemWithTemplate } from './helpers/templateActions';
import { installAndVerifyPackage, getPackageDownloadUrl, runCmd } from './helpers/helpers';
import { CONTENT_PROPAGATION_POLL, RHSM_RHCD_WAIT, RELEASE_STREAMS } from '../testConstants';
import {
  createApiConfigWithDynamicToken,
  ensureValidTokenAndSyncHeaders,
} from './helpers/apiHelpers';

const token = process.env.EUS_REPO_TOKEN;
const activationKey = process.env.EUS_ACCESS_ACTIVATION_KEY;
const orgId = process.env.EUS_ACCESS_ORG_ID;

const { eus, e4s, eeus } = RELEASE_STREAMS;

test.describe('Assign EUS Template to System', () => {
  test.use({
    storageState: '.auth/EUS_REPO_TOKEN.json',
    extraHTTPHeaders: token ? { Authorization: token } : {},
  });

  const templateNamePrefix = 'eus_template_assignment_test';
  const templateName = `${templateNamePrefix}-${randomName()}`;
  const regClient = new RHSMClient(`AssignEUSTemplateTest-${randomName()}`);

  let hostname: string;

  test('Create EUS template and assign it to a RHEL 9.6 system', async ({
    page,
    client,
    cleanup,
  }) => {
    // Increase timeout for CI environment because template validation can take up to 11 minutes
    test.setTimeout(900000); // 15 minutes

    void client; // Pull in fixture so Undici fetch dispatcher is configured for dynamic API cleanup

    await test.step('Set up cleanup for templates and RHSM client', async () => {
      cleanup.add(() => regClient.Destroy('rhc'));
      await cleanup.runAndAdd(async () => {
        await ensureValidTokenAndSyncHeaders(page, 'EUS_REPO_TOKEN.json', 'EUS_REPO_TOKEN', 5);
        const apiBasePath = process.env.BASE_URL + '/api/content-sources/v1';
        const cleanupClient = createApiConfigWithDynamicToken('EUS_REPO_TOKEN', apiBasePath);
        await cleanupTemplates(cleanupClient, templateNamePrefix);
      });
    });

    await test.step('Verify user has access to EUS, E4S, and EEUS entitlements', async () => {
      await navigateToTemplates(page);
      await closeGenericPopupsIfExist(page);

      await page.getByRole('button', { name: 'Create template' }).click();
      const modal = page.getByRole('dialog', { name: 'add template modal' });
      await expect(
        modal.getByRole('heading', { name: 'OS and architecture', exact: true }),
      ).toBeVisible();

      await modal.getByRole('button', { name: 'Release stream toggle' }).click();
      // Wait for the menu to be stable to prevent flaky clicks
      // Menu renders at document root, not within modal
      await expect(page.getByRole('menu')).toBeVisible();
      await expect(page.getByRole('menuitem', { name: eus })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: e4s })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: eeus })).toBeVisible();

      await modal.getByRole('button', { name: 'Cancel' }).click();
      await expect(modal).toBeHidden();
    });

    await test.step('Create EUS template via UI and wait for validation', async () => {
      await ensureValidTokenAndSyncHeaders(page, 'EUS_REPO_TOKEN.json', 'EUS_REPO_TOKEN');
      await createTemplateViaUI({
        page,
        templateName,
        templateDescription: 'Test template containing EUS repositories',
        osVersion: '9.6',
        stream: 'eus',
      });

      await waitForValidStatus(page, templateName, 660000, 'template should show Valid status');
    });

    await test.step('Boot RHEL 9.6 system and register with EUS template', async () => {
      hostname = await setupSystemWithTemplate({ regClient, templateName, activationKey, orgId });
    });

    await test.step('Wait for system to appear in Patch with template attached', async () => {
      await waitForRhcdActive(regClient, RHSM_RHCD_WAIT.maxAttempts, RHSM_RHCD_WAIT.delayMs);
      await refreshSubscriptionManager(regClient);
      await ensureValidTokenAndSyncHeaders(page, 'EUS_REPO_TOKEN.json', 'EUS_REPO_TOKEN');
      await waitInPatch(page, hostname, true, 8 * 60 * 1000, 'EUS_REPO_TOKEN.json'); // 8 minutes
    });

    await test.step('Wait for package URLs to be served from template', async () => {
      await runCmd('Clean cached metadata', ['dnf', 'clean', 'all'], regClient);

      await expect
        .poll(
          async () => {
            const output = await getPackageDownloadUrl(regClient, 'tree');
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

    await test.step('Install and verify tree package from template', async () => {
      await installAndVerifyPackage({ regClient, packageName: 'tree' });
    });
  });
});
