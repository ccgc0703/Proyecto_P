import { test, expect } from '@playwright/test';
import { COMUNIDAD, JOVEN, login } from './helpers';

test('joven: las rutas de administración piden "Acceso Denegado"', async ({ page }) => {
  await login(page, JOVEN);

  await page.goto('/app/miembros');
  await expect(page).toHaveURL(/\/app\/miembros/);
  await expect(page.getByText('Acceso Denegado').first()).toBeVisible({ timeout: 20_000 });

  for (const ruta of ['/app/manada', '/app/tropa', '/app/estructura', '/app/staff']) {
    await page.goto(ruta);
    await expect(page.getByText('Acceso Denegado').first()).toBeVisible({ timeout: 20_000 });
  }
});

test('adulto de comunidad: ve miembros pero no staff ni estructura', async ({ page }) => {
  await login(page, COMUNIDAD);

  await page.goto('/app/miembros');
  await expect(page.getByText('Gestión de Miembros')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Acceso Denegado')).not.toBeVisible();

  await page.goto('/app/staff');
  await expect(page.getByText('Acceso Denegado').first()).toBeVisible({ timeout: 20_000 });

  await page.goto('/app/estructura');
  await expect(page.getByText('Acceso Denegado').first()).toBeVisible({ timeout: 20_000 });
});
