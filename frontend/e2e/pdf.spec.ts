import { readFileSync } from 'fs';
import { test, expect, type Page } from '@playwright/test';
import { ADMIN, JOVEN, login } from './helpers';

/** API base usada por los tests que hablan directo con el backend. */
const api = `${process.env.E2E_API_URL ?? 'http://localhost:3000'}/api/v1`;

/** UUID inexistente (variante v4) para probar 403/404 sin tocar datos. */
const ID_FANTASMA = '00000000-0000-4000-8000-000000000000';

async function tokenDe(page: Page): Promise<string> {
  const crudo = await page.evaluate(() => localStorage.getItem('auth-storage'));
  const token = (JSON.parse(crudo ?? '{}') as { state?: { token?: string } }).state?.token;
  expect(token, 'La sesión debe persistir el token').toBeTruthy();
  return token as string;
}

/**
 * Smoke E2E de Export PDF (Fase 7a): descarga real del carnet desde el perfil
 * del miembro y contrato de los tres endpoints (PDF válido + permisos/ABAC).
 * No muta datos: sólo lee y descarga.
 */
test('pdf: descarga el carnet del miembro desde el perfil', async ({ page }) => {
  test.setTimeout(120_000);
  await login(page, ADMIN);

  await page.goto('/app/tropa');
  await expect(page.getByRole('heading', { name: 'Tropa' }).first()).toBeVisible({
    timeout: 20_000,
  });

  const verPerfil = page.getByRole('button', { name: /^Ver perfil de / });
  await expect(verPerfil.first()).toBeVisible({ timeout: 30_000 });

  const panel = page.locator('[role="dialog"]').first();
  let encontrado = false;

  // Busca un miembro con expediente scout (el carnet sólo se ofrece si existe).
  const total = Math.min(await verPerfil.count(), 6);
  for (let i = 0; i < total && !encontrado; i += 1) {
    await verPerfil.nth(i).click();
    await expect(panel).toBeVisible();

    const seccion = panel.locator('section.form-sect').filter({ hasText: 'Datos Scout' });
    await expect(seccion).toBeVisible({ timeout: 20_000 });
    await expect(seccion.getByRole('status', { name: 'Cargando datos scout' })).toBeHidden({
      timeout: 20_000,
    });

    if (await seccion.getByRole('button', { name: /Carnet \(\.pdf\)/ }).isVisible()) {
      const [descarga] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        seccion.getByRole('button', { name: /Carnet \(\.pdf\)/ }).click(),
      ]);

      expect(descarga.suggestedFilename()).toMatch(/\.pdf$/);
      const ruta = await descarga.path();
      expect(ruta, 'El navegador debe guardar el archivo temporal').toBeTruthy();
      const contenido = readFileSync(ruta as string);
      expect(contenido.subarray(0, 5).toString('latin1')).toBe('%PDF-');
      encontrado = true;
      break;
    }

    await panel.getByRole('button', { name: 'Cerrar perfil del miembro' }).click();
    await expect(panel).toBeHidden();
  }

  expect(encontrado, 'Debe existir al menos un miembro con expediente scout').toBe(true);
});

test('pdf: los endpoints responden PDF y aplican permisos', async ({ page }) => {
  await login(page, ADMIN);
  const headers = { Authorization: `Bearer ${await tokenDe(page)}` };

  // Toma un miembro real del listado para pedir su carnet.
  const listado = await page.request.get(`${api}/jovenes`, { headers });
  expect(listado.status()).toBe(200);
  const { data } = (await listado.json()) as { data?: Array<{ id?: string; miembroId?: string }> };
  const miembroId = data?.[0]?.miembroId ?? data?.[0]?.id;
  expect(miembroId, 'Debe haber al menos un joven sembrado').toBeTruthy();

  const carnet = await page.request.get(`${api}/pdf/carnet/${miembroId}`, { headers });
  expect(carnet.status()).toBe(200);
  expect(carnet.headers()['content-type']).toContain('application/pdf');
  expect(carnet.headers()['content-disposition']).toContain('.pdf');
  expect((await carnet.body()).subarray(0, 5).toString('latin1')).toBe('%PDF-');

  // Entidades inexistentes → 404 (nunca un PDF vacío ni un 500).
  const constancia = await page.request.get(`${api}/pdf/constancia/${ID_FANTASMA}`, { headers });
  expect(constancia.status()).toBe(404);
  const asistencia = await page.request.get(`${api}/pdf/asistencia/${ID_FANTASMA}`, { headers });
  expect(asistencia.status()).toBe(404);
});

test('pdf: el joven no exporta documentos de otros miembros', async ({ page }) => {
  await login(page, JOVEN);
  const headers = { Authorization: `Bearer ${await tokenDe(page)}` };

  const carnet = await page.request.get(`${api}/pdf/carnet/${ID_FANTASMA}`, { headers });
  expect(carnet.status()).toBe(403);

  const constancia = await page.request.get(`${api}/pdf/constancia/${ID_FANTASMA}`, { headers });
  expect(constancia.status()).toBe(403);

  // La planilla de una actividad inexistente nunca revela datos: 403 o 404.
  const asistencia = await page.request.get(`${api}/pdf/asistencia/${ID_FANTASMA}`, { headers });
  expect([403, 404]).toContain(asistencia.status());
});
