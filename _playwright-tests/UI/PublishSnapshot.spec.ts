import path from 'path';
import { test, expect, cleanupRepositories, waitWhileRepositoryIsPending } from 'test-utils';
import { SNAPSHOT_DIALOG_TIMEOUT_MS } from '../testConstants';
import { navigateToRepositories, navigateToSnapshotsOfRepository } from './helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  randomName,
  retry,
  waitForValidStatus,
} from './helpers/helpers';

const uploadRepoNamePrefix = 'Publish-Snap';
const externalRepoNamePrefix = 'Publish-Snap-Ext';

test.describe('Publish Snapshot', () => {
  test.use({ storageState: '.auth/ADMIN_TOKEN.json' });

  test('Publish a snapshot via per-row kebab', async ({ page, client, cleanup }) => {
    test.setTimeout(300_000); // 5 minutes

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

    let repoUuid: string;

    await test.step('Create upload repository and upload an RPM', async () => {
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
      repoUuid = bulkCreateData[0]?.uuid;
      expect(repoUuid).toBeTruthy();
      const repo = await waitWhileRepositoryIsPending(client, repoUuid);
      expect(repo.status).toBe('Valid');

      // Upload an RPM so the snapshot has packages
      await expect(page.getByText('Drag and drop files here')).toBeVisible();
      await retry(page, async (page) => {
        await page
          .locator('input[type=file]')
          .first()
          .setInputFiles(path.join(__dirname, './fixtures/libreOffice.rpm'));
      });
      await expect(page.getByText('All uploads completed!')).toBeVisible();
      await page.getByRole('button', { name: 'Confirm changes' }).click();
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

    await test.step('Navigate to snapshots and publish via kebab', async () => {
      const row = await getRowByNameOrUrl(page, uploadRepoName);
      await navigateToSnapshotsOfRepository(page, row);

      const snapshotsDialog = page.getByRole('dialog', { name: 'Snapshots' });
      await expect(snapshotsDialog.locator('tbody')).toBeVisible();

      // Open the first snapshot row kebab and click Publish
      const snapshotRow = page.getByTestId('snapshot_list_table').locator('tbody tr').first();
      await snapshotRow.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Publish' }).click();

      // Confirm in the publish modal
      await expect(page.locator('[data-ouia-component-id="publish_snapshot_modal"]')).toBeVisible();

      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/published') &&
            resp.request().method() === 'PATCH' &&
            resp.status() === 200,
        ),
        page.locator('[data-ouia-component-id="publish_snapshot_modal_confirm"]').click(),
      ]);
    });

    await test.step('Verify Publishing in progress label', async () => {
      const snapshotsDialog = page.getByRole('dialog', { name: 'Snapshots' });
      await expect(snapshotsDialog.getByText('Publishing in progress')).toBeVisible();
    });

    await test.step('Wait for Published label', async () => {
      const snapshotsDialog = page.getByRole('dialog', { name: 'Snapshots' });
      await expect(snapshotsDialog.getByText('Published')).toBeVisible({
        timeout: SNAPSHOT_DIALOG_TIMEOUT_MS,
      });
    });
  });

  test('Publish action is hidden for non-partner repos', async ({ page, client, cleanup }) => {
    test.setTimeout(300_000);

    const featuresResponse = await page.request.get('/api/content-sources/v1/features/');
    const features = await featuresResponse.json();
    test.skip(
      !(
        features.adminpartnerrepositories?.enabled && features.adminpartnerrepositories?.accessible
      ),
      'adminpartnerrepositories not accessible',
    );

    const externalRepoName = `${externalRepoNamePrefix}-${randomName()}`;
    const repoUrl = 'https://jlsherrill.fedorapeople.org/fake-repos/revision/one/';
    await cleanup.runAndAdd(() => cleanupRepositories(client, externalRepoNamePrefix, repoUrl));
    await closeGenericPopupsIfExist(page);
    await navigateToRepositories(page);

    await test.step('Create a snapshotting repository (non-partner)', async () => {
      await page.getByRole('button', { name: 'Add repositories' }).first().click();
      await expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeVisible();

      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(externalRepoName);
      await page.getByLabel('Snapshotting').click();
      await page.getByRole('textbox', { name: 'URL', exact: true }).fill(repoUrl);
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await waitForValidStatus(page, externalRepoName);
    });

    await test.step('Navigate to snapshots and verify Publish is absent', async () => {
      const row = await getRowByNameOrUrl(page, externalRepoName);
      await navigateToSnapshotsOfRepository(page, row);

      const snapshotsDialog = page.getByRole('dialog', { name: 'Snapshots' });
      await expect(snapshotsDialog.locator('tbody')).toBeVisible({
        timeout: SNAPSHOT_DIALOG_TIMEOUT_MS,
      });

      // Open the first snapshot row kebab
      const snapshotRow = page.getByTestId('snapshot_list_table').locator('tbody tr').first();
      await snapshotRow.getByLabel('Kebab toggle').click();

      // "Delete" should be present but "Publish" should not
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Publish' })).toBeHidden();
    });
  });

  test('Publish is disabled for a snapshot with 0 packages', async ({ page, client, cleanup }) => {
    test.setTimeout(300_000);

    const featuresResponse = await page.request.get('/api/content-sources/v1/features/');
    const features = await featuresResponse.json();
    test.skip(
      !(
        features.adminpartnerrepositories?.enabled && features.adminpartnerrepositories?.accessible
      ),
      'adminpartnerrepositories not accessible',
    );

    const uploadRepoName = `${uploadRepoNamePrefix}-0pkg-${randomName()}`;
    await cleanup.runAndAdd(() => cleanupRepositories(client, `${uploadRepoNamePrefix}-0pkg`));
    await closeGenericPopupsIfExist(page);
    await navigateToRepositories(page);

    await test.step('Create upload repository without uploading packages', async () => {
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

    await test.step('Navigate to snapshots and verify publish is disabled', async () => {
      const row = await getRowByNameOrUrl(page, uploadRepoName);
      await navigateToSnapshotsOfRepository(page, row);

      const snapshotsDialog = page.getByRole('dialog', { name: 'Snapshots' });
      await expect(snapshotsDialog.locator('tbody')).toBeVisible({
        timeout: SNAPSHOT_DIALOG_TIMEOUT_MS,
      });

      // Open the first snapshot row kebab
      const snapshotRow = page.getByTestId('snapshot_list_table').locator('tbody tr').first();
      await snapshotRow.getByLabel('Kebab toggle').click();

      // The menu item should say "Cannot publish snapshot with 0 packages" and be disabled
      const publishMenuItem = page.getByRole('menuitem', {
        name: 'Cannot publish snapshot with 0 packages',
      });
      await expect(publishMenuItem).toBeVisible();
      await expect(publishMenuItem).toBeDisabled();
    });
  });
});
