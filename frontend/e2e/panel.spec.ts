import { test, expect } from '@playwright/test';
import { ADMIN, login, navegar } from './helpers';

test('admin: navega dashboard, miembros, progresión, estructura y staff', async ({ page }) => {
  test.setTimeout(120_000);
  await login(page, ADMIN);

  await expect(page.getByRole('heading', { name: 'Dashboard de inicio' })).toBeVisible({
    timeout: 20_000,
  });

  await navegar(page, 'Miembros', '/app/miembros', 'Gestión de Miembros');
  // DataGrid: fila de cabecera + al menos una fila de datos
  await expect(page.locator('[role="row"]').nth(1)).toBeVisible({ timeout: 30_000 });

  await navegar(page, 'Progresión', '/app/progresion', 'Progresión');
  // En el primer arranque Vite compila este chunk bajo demanda
  await expect(page.getByText(/adelanto/i).first()).toBeVisible({ timeout: 45_000 });

  await navegar(page, 'Estructura', '/app/estructura', 'Estructura Organizacional');
  await expect(page.getByText(/Sentinel|Grupo Scout|Regional|Nacional/i).first()).toBeVisible({
    timeout: 20_000,
  });

  await navegar(page, 'Staff', '/app/staff', 'Staff');
  await expect(page.locator('[role="row"]').nth(1)).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
  await page.waitForURL('**/login', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Inicio de Sesión' })).toBeVisible();
  // La sesión no sobrevive al logout
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
});
