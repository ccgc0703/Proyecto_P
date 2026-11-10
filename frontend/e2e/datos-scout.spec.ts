import { test, expect } from '@playwright/test';
import { ADMIN, JOVEN, login } from './helpers';

/**
 * Smoke E2E de Datos Scout (Fase 6): el expediente se edita desde el perfil del
 * miembro. El test restaura los valores originales al terminar para no dejar
 * datos modificados en el fixture.
 */
test('datos-scout: editar el expediente desde el perfil del miembro', async ({ page }) => {
  test.setTimeout(120_000);
  await login(page, ADMIN);

  await page.goto('/app/tropa');
  await expect(page.getByRole('heading', { name: 'Tropa' }).first()).toBeVisible({
    timeout: 20_000,
  });

  const verPerfil = page.getByRole('button', { name: /^Ver perfil de / });
  await expect(verPerfil.first()).toBeVisible({ timeout: 30_000 });

  // Busca un miembro que ya tenga expediente (evita crear filas vacías).
  const panel = page.locator('[role="dialog"]').first();
  let seccion = panel.locator('section.form-sect').filter({ hasText: 'Datos Scout' });
  let encontrado = false;

  const total = Math.min(await verPerfil.count(), 6);
  for (let i = 0; i < total && !encontrado; i += 1) {
    await verPerfil.nth(i).click();
    await expect(panel).toBeVisible();

    seccion = panel.locator('section.form-sect').filter({ hasText: 'Datos Scout' });
    await expect(seccion).toBeVisible({ timeout: 20_000 });
    // El botón cambia de "Completar" a "Editar" cuando termina la carga.
    await expect(seccion.getByRole('status', { name: 'Cargando datos scout' })).toBeHidden({
      timeout: 20_000,
    });

    if (await seccion.getByRole('button', { name: 'Editar', exact: true }).isVisible()) {
      encontrado = true;
      break;
    }

    await panel.getByRole('button', { name: 'Cerrar perfil del miembro' }).click();
    await expect(panel).toBeHidden();
  }

  expect(encontrado, 'Debe existir al menos un miembro con expediente scout').toBe(true);

  // 1. Abre el formulario y guarda los valores originales para restaurarlos.
  // El locator se ancla al título del formulario: al cerrarse el diálogo deja de
  // existir, así `toBeHidden` no acaba resolviendo el panel del perfil.
  await seccion.getByRole('button', { name: 'Editar', exact: true }).click();
  const formulario = page
    .locator('[role="dialog"]')
    .filter({ has: page.getByRole('heading', { name: 'Editar Datos Scout', exact: true }) });
  await expect(formulario.getByRole('heading', { name: 'Editar Datos Scout', exact: true })).toBeVisible();

  const original = {
    registro: await formulario.locator('#ds-registro').inputValue(),
    ingreso: await formulario.locator('#ds-ingreso').inputValue(),
    promesa: await formulario.locator('#ds-promesa').inputValue(),
    cargo: await formulario.locator('#ds-cargo').inputValue(),
    patrulla: await formulario.locator('#ds-patrulla').inputValue(),
    observaciones: await formulario.locator('#ds-obs').inputValue(),
  };

  const marca = Date.now().toString(36);
  const cargo = `Guía E2E ${marca}`;
  const observaciones = `Observación E2E ${marca}`;

  await formulario.locator('#ds-registro').fill('2021-01-15');
  await formulario.locator('#ds-ingreso').fill('2021-02-01');
  await formulario.locator('#ds-promesa').fill('2022-03-20');
  await formulario.locator('#ds-cargo').fill(cargo);
  await formulario.locator('#ds-obs').fill(observaciones);

  const opcionesPatrulla = formulario.locator('#ds-patrulla option');
  await expect(opcionesPatrulla.first()).toBeAttached();
  if ((await opcionesPatrulla.count()) > 1) {
    await formulario.locator('#ds-patrulla').selectOption({ index: 1 });
  }
  const patrulla = await formulario
    .locator('#ds-patrulla')
    .evaluate((el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent?.trim() ?? '');

  await formulario.getByRole('button', { name: 'Guardar Expediente' }).click();
  await expect(formulario).toBeHidden({ timeout: 20_000 });

  // 2. El resumen del perfil refleja lo guardado.
  await expect(seccion.getByText(cargo)).toBeVisible({ timeout: 20_000 });
  await expect(seccion.getByText(observaciones)).toBeVisible();
  await expect(seccion.getByText('20 mar 2022')).toBeVisible();
  if (patrulla && patrulla !== 'Sin asignar') {
    await expect(seccion.getByText(patrulla, { exact: true })).toBeVisible();
  }

  // 3. Restaura el expediente original.
  await seccion.getByRole('button', { name: 'Editar', exact: true }).click();
  const restauracion = page
    .locator('[role="dialog"]')
    .filter({ has: page.getByRole('heading', { name: 'Editar Datos Scout', exact: true }) });
  await expect(restauracion.getByRole('heading', { name: 'Editar Datos Scout', exact: true })).toBeVisible();

  await restauracion.locator('#ds-registro').fill(original.registro);
  await restauracion.locator('#ds-ingreso').fill(original.ingreso);
  await restauracion.locator('#ds-promesa').fill(original.promesa);
  await restauracion.locator('#ds-cargo').fill(original.cargo);
  await restauracion.locator('#ds-obs').fill(original.observaciones);
  await restauracion.locator('#ds-patrulla').selectOption(original.patrulla);

  await restauracion.getByRole('button', { name: 'Guardar Expediente' }).click();
  await expect(restauracion).toBeHidden({ timeout: 20_000 });
  await expect(seccion.getByText(cargo)).toBeHidden();
});

test('datos-scout: el joven sólo accede a su propio expediente (self-scope)', async ({ page }) => {
  await login(page, JOVEN);

  const crudo = await page.evaluate(() => localStorage.getItem('auth-storage'));
  const token = (JSON.parse(crudo ?? '{}') as { state?: { token?: string } }).state?.token;
  expect(token, 'La sesión del joven debe persistir el token').toBeTruthy();

  const api = `${process.env.E2E_API_URL ?? 'http://localhost:3000'}/api/v1`;
  const headers = { Authorization: `Bearer ${token}` };

  // El listado global está prohibido para cuentas jóvenes.
  const listado = await page.request.get(`${api}/datos-scout`, { headers });
  expect(listado.status()).toBe(403);

  // Tampoco puede leer el expediente de otro miembro.
  const ajeno = await page.request.get(
    `${api}/datos-scout/miembro/00000000-0000-4000-8000-000000000000`,
    { headers },
  );
  expect(ajeno.status()).toBe(403);

  // Pero sí el propio.
  const perfil = await page.request.get(`${api}/auth/me`, { headers });
  const { data } = (await perfil.json()) as { data?: { miembroId?: string | null } };
  const miembroId = data?.miembroId;
  expect(miembroId, 'El usuario joven de pruebas debe tener un miembro vinculado').toBeTruthy();

  const propio = await page.request.get(`${api}/datos-scout/miembro/${miembroId}`, { headers });
  expect([200, 404]).toContain(propio.status());
});
