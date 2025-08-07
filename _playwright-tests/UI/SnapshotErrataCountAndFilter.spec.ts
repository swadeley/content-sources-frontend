import { test, expect } from 'test-utils';
import { cleanupRepositories, randomName } from 'test-utils/helpers';
import { navigateToRepositories } from './helpers/navHelpers';
import { closePopupsIfExist, getRowByNameOrUrl } from './helpers/helpers';

test.describe('Snapshot Errata Count and Filter', () => {
  test('Verify errata count matches after snapshotting and test filtering', async ({
    page,
    client,
    cleanup,
  }) => {
    const repoNamePrefix = 'errata-count-test';
    const firstSnapshotName = `${repoNamePrefix}-first-${randomName()}`;
    const secondSnapshotName = `${repoNamePrefix}-second-${randomName()}`;

    const firstRepoUrl = 'https://jlsherrill.fedorapeople.org/fake-repos/needed-errata/'; // 4 errata
    const secondRepoUrl = 'https://stephenw.fedorapeople.org/fakerepos/multiple_errata/'; // 6 errata

    await cleanup.runAndAdd(() =>
      cleanupRepositories(client, repoNamePrefix, firstRepoUrl, secondRepoUrl),
    );
    await navigateToRepositories(page);
    await closePopupsIfExist(page);

    await test.step('Create repository with first snapshot (4 errata)', async () => {
      await page.getByRole('button', { name: 'Add repositories' }).first().click();
      await expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeVisible();

      const addRepoModal = page.getByRole('dialog', { name: 'Add custom repositories' });
      await addRepoModal.getByLabel('Name').fill(firstSnapshotName);
      await addRepoModal.getByLabel('Snapshotting').click();
      await addRepoModal.getByLabel('URL').fill(firstRepoUrl);

      await addRepoModal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(addRepoModal).not.toBeVisible();
    });

    await test.step('Wait for repository to be valid and verify errata count', async () => {
      const row = await getRowByNameOrUrl(page, firstSnapshotName);
      await expect(row.getByText('Valid')).toBeVisible({ timeout: 180_000 });

      await row.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'View all snapshots' }).click();

      await expect(page.getByLabel('SnapshotsView list of').locator('tbody')).toBeVisible();

      const errataCountButton = page.getByTestId('snapshot_advisory_count_button');
      await expect(errataCountButton).toBeVisible();
      const errataCount = await errataCountButton.textContent();
      expect(errataCount?.trim()).toBe('4');

      await page
        .getByRole('dialog', { name: 'Snapshots' })
        .getByRole('contentinfo')
        .getByRole('button', { name: 'Close' })
        .click();
    });

    await test.step('Edit repository to second snapshot URL (6 errata)', async () => {
      const row = await getRowByNameOrUrl(page, firstSnapshotName);
      await row.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      const editRepoModal = page.getByRole('dialog', { name: 'Edit custom repository' });
      await expect(editRepoModal).toBeVisible();

      await editRepoModal.getByLabel('Name').fill(secondSnapshotName);
      await editRepoModal.getByLabel('URL').fill(secondRepoUrl);

      await editRepoModal.getByRole('button', { name: 'Save changes', exact: true }).click();
      await expect(editRepoModal).not.toBeVisible();
    });

    await test.step('Verify edited repository has 6 errata', async () => {
      const editedRow = await getRowByNameOrUrl(page, secondSnapshotName);
      await expect(editedRow.getByText('Valid')).toBeVisible({ timeout: 180_000 });

      await editedRow.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'View all snapshots' }).click();

      const errataCountButton = page.getByTestId('snapshot_advisory_count_button').first();
      await expect(errataCountButton).toBeVisible();
      const errataCount = await errataCountButton.textContent();
      expect(errataCount?.trim()).toBe('6');
    });

    await test.step('Test errata name filtering', async () => {
      const errataCountButton = page.getByTestId('snapshot_advisory_count_button').first();
      await errataCountButton.click();

      const snapshotListModal = page.getByRole('dialog', { name: 'Snapshot detail' });
      await expect(snapshotListModal).toBeVisible();

      await snapshotListModal.getByTestId('advisories_tab').first().click();

      await expect(
        page.getByRole('tabpanel', { name: 'Snapshot errata detail tab' }),
      ).toBeVisible();
      const unfilteredRows = snapshotListModal.getByRole('row');
      const unfilteredCount = await unfilteredRows.count();
      expect(unfilteredCount).toBeGreaterThan(1);

      const nameFilter = snapshotListModal.getByPlaceholder('Filter by name/synopsis');
      await nameFilter.fill('0055');

      await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();

      await expect(page.getByTestId('errata_table')).toBeVisible();

      const matchingErrata = snapshotListModal
        .getByRole('gridcell', { name: 'RHSA-2012:' })
        .getByText(/.*0055.*/);
      await expect(matchingErrata).toBeVisible();

      await snapshotListModal.getByRole('button', { name: 'Clear filters' }).click();
      await expect(
        snapshotListModal.getByRole('button', { name: 'Clear filters' }),
      ).not.toBeVisible();
    });

    await test.step('Test errata type filtering', async () => {
      const snapshotListModal = page.getByRole('dialog', { name: 'Snapshot detail' });

      await snapshotListModal.getByTestId('filter_type_toggle').click();
      await page.getByRole('menuitem', { name: 'Type' }).click();

      await snapshotListModal.getByTestId('filter_by_type').click();
      await page.getByRole('checkbox', { name: 'Security' }).check();
      await page.getByRole('checkbox', { name: 'Bugfix' }).check();

      await expect(snapshotListModal.getByRole('button', { name: 'Clear filters' })).toBeVisible();

      const rhsaRows = page.getByRole('gridcell').filter({ hasText: /RHSA-2012/ });
      await expect(rhsaRows).toHaveCount(3, { timeout: 5000 });

      const rhbaRows = page.getByRole('gridcell').filter({ hasText: /RHBA-2012/ });
      await expect(rhbaRows).toHaveCount(1, { timeout: 5000 });

      await snapshotListModal.getByRole('button', { name: 'Clear filters' }).click();
    });

    await test.step('Test errata severity filtering', async () => {
      const snapshotListModal = page.getByRole('dialog', { name: 'Snapshot details' });

      await snapshotListModal.getByTestId('filter_type_toggle').click();
      await page.getByRole('menuitem', { name: 'Severity' }).click();

      await snapshotListModal.getByTestId('filter_by_severity').click();
      await page.getByRole('checkbox', { name: 'Critical' }).check();
      await page.getByRole('checkbox', { name: 'Low' }).check();
      await snapshotListModal.getByTestId('filter_by_severity').click();

      await expect(snapshotListModal.getByRole('button', { name: 'Clear filters' })).toBeVisible();

      const rhsa2012Row = page
        .getByRole('row')
        .filter({ has: page.getByRole('gridcell', { name: 'RHSA-2012:' }) });
      await expect(rhsa2012Row.getByRole('gridcell', { name: 'Critical' })).toBeVisible();

      const rhsa2009Row = page
        .getByRole('row')
        .filter({ has: page.getByRole('gridcell', { name: 'RHSA-2009:' }) });
      await expect(rhsa2009Row.getByRole('gridcell', { name: 'Low' })).toBeVisible();

      await page.getByRole('button', { name: 'Clear filters' }).click();
    });

    await test.step('Close snapshot details modal', async () => {
      await page
        .getByRole('dialog', { name: 'Snapshot details' })
        .getByRole('contentinfo')
        .getByRole('button', { name: 'Close' })
        .click();
      await expect(page.getByRole('dialog', { name: 'Snapshot detail' })).not.toBeVisible();
    });
  });
});
