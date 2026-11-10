import { test, expect } from '@playwright/test';
import { ADMIN, JOVEN, login } from './helpers';

/** PDF mínimo válido (firma `%PDF` + EOF) para el input de archivo. */
const pdfMinimo = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF\n',
  'latin1',
);

/**
 * Smoke E2E de la Biblioteca (Fase 5): navegación por permiso, subida de un
 * PDF, alternancia de vigencia y borrado lógico. El documento se elimina al
 * final del test para no dejar basura en la base.
 */
test('documentos: subir PDF, cambiar vigencia y eliminar', async ({ page }) => {
  const marca = Date.now().toString(36);
  const titulo = `Reglamento E2E ${marca}`;

  await login(page, ADMIN);

  // 1. El ítem "Documentos" del sidebar lleva a la biblioteca (normativa:view)
  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await page.waitForURL('**/app/documentos', { timeout: 20_000 });
  await expect(page.getByText('Documentos y Normativa').first()).toBeVisible({ timeout: 20_000 });

  // 2. Subir un PDF con metadata
  await page.getByRole('button', { name: /Subir documento/ }).first().click();
  const dialogo = page.locator('[role="dialog"]');
  await expect(dialogo).toBeVisible();

  await dialogo.locator('#documento-titulo').fill(titulo);
  await dialogo.locator('#documento-categoria').selectOption('REGLAMENTO');
  await dialogo.locator('#documento-descripcion').fill('Documento generado por el smoke E2E.');
  await dialogo.locator('input[type="file"]').setInputFiles({
    name: `reglamento-${marca}.pdf`,
    mimeType: 'application/pdf',
    buffer: pdfMinimo,
  });
  await dialogo.getByRole('button', { name: /^Subir documento$/ }).click();

  const tarjeta = page.locator('article', { hasText: titulo });
  await expect(tarjeta).toBeVisible({ timeout: 20_000 });
  await expect(tarjeta.getByText('Vigente')).toBeVisible();

  // 3. Marcar como histórico (PATCH vigente:false) — acotado a la tarjeta:
  //    la biblioteca puede tener otros documentos con el mismo botón.
  await tarjeta.getByRole('button', { name: 'Marcar como histórico' }).click();
  await expect(tarjeta.getByText('Histórico')).toBeVisible({ timeout: 15_000 });

  // 4. Eliminar (soft-delete) y confirmar el diálogo nativo
  page.on('dialog', (dialogoConfirmacion) => void dialogoConfirmacion.accept());
  await tarjeta.getByRole('button', { name: `Eliminar ${titulo}` }).click();
  await expect(page.getByText(titulo, { exact: true })).toBeHidden({ timeout: 15_000 });
});

test('documentos: el joven sin permiso ve Acceso Denegado', async ({ page }) => {
  await login(page, JOVEN);
  await page.goto('/app/documentos');
  // La regla de ruta (/app/documentos → normativa:view) pinta el blindaje del layout
  await expect(page.getByText('Acceso Denegado').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/No tienes permisos/)).toBeVisible();
});
