import { expect, type Page } from '@playwright/test';

export const ADMIN = { email: 'admin@poseidon.com', password: 'admin123' };
export const JOVEN = { email: 'joven.test@poseidon.com', password: 'joven456' };

export async function login(page: Page, creds: { email: string; password: string }) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(creds.email);
  await page.locator('input[name="password"]').fill(creds.password);
  await page.getByRole('button', { name: /Autenticar Acceso/ }).click();
  await page.waitForURL('**/app**', { timeout: 20_000 });
  await expect(page.locator('header h1').first()).toBeVisible();
}

export async function navegar(page: Page, item: string, path: string, titulo: string) {
  await page.getByRole('button', { name: item, exact: true }).click();
  await page.waitForURL(`**${path}`, { timeout: 20_000 });
  await expect(page.getByText(titulo, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
}
