import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

const API = process.env.E2E_API_URL ?? 'http://localhost:3000';
const SUFIJO = Date.now().toString().slice(-8);
const EMAIL = `e2e-notif-${SUFIJO}@test.com`;
const PASSWORD = 'pass1234';

let token = '';
let userId: string | null = null;

// Crea un usuario por API: el alta dispara la notificación CUENTA_CREADA.
test.beforeAll(async ({ request }) => {
  const res = await request.post(`${API}/api/v1/auth/login`, {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  expect(res.ok()).toBeTruthy();
  token = (await res.json()).data.access_token;

  const creado = await request.post(`${API}/api/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { nombre: 'E2E', apellido: 'Notif', email: EMAIL, password: PASSWORD },
  });
  expect(creado.ok()).toBeTruthy();
  userId = (await creado.json()).data.id;
});

test.afterAll(async ({ request }) => {
  if (userId) {
    await request.delete(`${API}/api/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
});

test('campana: badge con1 sin leer, panel con la cuenta creada y marcar todas', async ({ page }) => {
  await login(page, { email: EMAIL, password: PASSWORD });

  // El alta de la cuenta generó 1 notificación no leída.
  const badge = page.getByTestId('notif-badge');
  await expect(badge).toHaveText('1', { timeout: 15_000 });

  const campana = page.getByRole('button', { name: /Notificaciones \(1 sin leer\)/ });
  await campana.click();

  const panel = page.locator('.notif-menu');
  await expect(panel.getByText('Cuenta creada')).toBeVisible();

  await panel.getByRole('button', { name: 'Marcar todas' }).click();

  // El badge desaparece al llegar a cero.
  await expect(badge).toHaveCount(0, { timeout: 10_000 });
  await expect(
    page.getByRole('button', { name: 'Notificaciones', exact: true }),
  ).toBeVisible();

  // El panel sigue abierto con la notificación ya leída.
  await expect(panel.getByText('Cuenta creada')).toBeVisible();
});
