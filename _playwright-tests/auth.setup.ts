import { expect, test as setup } from '@playwright/test';
import {
  ensureNotInPreview,
  storeStorageStateAndToken,
  throwIfMissingEnvVariables,
  logout,
  logInWithReadOnlyUser,
  logInWithAdminUser,
  logInWithRHELOperatorUser,
} from './helpers/loginHelpers';

import { existsSync, mkdirSync } from 'fs';
import path from 'path';
const authDir = '.auth';
if (!existsSync(authDir)) {
  mkdirSync(authDir);
}

setup.describe('Setup Authentication States', async () => {
  setup.describe.configure({ retries: 3 });

  setup('Ensure needed ENV variables exist', async () => {
    expect(() => throwIfMissingEnvVariables()).not.toThrow();
  });

  setup('Authenticate rhel-operator user and save state', async ({ page }) => {
    setup.skip(!process.env.RBAC, `Skipping as the RBAC environment variable isn't set to true.`);
    setup.setTimeout(60_000);

    // Login rhel-operator user
    await logInWithRHELOperatorUser(page);

    // Save state for rhel-operator user
    const { cookies } = await page
      .context()
      .storageState({ path: path.join(__dirname, '../../.auth', 'rhel_operator.json') });
    const rhelOperatorToken = cookies.find((cookie) => cookie.name === 'cs_jwt')?.value;

    process.env.RHEL_OPERATOR_TOKEN = `Bearer ${rhelOperatorToken}`;

    await storeStorageStateAndToken(page, 'rhel_operator.json');
    await logout(page);
  });

  setup('Authenticate read-only user and save state', async ({ page }) => {
    setup.skip(!process.env.RBAC, `Skipping as the RBAC environment variable isn't set to true.`);
    setup.setTimeout(60_000);

    // Login read-only user
    await logInWithReadOnlyUser(page);

    // Save state for read-only user
    const { cookies } = await page
      .context()
      .storageState({ path: path.join(__dirname, '../../.auth', 'read-only.json') });
    const readOnlyToken = cookies.find((cookie) => cookie.name === 'cs_jwt')?.value;

    process.env.READONLY_TOKEN = `Bearer ${readOnlyToken}`;

    await storeStorageStateAndToken(page, 'read-only.json');
    await logout(page);
  });

  setup('Authenticate Default User and Save State', async ({ page }) => {
    setup.setTimeout(60_000);

    // Login default admin user
    await logInWithAdminUser(page);
    await ensureNotInPreview(page);

    // Save state for default admin user
    // This also sets process.env.TOKEN, which is picked up by main config.
    await storeStorageStateAndToken(page, 'admin_user.json');
  });
});
