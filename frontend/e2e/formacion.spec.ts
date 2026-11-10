import { test, expect } from '@playwright/test';
import { ADMIN, JOVEN, login } from './helpers';

/**
 * Smoke E2E de Formación (Fase 6): alta, edición y borrado de un curso
 * asociado a un adulto. El registro se elimina al final para no dejar basura.
 */
test('formacion: registrar, editar y eliminar una formación', async ({ page }) => {
  const marca = Date.now().toString(36);
  const nombre = `Curso E2E ${marca}`;
  const nombreEditado = `${nombre} (editado)`;

  await login(page, ADMIN);

  // 1. Entrada del sidebar (formacion:view)
  await page.getByRole('button', { name: 'Formación', exact: true }).click();
  await page.waitForURL('**/app/formacion', { timeout: 20_000 });
  await expect(page.getByText('Formación y Certificaciones').first()).toBeVisible({ timeout: 20_000 });

  // 2. Alta
  await page.getByRole('button', { name: /Registrar formación/ }).first().click();
  const dialogo = page.locator('[role="dialog"]');
  await expect(dialogo).toBeVisible();

  await dialogo.locator('#formacion-nombre').fill(nombre);
  await dialogo.locator('#formacion-fecha').fill('2026-05-15');
  await dialogo.locator('#formacion-director').fill('Director E2E');
  await dialogo.locator('#formacion-adulto').selectOption({ index: 1 });
  await dialogo.getByRole('button', { name: 'Registrar', exact: true }).click();

  const tarjeta = page.locator('article', { hasText: nombre });
  await expect(tarjeta).toBeVisible({ timeout: 20_000 });
  await expect(tarjeta.getByText('15 may 2026')).toBeVisible();

  // 3. Edición
  await tarjeta.getByRole('button', { name: `Editar ${nombre}` }).click();
  await expect(dialogo).toBeVisible();
  await dialogo.locator('#formacion-nombre').fill(nombreEditado);
  await dialogo.getByRole('button', { name: 'Guardar cambios' }).click();

  const tarjetaEditada = page.locator('article', { hasText: nombreEditado });
  await expect(tarjetaEditada).toBeVisible({ timeout: 20_000 });

  // 4. Borrado lógico con confirmación nativa
  page.on('dialog', (dialogoConfirmacion) => void dialogoConfirmacion.accept());
  await tarjetaEditada.getByRole('button', { name: `Eliminar ${nombreEditado}` }).click();
  await expect(page.getByText(nombreEditado, { exact: true })).toBeHidden({ timeout: 15_000 });
});

test('formacion: el joven sin permiso ve Acceso Denegado', async ({ page }) => {
  await login(page, JOVEN);
  await page.goto('/app/formacion');
  await expect(page.getByText('Acceso Denegado').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/No tienes permisos/)).toBeVisible();
});
