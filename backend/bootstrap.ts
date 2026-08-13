import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// ─── Bootstrap Environment Variables ─────────────────────────────────────────
// Guarantees that .env is loaded reliably BEFORE any service or module initializes,
// whether running in development (ts-node) or production (node dist/backend/server.js).

let _envLoaded = false;

export function initEnv(): void {
  if (_envLoaded) return;

  const candidatePaths = [
    process.env.DOTENV_CONFIG_PATH,
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ].filter(Boolean) as string[];

  let loaded = false;
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    dotenv.config();
  }

  _envLoaded = true;
}

// Execute environment loading immediately on module import
initEnv();

// Safe helper to report SMTP environment status without exposing secrets
export function validateEmailEnv(): { emailSet: boolean; passSet: boolean } {
  initEnv();
  const emailSet = Boolean(process.env.ZOHO_EMAIL && process.env.ZOHO_EMAIL.trim().length > 0);
  const passSet = Boolean(process.env.ZOHO_PASSWORD && process.env.ZOHO_PASSWORD.trim().length > 0);
  return { emailSet, passSet };
}
