import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

/**
 * Smoke E2E del módulo de Eventos y Asistencias (Fase 1):
 * navegación por permiso, CRUD de planificación y actividad, y la planilla.
 * Los datos usan un sufijo único y se eliminan al final del test.
 */
test('eventos: crear planificación, actividad, ver planilla y limpiar', async ({ page }) => {
  const marca = Date.now().toString(36);
  const nombrePlan = `Plan E2E ${marca}`;
  const nombreAct = `Actividad E2E ${marca}`;

  await login(page, ADMIN);

  // 1. El ítem "Eventos" del sidebar lleva a la página (evento:view)
  await page.getByRole('button', { name: 'Eventos', exact: true }).click();
  await page.waitForURL('**/app/eventos', { timeout: 20_000 });
  await expect(page.getByText('Eventos y Asistencias').first()).toBeVisible({ timeout: 20_000 });

  // 2. Crear planificación
  await page.getByRole('button', { name: /Nueva Planificación/ }).click();
  const dialogoPlan = page.locator('[role="dialog"]');
  await expect(dialogoPlan).toBeVisible();
  await dialogoPlan.getByPlaceholder('Ej: Semana 1 de marzo').fill(nombrePlan);
  await dialogoPlan.locator('input[type="date"]').first().fill('2026-12-01');
  await dialogoPlan.locator('input[type="date"]').nth(1).fill('2026-12-07');
  await dialogoPlan.getByRole('button', { name: /Crear Planificación/ }).click();

  const filaPlan = page.getByText(nombrePlan, { exact: true }).first();
  await expect(filaPlan).toBeVisible({ timeout: 15_000 });

  // 3. Expandir y crear actividad dentro de ella
  await page.getByRole('button', { name: new RegExp(nombrePlan) }).first().click();
  await expect(page.getByText(/Actividades · 0/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Nueva Actividad/ }).click();
  const dialogoAct = page.locator('[role="dialog"]');
  await expect(dialogoAct).toBeVisible();
  await dialogoAct.getByPlaceholder('Ej: Reunión semanal').fill(nombreAct);
  await dialogoAct.locator('input[type="date"]').first().fill('2026-12-03');
  await dialogoAct.getByRole('button', { name: /Crear Actividad/ }).click();

  await expect(page.getByText(nombreAct, { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Actividades · 1/)).toBeVisible();

  // 4. Abrir la planilla (sin marcar: solo lectura visual) y cerrarla
  await page.getByRole('button', { name: /Asistencia/ }).first().click();
  const dialogoAsis = page.locator('[role="dialog"]');
  await expect(dialogoAsis).toBeVisible();
  await expect(dialogoAsis.getByText(nombreAct)).toBeVisible({ timeout: 20_000 });
  await expect(dialogoAsis.getByText('Marcar todos presente')).toBeVisible();
  await expect(dialogoAsis.getByText('Guardar asistencia')).toBeDisabled();
  await dialogoAsis.getByRole('button', { name: 'Cerrar' }).click();
  await expect(dialogoAsis).toBeHidden();

  // 5. Limpieza: eliminar la actividad (sin asistencias registradas) y la planificación
  await page.getByRole('button', { name: `Eliminar ${nombreAct}` }).click();
  await expect(page.getByText(nombreAct, { exact: true })).toBeHidden({ timeout: 15_000 });

  await page.getByRole('button', { name: `Eliminar ${nombrePlan}` }).click();
  await expect(page.getByText(nombrePlan, { exact: true })).toBeHidden({ timeout: 15_000 });
});

test('eventos: el joven sin permiso ve Acceso Denegado', async ({ page }) => {
  await login(page, { email: 'joven.test@poseidon.com', password: 'joven456' });
  await page.goto('/app/eventos');
  // La regla de ruta (/app/eventos → evento:view) pinta el blindaje del layout
  await expect(page.getByText('Acceso Denegado')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/No tienes permisos/)).toBeVisible();
});
