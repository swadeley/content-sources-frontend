import { test } from 'test-utils';
import { navigateToSystems } from './helpers/navHelpersPatch';
import { closePopupsIfExist } from './helpers/helpers';

test.describe('Systems Remediation Plan Disabled', () => {
  test('Navigate to systems, ensure the Plan remediation button cannot be clicked', async ({
    page,
  }) => {
    await navigateToSystems(page);
    await closePopupsIfExist(page);
    await page.getByRole('button', { name: 'Plan remediation' }).isDisabled();
  });
});
