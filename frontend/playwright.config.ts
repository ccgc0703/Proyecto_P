import { defineConfig } from '@playwright/test';

const FRONTEND_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const BACKEND_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

// Navegador: Edge del sistema por defecto (no requiere descargas). En CI se
// apunta al Chromium instalado por `playwright install --with-deps chromium`
// mediante E2E_BROWSER=chromium.
const channel = process.env.E2E_BROWSER ?? 'msedge';

// E2E con Edge del sistema (channel: 'msedge'): no requiere descargar
// navegadores. Los servidores se reutilizan si ya están corriendo.
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/output',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: FRONTEND_URL,
    channel,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  webServer: [
    {
      command: 'node dist/src/main.js',
      cwd: '..',
      url: `${BACKEND_URL}/api/v1/health`,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
