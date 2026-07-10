import { type Page, type Locator } from '@playwright/test';
import { test } from 'test-utils';
import {
  PAGE_NAVIGATION_TIMEOUT_MS,
  PAGE_NAVIGATION_QUICK_TIMEOUT_MS,
  PAGE_READY_TIMEOUT_MS,
} from '../../testConstants';
import { retry } from './helpers';

/** Locator for content zero state title (custom UI or dashboard default). */
export const getZeroStateTitleLocator = (page: Page) =>
  page.getByText(new RegExp(`Start using (content templates|Content management) now`));

export const getTemplatesTitleLocator = (page: Page) =>
  page.getByText(
    'Control content stability of your systems by combining repositories into templates.',
  );

export const goToTemplates = async (page: Page) =>
  await page.goto('/insights/content/templates', { timeout: PAGE_NAVIGATION_QUICK_TIMEOUT_MS });

const waitForListPageOrZeroState = async (
  page: Page,
  listPageLocator: Locator,
  zeroStateLocator: Locator,
  pageDescription: string,
) => {
  try {
    await Promise.race([
      listPageLocator.waitFor({ state: 'visible', timeout: PAGE_READY_TIMEOUT_MS }),
      zeroStateLocator.waitFor({ state: 'visible', timeout: PAGE_READY_TIMEOUT_MS }),
    ]);
  } catch (error) {
    throw new Error(
      `Neither ${pageDescription} nor zero state appeared: ${(error as Error)?.message}`,
    );
  }
};

const navigateToRepositoriesFunc = async (page: Page) => {
  await page.goto('/insights/content/repositories', { timeout: PAGE_NAVIGATION_TIMEOUT_MS });

  const zeroState = getZeroStateTitleLocator(page);
  const repositoriesListPage = page.getByText('View all repositories within your organization.');

  await waitForListPageOrZeroState(page, repositoriesListPage, zeroState, 'repositories list');

  if (await zeroState.isVisible()) {
    await page.getByRole('button', { name: /Add repositories/i }).click({ noWaitAfter: true });
    await repositoriesListPage.waitFor({ state: 'visible', timeout: PAGE_READY_TIMEOUT_MS });
  }
};

export const navigateToRepositories = async (page: Page) => {
  await test.step(
    `Navigating to repositories`,
    async () => {
      try {
        await page.route('https://consent.trustarc.com/**', (route) => route.abort());
        await page.route('https://smetrics.redhat.com/**', (route) => route.abort());

        await navigateToRepositoriesFunc(page);
      } catch {
        await retry(page, navigateToRepositoriesFunc, 5);
      }
    },
    {
      box: true,
    },
  );
};

const navigateToTemplatesFunc = async (page: Page) => {
  await goToTemplates(page);

  const zeroState = getZeroStateTitleLocator(page);
  const templateText = getTemplatesTitleLocator(page);

  await waitForListPageOrZeroState(page, templateText, zeroState, 'templates list');

  // On main, /templates always rendered the list. This branch shows zero state on that route too.
  if (await zeroState.isVisible()) {
    await page
      .getByRole('button', { name: 'Create template', exact: true })
      .click({ noWaitAfter: true });
    await templateText.waitFor({ state: 'visible', timeout: PAGE_READY_TIMEOUT_MS });
  }
};

export const navigateToTemplates = async (page: Page) => {
  await test.step(
    `Navigating to templates`,
    async () => {
      try {
        await page.route('https://consent.trustarc.com/**', (route) => route.abort());
        await page.route('https://smetrics.redhat.com/**', (route) => route.abort());

        await navigateToTemplatesFunc(page);
      } catch {
        await retry(page, navigateToTemplatesFunc, 5);
      }
    },
    {
      box: true,
    },
  );
};

export const navigateToSnapshotsOfRepository = async (page: Page, row: Locator) => {
  await test.step(`Navigating to snapshots of repository`, async () => {
    await row.getByRole('button', { name: 'Kebab toggle' }).click();
    await page.getByRole('menuitem', { name: 'View all snapshots' }).click();
  });
};
