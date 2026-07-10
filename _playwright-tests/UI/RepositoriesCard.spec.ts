import { test, expect } from 'test-utils';
import { navigateToTemplates } from './helpers/navHelpers';
import { closeGenericPopupsIfExist } from './helpers/helpers';

test.describe('RepositoriesCard', () => {
  test('shows card with title and category labels, and navigates on manage click', async ({
    page,
  }) => {
    await test.step('Navigate to templates page', async () => {
      await navigateToTemplates(page);
      await closeGenericPopupsIfExist(page);
    });

    await test.step('Card title and three repository category labels are visible', async () => {
      await expect(page.getByText('Available repositories')).toBeVisible();
      await expect(page.getByText('Red Hat repositories')).toBeVisible();
      await expect(page.getByText('Partner repositories')).toBeVisible();
      await expect(page.getByText('Custom repositories')).toBeVisible();
    });

    await test.step('Clicking Manage Repositories navigates to the repositories page', async () => {
      await page.getByRole('button', { name: 'Manage repositories' }).click();
      await expect(page).toHaveURL(/\/repositories/);
    });
  });
});
