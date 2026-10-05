import { test, expect } from '@playwright/test';
import { JOVEN, login } from './helpers';

test('joven: ve su portal de progresión y no administra staff', async ({ page }) => {
  const llamadasRbac: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/v1/rbac/')) llamadasRbac.push(r.url());
  });

  await login(page, JOVEN);

  // El sidebar del joven no ofrece administración
  const staff = page.getByRole('button', { name: 'Staff', exact: true });
  await expect(staff).toHaveCount(0);

  // Si entra directo a /app/staff: la página lo rechaza sin consultar RBAC
  await page.goto('/app/staff');
  await expect(page.getByText('Acceso Denegado')).toBeVisible({ timeout: 20_000 });
  expect(llamadasRbac).toHaveLength(0);

  // La recarga mantiene la sesión del joven
  await page.reload();
  await expect(page).toHaveURL(/\/app\/staff/);

  await page.goto('/app/mi-progresion');
  await expect(page).toHaveURL(/\/app\/mi-progresion/);
  await expect(page.getByText(/Mi Progresión/i).first()).toBeVisible({ timeout: 20_000 });

  // Un joven no debe entrar a la progresión general de la organización
  await page.goto('/app/progresion');
  await expect(page).toHaveURL(/\/app\/mi-progresion/);
});

test('joven: no puede usar la API de administración', async ({ page }) => {
  await login(page, JOVEN);
  const respuesta = await page.evaluate(async () => {
    const token = JSON.parse(localStorage.getItem('auth-storage') ?? '{}')?.state?.token;
    const res = await fetch('/api/v1/rbac/roles', { headers: { Authorization: `Bearer ${token}` } });
    return res.status;
  });
  expect([401, 403]).toContain(respuesta);
});
