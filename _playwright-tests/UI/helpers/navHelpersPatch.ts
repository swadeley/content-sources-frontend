import { type Page } from '@playwright/test';
import { test } from 'test-utils';
import { retry } from './helpers';

const navigateToSystemsFunc = async (page: Page) => {
  await page.goto('/insights/patch/systems', { timeout: 10000 });
  const systemText = page.getByText('Systems up to date');
  await systemText.waitFor({ state: 'visible', timeout: 90000 });
};

export const navigateToSystems = async (page: Page) => {
  await test.step(
    `Navigating to Systems`,
    async () => {
      try {
        const systemsNavLink = page.getByRole('navigation').getByRole('link', { name: 'Systems' });
        await systemsNavLink.waitFor({ state: 'visible', timeout: 1500 });
        await systemsNavLink.click();
      } catch {
        await retry(page, navigateToSystemsFunc, 5);
      }
    },
    {
      box: true,
    },
  );
};
