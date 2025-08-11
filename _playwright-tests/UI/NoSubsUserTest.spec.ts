import { test, expect } from 'test-utils';
import { navigateToTemplates } from './helpers/navHelpers';
import { closePopupsIfExist } from './helpers/helpers';

test.describe('Template use requires a RHEL subscription', () => {
  test.skip(!process.env.RBAC, `Skipping as the RBAC environment variable isn't set to true.`);
  test.use({
    storageState: '.auth/no_subs_user.json',
    extraHTTPHeaders: process.env.NO_SUBS_TOKEN ? { Authorization: process.env.NO_SUBS_TOKEN } : {},
  });

  test('Navigate to Templates, ensure the "Add content template" button is disabled', async ({
    page,
  }) => {
    await navigateToTemplates(page);
    await closePopupsIfExist(page);

    const AddButton = page.getByRole('button', { name: 'Create template', exact: true });
    await expect(AddButton).toBeVisible();
    await expect(AddButton).not.toBeEnabled({ timeout: 1000 });
    await AddButton.hover({ force: true });
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(
      'You do not have the required subscription (RHEL) to perform this action.',
    );
  });
});
