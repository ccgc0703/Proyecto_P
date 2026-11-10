import { test, expect, type Page } from '@playwright/test';
import { ADMIN, JOVEN, login } from './helpers';

/** Ancla el diálogo del formulario por su `h2` (el perfil usa `h3`/`h4`). */
const dialogoFormulario = (page: Page, titulo: string) =>
  page
    .locator('[role="dialog"]')
    .filter({ has: page.getByRole('heading', { level: 2, name: titulo, exact: true }) });

/**
 * Smoke E2E de Programas Mundiales (Fase 6): el catálogo se enlaza al miembro
 * desde su perfil, se marca como completado y se vuelve a quitar. El test
 * termina sin enlaces, así que no deja datos modificados en el fixture.
 */
test('programas-mundiales: enlazar, completar y quitar un programa', async ({ page }) => {
  test.setTimeout(150_000);
  await login(page, ADMIN);

  await page.goto('/app/tropa');
  await expect(page.getByRole('heading', { name: 'Tropa' }).first()).toBeVisible({
    timeout: 20_000,
  });

  const verPerfil = page.getByRole('button', { name: /^Ver perfil de / });
  await expect(verPerfil.first()).toBeVisible({ timeout: 30_000 });

  // Busca un miembro sin programas enlazados (evita chocar con el unique).
  const panel = page.locator('[role="dialog"]').first();
  let seccion = panel.locator('section.form-sect').filter({ hasText: 'Programas Mundiales' });
  let encontrado = false;

  const total = Math.min(await verPerfil.count(), 6);
  for (let i = 0; i < total && !encontrado; i += 1) {
    await verPerfil.nth(i).click();
    await expect(panel).toBeVisible();

    seccion = panel.locator('section.form-sect').filter({ hasText: 'Programas Mundiales' });
    await expect(seccion).toBeVisible({ timeout: 20_000 });
    await expect(seccion.getByRole('status', { name: 'Cargando programas mundiales' })).toBeHidden({
      timeout: 20_000,
    });

    if (await seccion.getByRole('button', { name: 'Enlazar', exact: true }).isVisible()) {
      encontrado = true;
      break;
    }

    await panel.getByRole('button', { name: 'Cerrar perfil del miembro' }).click();
    await expect(panel).toBeHidden();
  }

  expect(encontrado, 'Debe existir al menos un miembro sin programas enlazados').toBe(true);

  // 1. Abre el formulario y enlaza el primer programa disponible.
  await seccion.getByRole('button', { name: 'Enlazar', exact: true }).click();
  const formulario = dialogoFormulario(page, 'Programas Mundiales');
  await expect(
    formulario.getByRole('heading', { level: 2, name: 'Programas Mundiales', exact: true }),
  ).toBeVisible();

  const select = formulario.locator('#pm-programa');
  await expect(select).toBeEnabled({ timeout: 20_000 });
  const opciones = select.locator('option');
  expect(await opciones.count(), 'El catálogo debe tener al menos un programa activo').toBeGreaterThan(1);

  await select.selectOption({ index: 1 });
  const nombre = await select.evaluate(
    (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent?.trim() ?? '',
  );
  expect(nombre).toBeTruthy();

  await formulario.locator('#pm-inicio').fill('2024-02-01');
  await formulario.getByRole('button', { name: 'Enlazar Programa' }).click();

  // 2. El enlace aparece en la sección 01 del propio formulario.
  const enlazados = formulario.locator('section.form-sect').filter({ hasText: 'Programas enlazados' });
  await expect(enlazados.getByText(nombre)).toBeVisible({ timeout: 20_000 });
  await expect(enlazados.getByText('En curso')).toBeVisible();
  await expect(enlazados.getByText(/Inicio 01 feb 2024/)).toBeVisible();

  // 3. Se marca como completado (pide fecha de finalización en el servidor).
  await formulario.getByRole('button', { name: `Marcar completado ${nombre}` }).click();
  await expect(enlazados.getByText('Completado')).toBeVisible({ timeout: 20_000 });
  await expect(enlazados.getByText(/Fin /)).toBeVisible();

  // 4. Se quita el enlace (soft-delete) y el resumen vuelve a vacío.
  await formulario.getByRole('button', { name: `Quitar ${nombre}` }).click();
  await expect(enlazados.getByText(nombre)).toBeHidden({ timeout: 20_000 });

  await formulario.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(formulario).toBeHidden();
  await expect(seccion.getByText('Sin programas mundiales registrados')).toBeVisible({
    timeout: 20_000,
  });
});

test('programas-mundiales: el joven sólo accede a sus propios programas (self-scope)', async ({
  page,
}) => {
  await login(page, JOVEN);

  const crudo = await page.evaluate(() => localStorage.getItem('auth-storage'));
  const token = (JSON.parse(crudo ?? '{}') as { state?: { token?: string } }).state?.token;
  expect(token, 'La sesión del joven debe persistir el token').toBeTruthy();

  const api = `${process.env.E2E_API_URL ?? 'http://localhost:3000'}/api/v1`;
  const headers = { Authorization: `Bearer ${token}` };

  // El listado global está prohibido para cuentas jóvenes.
  const listado = await page.request.get(`${api}/programas-mundiales`, { headers });
  expect(listado.status()).toBe(403);

  // Tampoco puede leer los programas de otro miembro.
  const ajeno = await page.request.get(
    `${api}/programas-mundiales/miembro/00000000-0000-4000-8000-000000000000`,
    { headers },
  );
  expect(ajeno.status()).toBe(403);

  // Pero sí el catálogo (tiene `programamundial:view`) y los propios.
  const catalogo = await page.request.get(`${api}/programas-mundiales/catalogo`, { headers });
  expect(catalogo.status()).toBe(200);

  const perfil = await page.request.get(`${api}/auth/me`, { headers });
  const { data } = (await perfil.json()) as { data?: { miembroId?: string | null } };
  const miembroId = data?.miembroId;
  expect(miembroId, 'El usuario joven de pruebas debe tener un miembro vinculado').toBeTruthy();

  const propio = await page.request.get(`${api}/programas-mundiales/miembro/${miembroId}`, {
    headers,
  });
  expect(propio.status()).toBe(200);
  expect(Array.isArray(await propio.json())).toBe(true);
});
