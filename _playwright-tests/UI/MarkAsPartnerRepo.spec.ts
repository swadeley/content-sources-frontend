import { test, expect, cleanupRepositories, waitWhileRepositoryIsPending } from 'test-utils';
import { SNAPSHOT_DIALOG_TIMEOUT_MS } from '../testConstants';
import { navigateToRepositories, navigateToSnapshotsOfRepository } from './helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  randomName,
  waitForValidStatus,
} from './helpers/helpers';

const uploadRepoNamePrefix = 'Partner-Mark';

test.describe('Mark upload repository as partner', () => {
  test.use({ storageState: '.auth/ADMIN_TOKEN.json' });

  test('Mark as partner from kebab shows Partnered label', async ({ page, client, cleanup }) => {
    const featuresResponse = await page.request.get('/api/content-sources/v1/features/');
    const features = await featuresResponse.json();
    test.skip(
      !(
        features.adminpartnerrepositories?.enabled && features.adminpartnerrepositories?.accessible
      ),
      'adminpartnerrepositories not accessible',
    );

    const uploadRepoName = `${uploadRepoNamePrefix}-${randomName()}`;
    await cleanup.runAndAdd(() => cleanupRepositories(client, uploadRepoNamePrefix));
    await closeGenericPopupsIfExist(page);
    await navigateToRepositories(page);

    await test.step('Create upload repository', async () => {
      await page.getByRole('button', { name: 'Add repositories' }).first().click();
      await expect(page.locator('div[id^="pf-modal-part"]').first()).toBeVisible();

      await page.getByPlaceholder('Enter name').fill(uploadRepoName);
      await page.getByLabel('Upload', { exact: true }).check();

      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'x86_64' }).click();

      const versionFilterButton = page.getByRole('button', { name: 'filter OS version' });
      await versionFilterButton.click();
      await page.getByRole('menuitem', { name: 'RHEL 9' }).click();
      await versionFilterButton.click();

      const [, bulkCreateResponse] = await Promise.all([
        page.getByRole('button', { name: 'Save and upload content' }).click(),
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/bulk_create/') && resp.status() >= 200 && resp.status() < 300,
        ),
      ]);

      const bulkCreateData = await bulkCreateResponse.json();
      const repoUuid = bulkCreateData[0]?.uuid;
      expect(repoUuid).toBeTruthy();
      const repo = await waitWhileRepositoryIsPending(client, repoUuid);
      expect(repo.status).toBe('Valid');

      // Close upload content modal without uploading packages
      await page.getByRole('button', { name: 'Cancel' }).click();
      await waitForValidStatus(page, uploadRepoName);
    });

    await test.step('Mark repository as partner', async () => {
      const row = await getRowByNameOrUrl(page, uploadRepoName);
      await row.getByRole('button', { name: 'Kebab toggle' }).click();
      await page.getByRole('menuitem', { name: 'Mark as partner repository' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Mark as partner repository').first()).toBeVisible();

      const confirm = dialog.getByRole('button', { name: 'Mark as partner repository' });
      await expect(confirm).toBeDisabled();

      await dialog.getByLabel('I understand that snapshots must be published manually.').check();
      await expect(confirm).toBeEnabled();

      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/admin/repositories/') &&
            resp.url().includes('/partner') &&
            resp.request().method() === 'PATCH' &&
            resp.status() === 200,
        ),
        confirm.click(),
      ]);

      await expect(row.getByText('Partnered')).toBeVisible();
    });

    await test.step('Mark as partner action is hidden after partnered', async () => {
      const row = await getRowByNameOrUrl(page, uploadRepoName);
      await row.getByRole('button', { name: 'Kebab toggle' }).click();
      await expect(page.getByRole('menuitem', { name: 'Mark as partner repository' })).toBeHidden();
    });

    await test.step('Publish action appears in snapshot kebab after partnering', async () => {
      const row = await getRowByNameOrUrl(page, uploadRepoName);
      await navigateToSnapshotsOfRepository(page, row);

      const snapshotsDialog = page.getByRole('dialog', { name: 'Snapshots' });
      await expect(snapshotsDialog.locator('tbody')).toBeVisible({
        timeout: SNAPSHOT_DIALOG_TIMEOUT_MS,
      });

      const snapshotRow = page.getByTestId('snapshot_list_table').locator('tbody tr').first();
      await snapshotRow.getByLabel('Kebab toggle').click();

      // Since the upload repo has 0 packages, the publish action should be disabled
      const publishMenuItem = page.getByRole('menuitem', {
        name: 'Cannot publish snapshot with 0 packages',
      });
      await expect(publishMenuItem).toBeVisible();
      await expect(publishMenuItem).toBeDisabled();
    });
  });
});
