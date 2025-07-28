import { test, expect, RpmsApi, ApiSearchRpmResponse } from 'test-utils';

test.describe('Check NodeJS Date Format', () => {
  test('Verify RHEL9 nodejs modules have lifecycle dates', async ({ client }) => {
    const repoUrl = 'https://cdn.redhat.com/content/dist/rhel9/9/aarch64/appstream/os/';

    let repositoryRpmSearch: ApiSearchRpmResponse[];
    await test.step('Search for nodejs in repository using include_package_sources', async () => {
      repositoryRpmSearch = await new RpmsApi(client).searchRpm({
        apiContentUnitSearchRequest: {
          search: 'nodejs',
          urls: [repoUrl],
          includePackageSources: true,
        },
      });

      expect(repositoryRpmSearch.length).toBeGreaterThan(0);

      const nodejsPackage = repositoryRpmSearch.find((pkg) => pkg.packageName?.includes('nodejs'));
      expect(nodejsPackage).toBeDefined();
      expect(nodejsPackage?.packageName).toContain('nodejs');
    });

    await test.step('Verify nodejs has both package and module type streams with lifecycle dates', async () => {
      const nodejsPackage = repositoryRpmSearch.find((pkg) => pkg.packageName?.includes('nodejs'));
      expect(nodejsPackage?.packageSources).toBeDefined();
      expect(nodejsPackage?.packageSources?.length).toBeGreaterThan(0);

      const packageSources = nodejsPackage?.packageSources || [];

      const packageTypeStream = packageSources.find((source) => source.type === 'package');
      expect(packageTypeStream).toBeDefined();
      expect(packageTypeStream?.type).toBe('package');

      const moduleTypeStream = packageSources.find(
        (source) => source.type === 'module' && source.stream === '18',
      );
      expect(moduleTypeStream).toBeDefined();
      expect(moduleTypeStream?.type).toBe('module');

      const expectedPackageStartDate = new Date('2022-05-17').getTime();
      const expectedModuleStartDate = new Date('2022-11-15').getTime();

      expect(new Date(packageTypeStream?.startDate || '').getTime()).toBe(expectedPackageStartDate);
      expect(new Date(moduleTypeStream?.startDate || '').getTime()).toBe(expectedModuleStartDate);

      const expectedPackageEndDate = new Date('2024-04-30').getTime();
      const expectedModuleEndDate = new Date('2025-04-30').getTime();

      expect(new Date(packageTypeStream?.endDate || '').getTime()).toBe(expectedPackageEndDate);
      expect(new Date(moduleTypeStream?.endDate || '').getTime()).toBe(expectedModuleEndDate);
    });
  });
});
