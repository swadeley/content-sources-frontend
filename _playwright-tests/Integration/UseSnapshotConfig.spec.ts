import { closeGenericPopupsIfExist, waitForValidStatus } from '../UI/helpers/helpers';
import { navigateToRepositories, navigateToSnapshotsOfRepository } from '../UI/helpers/navHelpers';
import { cleanupRepositories, ensureValidToken, randomName, test, expect } from 'test-utils';
import { createCustomRepo } from '../UI/helpers/createRepositories';
import { refreshSubscriptionManager, RHSMClient, waitForRhcdActive } from './helpers/rhsmClient';
import fs from 'fs';
import { runCmd, installAndVerifyPackage } from './helpers/helpers';
import { YUM_INSTALL_TIMEOUT_MS } from '../testConstants';
import { createApiConfigWithDynamicToken } from './helpers/apiHelpers';

const repoNamePrefix = 'Snapshot_Config';

test.describe('Use Snapshot Config', () => {
  test('Use Snapshot Config', async ({ page, client, cleanup, unusedRepoUrl }) => {
    void client; // Pull in fixture so Undici fetch dispatcher is configured for dynamic API cleanup
    let repoName = '';
    let fileContent = '';

    const regClient = new RHSMClient(`snapshot_config_test_${randomName()}`);
    repoName = `${repoNamePrefix}_${randomName()}`;

    await test.step('Set up cleanup', async () => {
      cleanup.add(() => regClient.Destroy('rhc'));
      await cleanup.runAndAdd(async () => {
        await ensureValidToken(page, 'ADMIN_TOKEN.json', 5);
        const apiBasePath = process.env.BASE_URL + '/api/content-sources/v1';
        const cleanupClient = createApiConfigWithDynamicToken('ADMIN_TOKEN', apiBasePath);
        await cleanupRepositories(cleanupClient, repoNamePrefix);
      });
    });

    await test.step('Verify "download config file" and "copy to clipboard config" content has same value', async () => {
      await navigateToRepositories(page);
      await closeGenericPopupsIfExist(page);
      await createCustomRepo(page, repoName, unusedRepoUrl);
      const row = await waitForValidStatus(page, repoName, 60000);

      await navigateToSnapshotsOfRepository(page, row);

      const snapshotsModal = page.getByTestId('snapshot_list_modal');
      await expect(snapshotsModal).toBeVisible();

      // Grant clipboard permissions to the page
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      // CLEAR the clipboard first to ensure no stale data
      await page.evaluate(() => navigator.clipboard.writeText(''));

      const snapshotsTable = snapshotsModal.getByRole('grid', { name: 'Snapshots list table' });
      await expect(snapshotsTable).toBeVisible();
      const firstSnapshotRow = snapshotsTable.locator('tbody tr').first();

      const copy_to_clipboard_button = firstSnapshotRow.getByTestId('repo_config_file_copy_button');
      await copy_to_clipboard_button.click();

      let clipboardText = '';
      await expect
        .poll(async () => {
          clipboardText = await page.evaluate(() => navigator.clipboard.readText());
          return clipboardText;
        })
        .not.toBe('');

      const download_button = firstSnapshotRow.getByTestId('repo_config_file_download_button');
      const [download] = await Promise.all([
        page.waitForEvent('download'), // Wait for the download event
        download_button.click(),
      ]);
      const path = await download.path();
      if (!path) {
        throw new Error('Download failed or path is invalid');
      }
      fileContent = fs.readFileSync(path, 'utf-8').trim();
      expect(fileContent).toEqual(clipboardText.trim());

      // Add proxy configuration to the repo config for stage environment
      // The downloaded config doesn't include proxy settings, but they're needed to access content
      // remove this once HMS-9960 is fixed
      if (process.env.RH_CLIENT_PROXY) {
        console.log(`Adding proxy configuration: ${process.env.RH_CLIENT_PROXY}`);
        fileContent += `\nproxy=${process.env.RH_CLIENT_PROXY}`;
      }

      await snapshotsModal.getByRole('button', { name: 'Close', exact: true }).first().click();
    });

    await test.step('Use snapshot config', async () => {
      await regClient.Boot('rhel9');

      const reg = await regClient.RegisterRHC(process.env.ACTIVATION_KEY_1, process.env.ORG_ID_1);
      if (reg?.exitCode != 0) {
        console.log('Registration stdout:', reg?.stdout);
        console.log('Registration stderr:', reg?.stderr);
      }
      expect(reg?.exitCode, 'Registration should succeed').toBe(0);
      await waitForRhcdActive(regClient);
      await refreshSubscriptionManager(regClient);

      // add snapshot config in repos.d
      await runCmd(
        'Add user config',
        ['sh', '-c', `echo '${fileContent}' > /etc/yum.repos.d/test.repo`],
        regClient,
      );

      // verify the repo from snapshot config is listed
      const repolist = await runCmd('Verify repository is listed', ['dnf', 'repolist'], regClient);
      expect(repolist?.stdout?.toString().trim()).toContain(repoName);

      await installAndVerifyPackage({
        regClient,
        packageName: 'tree',
        installTimeout: YUM_INSTALL_TIMEOUT_MS,
      });
    });
  });
});
