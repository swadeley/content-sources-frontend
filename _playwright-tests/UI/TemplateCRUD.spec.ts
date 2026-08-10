import { test, expect } from 'test-utils';

import { cleanupRepositories, cleanupTemplates, randomName } from 'test-utils/helpers';

import { navigateToRepositories, navigateToTemplates } from './helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  waitForValidStatus,
} from './helpers/helpers';
import { createCustomRepo } from './helpers/createRepositories';

const templateNamePrefix = 'template_CRUD';
const repoNamePrefix = 'custom_repo-template';

const repoName = `${repoNamePrefix}-aarch64-${randomName()}`;
const repoNameX86 = `${repoNamePrefix}-x86_64-${randomName()}`;
const repoNameNoSnaps = `${repoNamePrefix}-introspect-only-${randomName()}`;
const templateName = `${templateNamePrefix}-${randomName()}`;

const smallRHRepo = 'Red Hat CodeReady Linux Builder for RHEL 9 ARM 64 (RPMs)';

test.describe('Templates CRUD', () => {
  test('Navigate to templates, ensure the Create template button can be clicked', async ({
    page,
  }) => {
    await navigateToTemplates(page);
    await closeGenericPopupsIfExist(page);

    const AddButton = page.getByRole('button', { name: 'Create template' });

    await expect(AddButton.first()).toBeEnabled({ timeout: 10000 });
  });

  test('Add, Read, update, delete a template', async ({ page, client, cleanup, unusedRepoUrl }) => {
    await test.step('Delete any templates and template test repos that exist', async () => {
      await cleanup.runAndAdd(() => cleanupRepositories(client, repoNamePrefix));
      await cleanup.runAndAdd(() => cleanupTemplates(client, templateNamePrefix));
    });

    await test.step('Create repositories', async () => {
      await navigateToRepositories(page);
      await closeGenericPopupsIfExist(page);

      // Create first repo (aarch64, with snapshot)
      await createCustomRepo(page, repoName, unusedRepoUrl);
      await waitForValidStatus(page, repoName);

      // Create second repo (x86_64, with snapshot)
      const repoDataX86 = {
        distribution_arch: 'x86_64',
        distribution_versions: ['8', '9'],
        name: repoNameX86,
        origin: 'external',
        snapshot: true,
        url: await unusedRepoUrl(),
      };
      await page.request.post('/api/content-sources/v1/repositories/', {
        data: repoDataX86,
        headers: { 'Content-Type': 'application/json' },
      });
      await waitForValidStatus(page, repoNameX86);

      // Create third repo ( Any arch, introspect only, no snapshots )
      const repoDataNoSnaps = {
        distribution_arch: '',
        distribution_versions: ['8', '9'],
        name: repoNameNoSnaps,
        origin: 'external',
        snapshot: false,
        url: await unusedRepoUrl(),
      };
      await page.request.post('/api/content-sources/v1/repositories/', {
        data: repoDataNoSnaps,
        headers: { 'Content-Type': 'application/json' },
      });
      await waitForValidStatus(page, repoNameNoSnaps);
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
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      // Select first custom repo (aarch64)
      const rowRepo = await getRowByNameOrUrl(modalPage, repoName);
      await rowRepo.getByLabel('Select row').click();

      // Verify repo without snapshots appears but checkbox is disabled
      const rowNoSnaps = await getRowByNameOrUrl(modalPage, repoNameNoSnaps);
      await expect(rowNoSnaps).toBeVisible();
      const noSnapsCheckbox = rowNoSnaps.getByLabel('Select row');
      await expect(noSnapsCheckbox).toBeDisabled();
      // Verify warning message appears on hover
      await noSnapsCheckbox.hover();
      await expect(page.getByText('Snapshot not yet available for this repository')).toBeVisible();

      // Verify x86 repo cannot be added due to architecture mismatch (should not appear)
      await modalPage.getByRole('searchbox', { name: 'Filter by name or URL' }).clear();
      await modalPage.getByRole('searchbox', { name: 'Filter by name or URL' }).fill(repoNameX86);
      await expect(
        modalPage.getByText('No custom repositories match the filter criteria', { exact: false }),
      ).toBeVisible();
      // Also verify the x86 repo row is not visible in the table
      await expect(modalPage.getByText(repoNameX86)).toBeHidden();

      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByText('Use the latest content', { exact: true }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByText('Enter template details')).toBeVisible();
      await page.getByPlaceholder('Enter name').fill(`${templateName}`);
      await page.getByPlaceholder('Enter name').press('Enter');
      await page.getByPlaceholder('Description').fill('Template test');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();
      await waitForValidStatus(page, templateName);
    });

    await test.step('Read and update values in the template', async () => {
      const rowTemplate = await getRowByNameOrUrl(page, templateName);
      await rowTemplate.getByRole('button', { name: templateName }).click();
      await expect(page.getByLabel('Breadcrumb').first()).toHaveText(
        'Red Hat Hybrid Cloud ConsoleRHELContentTemplates',
      );
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(templateName);
      await expect(page.getByText('Description')).toBeVisible();
      await expect(page.getByText('Template test')).toBeVisible();
      await page.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await expect(
        page.getByRole('heading', { name: 'OS and architecture', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Additional Red Hat repositories', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Other repositories', exact: true }),
      ).toBeVisible();
      // Verify only the aarch64 custom repo is in the template
      const modalPage = page.getByTestId('edit_template_modal');
      await expect(modalPage.getByRole('button', { name: 'Selected' })).toBeEnabled();
      await modalPage.getByRole('button', { name: 'Selected' }).click();
      await expect(page.getByText(`${repoName}`)).toBeVisible();
      await expect(
        modalPage.getByRole('grid', { name: 'custom repositories table' }).locator('tbody tr'),
      ).toHaveCount(1);
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Set up date', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByText('Enter template details')).toBeVisible();
      await expect(page.getByPlaceholder('Enter name')).toHaveValue(`${templateName}`);
      await expect(page.getByPlaceholder('Description')).toHaveValue('Template test');
      await page.getByPlaceholder('Enter name').fill(`${templateName}-edited`);
      await page.getByPlaceholder('Description').fill('Template test edited');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm changes', exact: true }).click();
    });

    await test.step('Delete the template', async () => {
      await navigateToTemplates(page);
      const rowTemplate = await waitForValidStatus(page, `${templateName}-edited`);
      await rowTemplate.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await expect(page.getByText('Delete template?')).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).click();
      await expect(rowTemplate.getByText('Valid')).toBeHidden();
    });
  });

  test('Copying templates', async ({ page, client, cleanup, unusedRepoUrl }) => {
    const copyRepoNamePrefix = 'copy-template-custom-repo';
    const copyRepoName = `${copyRepoNamePrefix}-${randomName()}`;
    const copyTemplateNamePrefix = 'copy-template-test';
    const copyTemplateName = `${copyTemplateNamePrefix}-${randomName()}`;
    const templateDescription = 'To be copied..';
    const copyName = `copied-template-${randomName()}`;

    await test.step('Pre-test setup', async () => {
      await cleanup.runAndAdd(() => cleanupRepositories(client, copyRepoNamePrefix));
      await cleanup.runAndAdd(() => cleanupTemplates(client, copyTemplateName));
      await cleanup.runAndAdd(() => cleanupTemplates(client, copyName));
    });

    await test.step('Create testing repo', async () => {
      await navigateToRepositories(page);
      await closeGenericPopupsIfExist(page);

      await createCustomRepo(page, copyRepoName, unusedRepoUrl);
      await waitForValidStatus(page, copyRepoName);
    });

    await test.step('Navigate to the templates page', async () => {
      await navigateToTemplates(page);
      await closeGenericPopupsIfExist(page);
    });

    await test.step('Create a template', async () => {
      await page.getByRole('button', { name: 'Create template' }).click();
      await page.getByRole('button', { name: 'filter OS version' }).click();
      await page.getByRole('menuitem', { name: 'RHEL 9' }).click();
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'aarch64' }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      const modalPage = page.getByTestId('add_template_modal');
      const rowRHELRepo = await getRowByNameOrUrl(modalPage, smallRHRepo);
      await rowRHELRepo.getByLabel('Select row').click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      const rowRepo = await getRowByNameOrUrl(modalPage, copyRepoName);
      await rowRepo.getByLabel('Select row').click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByText('Use the latest content', { exact: true }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await expect(page.getByText('Enter template details')).toBeVisible();
      await page.getByPlaceholder('Enter name').fill(copyTemplateName);
      await page.getByPlaceholder('Enter name').press('Enter');
      await page.getByPlaceholder('Description').fill(templateDescription);
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();

      await waitForValidStatus(page, copyTemplateName);
    });

    await test.step('Copy the created template, verify the modal is correctly pre-filled', async () => {
      const rowTemplate = await waitForValidStatus(page, copyTemplateName);
      await rowTemplate.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Copy' }).click();

      const modal = page.getByTestId('add_template_modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('Enter template details')).toBeVisible();
      await expect(modal.getByText('A template with this name already exists.')).toBeVisible();

      await modal.getByRole('button', { name: 'Content', exact: true }).click();
      await modal.getByRole('button', { name: 'OS and architecture', exact: true }).click();

      await expect(modal.getByText('RHEL 9')).toBeVisible();
      await expect(modal.getByText('aarch64')).toBeVisible();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      const rowRHELRepo = await getRowByNameOrUrl(modal, smallRHRepo);
      await expect(rowRHELRepo.getByLabel('Select row')).toBeChecked();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      const rowRepo = await getRowByNameOrUrl(modal, copyRepoName);
      await expect(rowRepo.getByLabel('Select row')).toBeChecked();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      await expect(modal.getByLabel('Use the latest content')).toBeChecked();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      await modal.getByPlaceholder('Enter name').fill(copyName);
      await expect(modal.getByText('A template with this name already exists.')).toBeHidden();
      await expect(modal.getByText(templateDescription)).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();

      await waitForValidStatus(page, copyName);
    });
  });
});
