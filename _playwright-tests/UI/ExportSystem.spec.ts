import { test, expect } from 'test-utils';
import { navigateToSystems } from './helpers/navHelpersPatch';

test.describe('Export Systems List', () => {
  test('Navigate to systems, export list to CSV and JSON', async ({ page }) => {
    await navigateToSystems(page);
    await test.step('export list to CSV', async () => {
      await page.getByRole('button', { name: 'Export' }).click();
      await page.getByRole('menuitem', { name: 'Export to CSV' }).click();
      const preparingAlert = page.getByText(/Preparing export of CSV format/i, { exact: false });
      await expect(preparingAlert).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: 'close' }).first().click();
      const successAlert = page.getByText(/The exported CSV file is being downloaded/i, {
        exact: false,
      });
      await expect(successAlert).toBeVisible({ timeout: 30_000 });
      await page.getByRole('button', { name: 'close' }).first().click();
    });

    await test.step('export list to JSON', async () => {
      await page.getByRole('button', { name: 'Export' }).click();
      await page.getByRole('menuitem', { name: 'Export to JSON' }).click();
      const jsonPreparing = page.getByText(/Preparing export of JSON format/i, { exact: false });
      await expect(jsonPreparing).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: 'close' }).first().click();
      const jsonSuccess = page.getByText(/The exported JSON file is being downloaded/i, {
        exact: false,
      });
      await expect(jsonSuccess).toBeVisible({ timeout: 30_000 });
      await page.getByRole('button', { name: 'close' }).first().click();
    });
  });
});
