import { test, expect } from 'test-utils';
import { ExecReturn } from './containers';
import { RHSMClient, refreshSubscriptionManager } from './rhsmClient';
import { DNF_COMMAND_TIMEOUT_MS, YUM_INSTALL_QUICK_TIMEOUT_MS } from '../../testConstants';

/**
 * Execute command on client. Log it as separate test step.
 * In case that return code is not as expected, log stdout, stderr and fail the step.
 **/
export const runCmd = async (
  stepName: string,
  cmd: string[],
  client: RHSMClient,
  timeout?: number,
  expectedRC: number = 0,
): Promise<ExecReturn | void> =>
  await test.step(stepName, async () => {
    const res = await client.Exec(cmd, timeout);

    if (!res) {
      console.error(`❌ ${stepName} failed with unknown error`);
      expect(false, `${stepName} failed`).toBeTruthy();
    } else if (res.exitCode !== expectedRC) {
      console.error(`❌ ${stepName} failed with exit code ${res.exitCode}`);
      console.error(res.stdout);
      console.error(res.stderr);

      expect(res.exitCode, `${stepName} failed`).toBe(expectedRC);
    } else {
      console.log(`✅ ${stepName} succeeded`);
      expect(res.exitCode, `${stepName} succeeded`).toBe(expectedRC);
    }

    return res;
  });

/**
 * Gets the download URL for a package from DNF repository metadata.
 *
 * **Note:** Does not validate command success. Returns empty string on failure.
 * Use inside `expect.poll()` when waiting for content propagation.
 *
 * @param regClient - RHSM client instance
 * @param packageName - Package name (e.g., 'vim-enhanced')
 * @returns Package download URL (could be empty if not found or command fails)
 */
export const getPackageDownloadUrl = async (regClient: RHSMClient, packageName: string) => {
  const result = await regClient.Exec(
    ['dnf', 'repoquery', '--quiet', '--location', packageName],
    DNF_COMMAND_TIMEOUT_MS,
  );

  return [result?.stdout, result?.stderr].filter(Boolean).join('\n');
};

/**
 * Installs a package and verifies installation succeeded.
 *
 * This is a package installation helper that:
 * 1. (Optional) Refreshes subscription manager and cleans DNF cache
 * 2. Verifies the package is not already installed
 * 3. Installs the package using yum
 * 4. Verifies the package was successfully installed
 *
 * @param regClient - RHSM client instance
 * @param packageName - Name of the package to install (e.g., 'vim-enhanced')
 * @param cleanAndRefresh - If true, refreshes subscription and cleans cache (default: false)
 * @param installTimeout - Timeout in ms for the yum installation command (default: YUM_INSTALL_QUICK_TIMEOUT_MS)
 */
export const installAndVerifyPackage = async ({
  regClient,
  packageName,
  cleanAndRefresh = false,
  installTimeout = YUM_INSTALL_QUICK_TIMEOUT_MS,
}: {
  regClient: RHSMClient;
  packageName: string;
  cleanAndRefresh?: boolean;
  installTimeout?: number;
}) => {
  if (cleanAndRefresh) {
    await refreshSubscriptionManager(regClient);
    await runCmd('Clean cached metadata', ['dnf', 'clean', 'all'], regClient);
  }

  await runCmd(
    `${packageName} should not be installed`,
    ['rpm', '-q', packageName],
    regClient,
    YUM_INSTALL_QUICK_TIMEOUT_MS,
    1,
  );

  console.log(
    `Installing ${packageName} with timeout ${installTimeout}ms (${(installTimeout / 1000).toFixed(0)}s)`,
  );
  const installStartedAt = Date.now();
  try {
    await runCmd(
      `Install ${packageName}`,
      ['yum', 'install', '-y', packageName],
      regClient,
      installTimeout,
    );
  } finally {
    const elapsedMs = Date.now() - installStartedAt;
    const remainingMs = installTimeout - elapsedMs;
    const pctOfLimit = ((elapsedMs / installTimeout) * 100).toFixed(1);
    console.log(
      `Install ${packageName} timing: elapsed=${elapsedMs}ms (${(elapsedMs / 1000).toFixed(1)}s), ` +
        `timeout=${installTimeout}ms, remaining=${remainingMs}ms, used=${pctOfLimit}% of limit`,
    );
  }

  await runCmd(`${packageName} should be installed`, ['rpm', '-q', packageName], regClient);
};
