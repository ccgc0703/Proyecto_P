import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('admin: registra un adulto de staff y aparece en el listado', async ({ page }) => {
  await login(page, ADMIN);

  await page.goto('/app/staff/nuevo');
  const cedula = `V-${Date.now().toString().slice(-7)}`;

  await page.locator('input[name="nombres"]').fill('E2E');
  await page.locator('input[name="apellidos"]').fill('Staff');
  await page.locator('input[name="cedula"]').fill(cedula);
  await page.locator('input[name="fechaNacimiento"]').fill('1992-04-04');
  await page.locator('select[name="unidadId"]').selectOption({ label: 'Comunidad' });

  await page.getByRole('button', { name: 'Finalizar Registro' }).click();
  await page.waitForURL('**/app/staff**', { timeout: 20_000 });

  await expect(page.getByText('E2E Staff').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(cedula).first()).toBeVisible({ timeout: 20_000 });
});
