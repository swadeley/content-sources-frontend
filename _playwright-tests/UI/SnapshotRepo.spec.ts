import { expect, test, cleanupRepositories, cleanupTemplates, randomName } from 'test-utils';
import { REPO_VALID_STATUS_TIMEOUT_MS, SNAPSHOT_DIALOG_TIMEOUT_MS } from '../testConstants';
import {
  navigateToRepositories,
  navigateToSnapshotsOfRepository,
  navigateToTemplates,
} from './helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  validateSnapshotTimestamp,
  waitForLastTaskStatus,
  waitForValidStatus,
} from './helpers/helpers';

test.describe('Snapshot Repositories', () => {
  test('Snapshot a repository', async ({ page, client, cleanup }) => {
    const repoNamePrefix = 'one';
    const repoRevision = 'one';
    const repoName = `${repoNamePrefix}-${randomName()}`;
    const editedRepoName = `${repoName}-edited`;
    const repoUrl = `https://jlsherrill.fedorapeople.org/fake-repos/revision/${repoRevision}/`;

    await cleanup.runAndAdd(() => cleanupRepositories(client, repoNamePrefix, repoUrl));
    await navigateToRepositories(page);
    await closeGenericPopupsIfExist(page);

    await test.step('Open the add repository modal', async () => {
      await page.getByRole('button', { name: 'Add repositories' }).first().click();
      await expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeVisible();
    });

    await test.step('Fill in the repository details', async () => {
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(repoName);
      await page.getByLabel('Introspect only').click();
      await page.getByRole('textbox', { name: 'URL', exact: true }).fill(repoUrl);
    });

    await test.step('Filter by architecture', async () => {
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'x86_64' }).click();
    });

    await test.step('Filter by OS version', async () => {
      await page.getByRole('button', { name: 'filter OS version' }).click();
      await page.getByRole('menuitem', { name: 'RHEL 9' }).click();
      await page.getByRole('menuitem', { name: 'RHEL 8' }).click();
      await page.getByRole('button', { name: 'filter OS version' }).click();
    });

    await test.step('Submit the form and wait for modal to disappear', async () => {
      await Promise.all([
        page.getByRole('button', { name: 'Save' }).first().click(),
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/bulk_create/') && resp.status() >= 200 && resp.status() < 300,
        ),
        expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeHidden(),
      ]);
    });

    await test.step('Enable snapshotting for the created repository', async () => {
      const row = await waitForValidStatus(page, repoName);
      await row.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Edit' }).click({ timeout: 60000 });
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(editedRepoName);
      await page.getByLabel('Snapshotting').click();
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    });

    await test.step('Trigger snapshot manually', async () => {
      const edited_row = await waitForValidStatus(page, editedRepoName);
      await edited_row.getByLabel('Kebab toggle').click();
      // Trigger a snapshot manually
      await page.getByRole('menuitem', { name: 'Trigger snapshot' }).click();
      await waitForValidStatus(page, editedRepoName);
      await navigateToSnapshotsOfRepository(page, edited_row);
      // Verify that snapshot is in snapshots list
      await expect(page.getByRole('dialog', { name: 'Snapshots' }).locator('tbody')).toBeVisible();
      const snapshotTimestamp = await page
        .getByRole('dialog', { name: 'Snapshots' })
        .locator('tbody')
        .textContent();
      if (snapshotTimestamp != null) {
        if ((await validateSnapshotTimestamp(snapshotTimestamp, 10)) == false) {
          throw new Error('Most recent snapshot timestamp is older than 10 minutes!');
        }
      } else {
        throw new Error('Snapshot timestamp not found!');
      }
      await page.getByLabel('Close', { exact: true }).click();
    });

    await test.step('Delete created repository', async () => {
      const edited_row = await getRowByNameOrUrl(page, repoUrl);
      await edited_row.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await expect(page.getByText('Delete repositories?')).toBeVisible();

      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('delete') && resp.status() >= 200 && resp.status() < 300,
        ),
        page.getByRole('button', { name: 'Delete' }).click(),
      ]);

      await expect(edited_row).toBeHidden();
    });
  });

  test('Snapshot deletion', async ({ page, client, cleanup }) => {
    const smallRHRepo = 'Red Hat CodeReady Linux Builder for RHEL 9 ARM 64 (RPMs)';
    const repoNamePrefix = 'snapshot-deletion';
    const templateNamePrefix = 'Test-template-for-snapshot-deletion';
    const repoName = `${repoNamePrefix}-${randomName()}`;
    const templateName = `${templateNamePrefix}-${randomName()}`;

    await cleanup.runAndAdd(() =>
      cleanupRepositories(
        client,
        repoNamePrefix,
        'https://fedorapeople.org/groups/katello/fakerepos/zoo',
      ),
    );
    await cleanup.runAndAdd(() => cleanupTemplates(client, templateNamePrefix));

    await navigateToRepositories(page);
    await closeGenericPopupsIfExist(page);

    await test.step('Create a repository', async () => {
      await page.getByRole('button', { name: 'Add repositories' }).first().click();
      await expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeVisible();
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(`${repoName}`);
      await page.getByLabel('Snapshotting').click();
      await page
        .getByRole('textbox', { name: 'URL', exact: true })
        .fill('https://fedorapeople.org/groups/katello/fakerepos/zoo/');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await waitForValidStatus(page, repoName, REPO_VALID_STATUS_TIMEOUT_MS);
    });

    await test.step('Edit the repository', async () => {
      for (let i = 2; i <= 4; i++) {
        await test.step(`Edit repository and create snapshot ${i}`, async () => {
          const row = await waitForValidStatus(page, repoName);

          await row.getByLabel('Kebab toggle').click();
          await page.getByRole('menuitem', { name: 'Edit' }).click();

          await page
            .getByRole('textbox', { name: 'URL', exact: true })
            .fill(`https://fedorapeople.org/groups/katello/fakerepos/zoo${i}/`);
          await page.getByRole('button', { name: 'Save changes', exact: true }).click();
        });
      }

      const row = await waitForValidStatus(page, repoName);
      await navigateToSnapshotsOfRepository(page, row);
      await expect(page.getByRole('button', { name: '1 - 4 of 4' }).first()).toBeVisible({
        timeout: SNAPSHOT_DIALOG_TIMEOUT_MS,
      });
    });

    await test.step('Create a template', async () => {
      await navigateToTemplates(page);
      await page.getByRole('button', { name: 'Create template' }).click();
      await page.getByRole('button', { name: 'filter OS version' }).click();
      await page.getByRole('menuitem', { name: 'RHEL 9' }).click();
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'aarch64' }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      const modalPage = page.getByTestId('add_template_modal');
      const rowRHELRepo = await getRowByNameOrUrl(modalPage, smallRHRepo);
      await rowRHELRepo.getByLabel('Select row').click();
      // wait till next button is enabled
      await page.getByRole('button', { name: 'Next', exact: true }).isEnabled();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await expect(page.getByTestId('custom_repositories_step')).toBeVisible();
      const customRepo = await getRowByNameOrUrl(modalPage, repoName);
      await customRepo.getByLabel('Select row').click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await expect(page.getByTestId('set_up_date')).toBeVisible();
      await page.getByTestId('use-latest-snapshot-radio').click();
      await page.getByRole('radio', { name: 'Use the latest content' }).check();
      await page.getByRole('button', { name: 'Next' }).click();

      await page.getByPlaceholder('Enter name').fill(`${templateName}`);
      await page.getByPlaceholder('Description').fill('Template test');
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();

      const templateRow = await waitForValidStatus(page, templateName);
      await expect(templateRow.getByText('Use latest')).toBeVisible();
    });

    // Test deletion of a single snapshot.
    await test.step('Delete a single snapshot', async () => {
      await navigateToRepositories(page);
      const row = await getRowByNameOrUrl(page, repoName);
      await navigateToSnapshotsOfRepository(page, row);
      await expect(page.getByRole('dialog', { name: 'Snapshots' }).locator('tbody')).toBeVisible();
      await page
        .getByTestId('snapshot_list_table')
        .locator('tbody tr')
        .first()
        .getByLabel('Kebab toggle')
        .click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await expect(page.getByText('Delete snapshots?')).toBeVisible();
      await page.getByText('Delete', { exact: true }).click();
      await expect(page.getByRole('button', { name: '1 - 3 of 3' }).first()).toBeVisible({
        timeout: SNAPSHOT_DIALOG_TIMEOUT_MS,
      });
      await page.getByText('Close').click();
    });

    await test.step('Bulk delete snapshot', async () => {
      const row = await getRowByNameOrUrl(page, repoName);
      await navigateToSnapshotsOfRepository(page, row);

      const snapshotsDialog = page.getByRole('dialog', { name: 'Snapshots' });
      await expect(snapshotsDialog.locator('tbody')).toBeVisible();

      // Select all snapshots
      await page.locator('[name="bulk-select-snapshots-checkbox"]').click();

      // Verify that you can't delete all snapshots
      // Bulk delete button is disabled
      await snapshotsDialog.getByRole('button', { name: 'Actions' }).click();
      const deleteItemDisabled = page.locator('li[data-ouia-component-id="remove_snapshots_bulk"]');
      await expect(deleteItemDisabled).toHaveText("Can't delete all snapshots");
      await expect(deleteItemDisabled.locator('button')).toBeDisabled();

      // Close the dropdown (click toggle again)
      await snapshotsDialog.getByRole('button', { name: 'Actions' }).click();

      // Therefore uncheck the first snapshot
      await page.getByRole('checkbox', { name: 'Select row 0' }).uncheck();

      // Open Actions dropdown and click delete
      await snapshotsDialog.getByRole('button', { name: 'Actions' }).click();
      const deleteItemEnabled = page.locator('li[data-ouia-component-id="remove_snapshots_bulk"]');
      await expect(deleteItemEnabled).toHaveText('Delete 2 snapshots');
      await deleteItemEnabled.locator('button').click();

      // Another delete confirm modal shows up
      await expect(page.getByText('Delete snapshots?')).toBeVisible();

      await waitForLastTaskStatus(client, 'delete-snapshots', 'completed');
      await page.getByText('Delete', { exact: true }).click();

      await expect(page.getByRole('button', { name: '1 - 1 of 1' }).first()).toBeVisible({
        timeout: SNAPSHOT_DIALOG_TIMEOUT_MS,
      });
      await page.getByText('Close').click();
    });
  });
});
