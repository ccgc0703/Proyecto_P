import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

test('sin sesión: /app redirige al login', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Inicio de Sesión' })).toBeVisible();
});

test('sin sesión: /app/progresión y /app/staff también redirigen', async ({ page }) => {
  await page.goto('/app/progresion');
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/app/staff');
  await expect(page).toHaveURL(/\/login/);
});

test('credenciales inválidas: mensaje legible y permanece en el login', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(ADMIN.email);
  await page.locator('input[name="password"]').fill('clave-mala-123');
  await page.getByRole('button', { name: /Autenticar Acceso/ }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({ timeout: 15_000 });
});

test('login válido: entra al dashboard con datos', async ({ page }) => {
  await login(page, ADMIN);
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole('heading', { name: 'Dashboard de inicio' })).toBeVisible({
    timeout: 20_000,
  });
  // El header del layout confirma la sesión y el título de la ruta
  await expect(page.locator('header h1').first()).toHaveText(/Dashboard Sentinel/);
});

test('la sesión sobrevive a una recarga (F5) en una ruta protegida', async ({ page }) => {
  await login(page, ADMIN);
  await page.reload();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole('heading', { name: 'Dashboard de inicio' })).toBeVisible({
    timeout: 20_000,
  });

  // F5 también dentro de una ruta profunda
  await page.goto('/app/miembros');
  await page.reload();
  await expect(page).toHaveURL(/\/app\/miembros/);
  await expect(page.getByText('Gestión de Miembros')).toBeVisible({ timeout: 20_000 });
});
