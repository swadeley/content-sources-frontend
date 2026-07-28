import { test, expect, cleanupRepositories, randomName } from 'test-utils';
import {
  docsRedhatUrlMatcher,
  MANAGING_CONTENT_AND_PATCH_GUIDE,
  USING_CONTENT_TEMPLATES_PAGE,
} from 'constants/docs';
import { closeGenericPopupsIfExist, waitForValidStatus } from '../UI/helpers/helpers';
import { getZeroStateTitleLocator } from '../UI/helpers/navHelpers';
import { PAGE_NAVIGATION_TIMEOUT_MS, PAGE_READY_TIMEOUT_MS } from '../testConstants';

const repoNamePrefix = 'ZeroStateTest';

test.describe('No-subs user content management', () => {
  test.skip(
    !process.env.INTEGRATION || !process.env.RBAC,
    `Skipping as the INTEGRATION and RBAC environment variables aren't both set to true.`,
  );
  test.use({
    storageState: '.auth/NO_SUBS_TOKEN.json',
    extraHTTPHeaders: process.env.NO_SUBS_TOKEN ? { Authorization: process.env.NO_SUBS_TOKEN } : {},
  });
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, client, cleanup }) => {
    await cleanup.runAndAdd(() => cleanupRepositories(client, repoNamePrefix));
    await closeGenericPopupsIfExist(page);
  });

  test.describe('Zero state', () => {
    test('Zero state is shown on repositories and templates routes', async ({ page }) => {
      await test.step('Repositories route shows zero state', async () => {
        await page.goto('/insights/content/repositories', {
          timeout: PAGE_NAVIGATION_TIMEOUT_MS,
        });

        await expect(getZeroStateTitleLocator(page)).toBeVisible({
          timeout: PAGE_READY_TIMEOUT_MS,
        });
        await expect(page.getByRole('heading', { name: 'About content templates' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'About repositories' })).toBeVisible();
        await expect(
          page.getByText('View all repositories within your organization.'),
        ).toBeHidden();
      });

      await test.step('Templates route shows zero state', async () => {
        await page.goto('/insights/content/templates', { timeout: PAGE_NAVIGATION_TIMEOUT_MS });

        await expect(getZeroStateTitleLocator(page)).toBeVisible({
          timeout: PAGE_READY_TIMEOUT_MS,
        });
        await expect(page.getByRole('heading', { name: 'About content templates' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'About repositories' })).toBeVisible();
        await expect(
          page.getByText('View all content templates within your organization.'),
        ).toBeHidden();
      });
    });

    test('Zero state documentation link opens Red Hat docs', async ({ page, context }) => {
      await page.goto('/insights/content/templates', { timeout: PAGE_NAVIGATION_TIMEOUT_MS });

      await expect(getZeroStateTitleLocator(page)).toBeVisible({
        timeout: PAGE_READY_TIMEOUT_MS,
      });

      const pagePromise = context.waitForEvent('page');

      await page
        .getByRole('link', {
          name: 'Learn more about managing system content and patch updates',
        })
        .click();

      const docsPage = await pagePromise;
      await expect(docsPage).toHaveURL(docsRedhatUrlMatcher(MANAGING_CONTENT_AND_PATCH_GUIDE));
      await expect(docsPage.getByText(/system content and patch updates/i).first()).toBeVisible();
    });

    test('Zero state call to action (CTA) buttons navigate to list pages', async ({ page }) => {
      await test.step('Add repositories CTA shows repositories list', async () => {
        await page.goto('/insights/content/repositories', {
          timeout: PAGE_NAVIGATION_TIMEOUT_MS,
        });

        await expect(getZeroStateTitleLocator(page)).toBeVisible({
          timeout: PAGE_READY_TIMEOUT_MS,
        });

        await page
          .getByRole('button', { name: 'Add repositories', exact: true })
          .click({ noWaitAfter: true });

        await expect(getZeroStateTitleLocator(page)).toBeHidden();
        await expect(page.getByText('View all repositories within your organization.')).toBeVisible(
          {
            timeout: PAGE_READY_TIMEOUT_MS,
          },
        );
      });

      await test.step('Create template CTA shows templates list', async () => {
        await page.goto('/insights/content/templates', { timeout: PAGE_NAVIGATION_TIMEOUT_MS });

        await expect(getZeroStateTitleLocator(page)).toBeVisible({
          timeout: PAGE_READY_TIMEOUT_MS,
        });

        await page
          .getByRole('button', { name: 'Create template', exact: true })
          .click({ noWaitAfter: true });

        await expect(getZeroStateTitleLocator(page)).toBeHidden();
        await expect(
          page.getByText('View all content templates within your organization.'),
        ).toBeVisible({ timeout: PAGE_READY_TIMEOUT_MS });
      });
    });
  });

  test('Empty templates table documentation link opens Red Hat docs', async ({
    page,
    context,
    unusedRepoUrl,
  }) => {
    const repoName = `${repoNamePrefix}-${randomName()}`;
    const url = await unusedRepoUrl();

    await test.step('Add a custom repository to exit zero state', async () => {
      await page.goto('/insights/content/repositories', {
        timeout: PAGE_NAVIGATION_TIMEOUT_MS,
      });

      await page
        .getByRole('button', { name: 'Add repositories', exact: true })
        .click({ noWaitAfter: true });
      await expect(page.getByText('View all repositories within your organization.')).toBeVisible({
        timeout: PAGE_READY_TIMEOUT_MS,
      });

      await page
        .getByRole('button', { name: 'Add repositories', exact: true })
        .click({ noWaitAfter: true });
      await expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeVisible();

      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(repoName);
      await page.getByLabel('Introspect only').click();
      await page.getByRole('textbox', { name: 'URL', exact: true }).fill(`${url}`);
      await page.getByRole('button', { name: 'Save', exact: true }).click();

      await waitForValidStatus(page, repoName);
    });

    await test.step('Templates list shows the empty table state', async () => {
      await page.goto('/insights/content/templates', { timeout: PAGE_NAVIGATION_TIMEOUT_MS });

      await expect(getZeroStateTitleLocator(page)).toBeHidden();
      await expect(
        page.getByText('View all content templates within your organization.'),
      ).toBeVisible({ timeout: PAGE_READY_TIMEOUT_MS });
      await expect(
        page.getByRole('link', { name: 'Learn more about content templates' }),
      ).toBeVisible();
    });

    await test.step(`Click the 'Learn more about content templates' link and verify the destination`, async () => {
      const pagePromise = context.waitForEvent('page');

      await page.getByRole('link', { name: 'Learn more about content templates' }).click();
      const docsPage = await pagePromise;
      await expect(docsPage).toHaveURL(docsRedhatUrlMatcher(USING_CONTENT_TEMPLATES_PAGE));
      await expect(docsPage.getByText(/content templates/i).first()).toBeVisible();
    });
  });

  test('Zero state is exited after adding a repository and requires a subscription to create templates', async ({
    page,
    unusedRepoUrl,
  }) => {
    const repoName = `${repoNamePrefix}-${randomName()}`;
    const url = await unusedRepoUrl();

    await test.step('Zero state is shown before any custom repositories exist', async () => {
      await page.goto('/insights/content/repositories', {
        timeout: PAGE_NAVIGATION_TIMEOUT_MS,
      });

      await expect(getZeroStateTitleLocator(page)).toBeVisible({
        timeout: PAGE_READY_TIMEOUT_MS,
      });
    });

    await test.step('Create a custom repository', async () => {
      await page
        .getByRole('button', { name: 'Add repositories', exact: true })
        .click({ noWaitAfter: true });
      await expect(page.getByText('View all repositories within your organization.')).toBeVisible({
        timeout: PAGE_READY_TIMEOUT_MS,
      });

      await page
        .getByRole('button', { name: 'Add repositories', exact: true })
        .click({ noWaitAfter: true });
      await expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeVisible();

      await page.getByRole('textbox', { name: 'Name', exact: true }).fill(repoName);
      await page.getByLabel('Introspect only').click();
      await page.getByRole('textbox', { name: 'URL', exact: true }).fill(`${url}`);
      await page.getByRole('button', { name: 'Save', exact: true }).click();

      await waitForValidStatus(page, repoName);
    });

    await test.step('Zero state is no longer shown after a custom repository exists', async () => {
      await page.goto('/insights/content/repositories', {
        timeout: PAGE_NAVIGATION_TIMEOUT_MS,
      });

      await expect(getZeroStateTitleLocator(page)).toBeHidden();
      await expect(page.getByText('View all repositories within your organization.')).toBeVisible({
        timeout: PAGE_READY_TIMEOUT_MS,
      });

      await page.goto('/insights/content/templates', { timeout: PAGE_NAVIGATION_TIMEOUT_MS });

      await expect(getZeroStateTitleLocator(page)).toBeHidden();
      await expect(
        page.getByText('View all content templates within your organization.'),
      ).toBeVisible({ timeout: PAGE_READY_TIMEOUT_MS });
    });

    await test.step('Create template toolbar button is disabled without a RHEL subscription', async () => {
      const createTemplateButton = page
        .getByRole('button', { name: 'Create template', exact: true })
        .first();

      await expect(createTemplateButton).toBeVisible();
      await expect(createTemplateButton).toBeDisabled({ timeout: 1000 });
      // eslint-disable-next-line playwright/no-force-option
      await createTemplateButton.hover({ force: true });

      const tooltip = page.getByRole('tooltip');
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveText(
        'You do not have the required subscription (RHEL) to perform this action.',
      );
    });
  });
});
