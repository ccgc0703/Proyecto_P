import { test, expect, type Page } from '@playwright/test';
import { ADMIN, JOVEN, login } from './helpers';

/** API base usada por los tests que hablan directo con el backend. */
const api = `${process.env.E2E_API_URL ?? 'http://localhost:3000'}/api/v1`;

async function tokenDe(page: Page): Promise<string> {
  const crudo = await page.evaluate(() => localStorage.getItem('auth-storage'));
  const token = (JSON.parse(crudo ?? '{}') as { state?: { token?: string } }).state?.token;
  expect(token, 'La sesión debe persistir el token').toBeTruthy();
  return token as string;
}

interface ActividadE2E {
  planificacionId: string;
  actividadId: string;
}

/** Crea planificación + actividad (ambito grupo, sin unidad) y devuelve sus ids. */
async function crearActividad(page: Page, token: string, marca: string): Promise<ActividadE2E> {
  const headers = { Authorization: `Bearer ${token}` };

  const plan = await page.request.post(`${api}/eventos/planificaciones`, {
    headers,
    data: {
      titulo: `Plan QR ${marca}`,
      fechaInicio: '2026-11-01T00:00:00.000Z',
      fechaFin: '2026-11-30T00:00:00.000Z',
      alcance: 'GRUPO',
      estado: 'EN_CURSO',
    },
  });
  expect(plan.status(), 'El admin debe poder crear la planificación').toBe(201);
  const { data: planData } = (await plan.json()) as { data?: { id?: string } };

  const act = await page.request.post(
    `${api}/eventos/planificaciones/${planData?.id}/actividades`,
    {
      headers,
      data: {
        titulo: `Reunion QR ${marca}`,
        tipo: 'REUNION',
        fecha: '2026-11-15T10:00:00.000Z',
        estado: 'EN_CURSO',
      },
    },
  );
  expect(act.status(), 'El admin debe poder crear la actividad').toBe(201);
  const { data: actData } = (await act.json()) as { data?: { id?: string } };

  return { planificacionId: planData?.id as string, actividadId: actData?.id as string };
}

/** Limpieza completa: asistencias → actividad → planificación (orden obligatorio). */
async function limpiar(page: Page, token: string, creado: ActividadE2E): Promise<void> {
  const headers = { Authorization: `Bearer ${token}` };

  const planilla = await page.request.get(
    `${api}/eventos/actividades/${creado.actividadId}/asistencias`,
    { headers },
  );
  if (planilla.ok()) {
    const { data } = (await planilla.json()) as {
      data?: { registros?: Array<{ asistenciaId?: string | null }> };
    };
    for (const fila of data?.registros ?? []) {
      if (fila.asistenciaId) {
        await page.request.delete(`${api}/eventos/asistencias/${fila.asistenciaId}`, { headers });
      }
    }
  }

  await page.request.delete(`${api}/eventos/actividades/${creado.actividadId}`, { headers });
  await page.request.delete(`${api}/eventos/planificaciones/${creado.planificacionId}`, {
    headers,
  });
}

/**
 * Smoke E2E de QR de presencia (Fase 7b): el adulto genera el QR, el joven lo
 * escanea desde mi-progresión y se auto-registra; el contrato del API cubre
 * idempotencia, permisos y el borrado de la marca. Todo se limpia al final.
 */
test('presencia: el joven escanea el QR desde mi-progresión y queda PRESENTE', async ({
  page,
}) => {
  test.setTimeout(150_000);
  const marca = Date.now().toString(36);
  let adminToken = '';
  let creado: ActividadE2E | null = null;

  try {
    // 1. El adulto prepara la actividad y obtiene el QR
    await login(page, ADMIN);
    adminToken = await tokenDe(page);
    creado = await crearActividad(page, adminToken, marca);

    const qr = await page.request.get(`${api}/eventos/actividades/${creado.actividadId}/qr`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(qr.status()).toBe(200);
    const { data } = (await qr.json()) as { data?: { codigo?: string; expira?: string } };
    const codigo = data?.codigo ?? '';
    expect(codigo).toMatch(/^presencia:v1:/);
    expect(data?.expira).toBeTruthy();

    // 2. El joven entra y abre el escáner desde su propia página
    const jovenPage = await page.context().newPage();
    await jovenPage.goto('/login');
    await jovenPage.evaluate(() => localStorage.clear()); // sesión del admin fuera
    await login(jovenPage, JOVEN);
    await jovenPage.goto('/app/mi-progresion');
    await expect(jovenPage.getByText('Mi Progresión').first()).toBeVisible({ timeout: 20_000 });

    await jovenPage.getByRole('button', { name: /Escanear QR/ }).click();
    const dialogo = jovenPage.locator('[role="dialog"]').first();
    await expect(dialogo).toBeVisible({ timeout: 20_000 });
    // MUI pinta un h2 en DialogTitle y el componente su h3: se elige el primero.
    await expect(
      dialogo.getByRole('heading', { name: /Escanear QR de presencia/ }).first(),
    ).toBeVisible();

    // Sin cámara en CI: código manual (mismo camino de negocio)
    await dialogo.locator('#codigo-manual-presencia').fill(codigo);
    await dialogo.getByRole('button', { name: /^Registrar$/ }).click();

    await expect(dialogo.getByText('¡Presencia registrada!')).toBeVisible({ timeout: 20_000 });
    await expect(dialogo.getByText(/Reunion QR/)).toBeVisible();
    await jovenPage.close();

    // 3. Verifica en el backend que la fila quedó PRESENTE
    const planilla = await page.request.get(
      `${api}/eventos/actividades/${creado.actividadId}/asistencias`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    expect(planilla.status()).toBe(200);
    const { data: planillaData } = (await planilla.json()) as {
      data?: { registros?: Array<{ estado?: string | null; asistenciaId?: string | null }> };
    };
    const marcados = (planillaData?.registros ?? []).filter((r) => r.estado === 'PRESENTE');
    expect(marcados.length, 'Debe quedar al menos una fila PRESENTE').toBeGreaterThanOrEqual(1);
    expect(marcados[0]?.asistenciaId).toBeTruthy();
  } finally {
    if (creado && adminToken) await limpiar(page, adminToken, creado);
  }
});

test('presencia: contrato del API (idempotencia, permisos y deshacer)', async ({ page }) => {
  test.setTimeout(150_000);
  const marca = Date.now().toString(36);
  let adminToken = '';
  let creado: ActividadE2E | null = null;

  try {
    await login(page, ADMIN);
    adminToken = await tokenDe(page);
    creado = await crearActividad(page, adminToken, marca);
    const headersAdmin = { Authorization: `Bearer ${adminToken}` };

    // El adulto recibe un QR firmado
    const qr = await page.request.get(`${api}/eventos/actividades/${creado.actividadId}/qr`, {
      headers: headersAdmin,
    });
    expect(qr.status()).toBe(200);
    const { data } = (await qr.json()) as { data?: { codigo?: string } };
    const codigo = data?.codigo as string;
    expect(codigo).toMatch(/^presencia:v1:.+:[0-9]+:[A-Za-z0-9_-]+$/);

    // El joven se auto-registra (self:update) y es idempotente
    await page.evaluate(() => localStorage.clear());
    await login(page, JOVEN);
    const headersJoven = { Authorization: `Bearer ${await tokenDe(page)}` };

    const primero = await page.request.post(`${api}/eventos/presencia`, {
      headers: headersJoven,
      data: { codigo },
    });
    expect(primero.status()).toBe(201);
    const r1 = (await primero.json()) as {
      data?: { estado?: string; yaRegistrado?: boolean; actividad?: { id?: string } };
    };
    expect(r1.data?.estado).toBe('PRESENTE');
    expect(r1.data?.yaRegistrado).toBe(false);
    expect(r1.data?.actividad?.id).toBe(creado.actividadId);

    const segundo = await page.request.post(`${api}/eventos/presencia`, {
      headers: headersJoven,
      data: { codigo },
    });
    expect(segundo.status()).toBe(201);
    const r2 = (await segundo.json()) as { data?: { yaRegistrado?: boolean } };
    expect(r2.data?.yaRegistrado).toBe(true);

    // Código alterado o basura → 400 (nunca 500)
    const alterado = `${codigo.slice(0, -1)}${codigo.endsWith('A') ? 'B' : 'A'}`;
    const mala = await page.request.post(`${api}/eventos/presencia`, {
      headers: headersJoven,
      data: { codigo: alterado },
    });
    expect(mala.status()).toBe(400);

    const basura = await page.request.post(`${api}/eventos/presencia`, {
      headers: headersJoven,
      data: { codigo: 'x' },
    });
    expect(basura.status()).toBe(400);

    // El joven NO puede generar QR (asistencia:manage)
    const sinPermiso = await page.request.get(
      `${api}/eventos/actividades/${creado.actividadId}/qr`,
      { headers: headersJoven },
    );
    expect(sinPermiso.status()).toBe(403);

    // Deshacer la marca con el adulto (DELETE) y comprobar que se limpió
    const planilla = await page.request.get(
      `${api}/eventos/actividades/${creado.actividadId}/asistencias`,
      { headers: headersAdmin },
    );
    const { data: planillaData } = (await planilla.json()) as {
      data?: { registros?: Array<{ estado?: string | null; asistenciaId?: string | null }> };
    };
    const marcada = (planillaData?.registros ?? []).find(
      (r) => r.estado === 'PRESENTE' && r.asistenciaId,
    );
    expect(marcada, 'Debe existir la fila marcada por el QR').toBeTruthy();

    const borrar = await page.request.delete(
      `${api}/eventos/asistencias/${marcada?.asistenciaId}`,
      { headers: headersAdmin },
    );
    expect(borrar.status()).toBe(200);

    const trasBorrar = await page.request.get(
      `${api}/eventos/actividades/${creado.actividadId}/asistencias`,
      { headers: headersAdmin },
    );
    const { data: planillaFinal } = (await trasBorrar.json()) as {
      data?: { registros?: Array<{ estado?: string | null }> };
    };
    expect(
      (planillaFinal?.registros ?? []).some((r) => r.estado === 'PRESENTE'),
    ).toBe(false);
  } finally {
    if (creado && adminToken) await limpiar(page, adminToken, creado);
  }
});
