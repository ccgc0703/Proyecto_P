import { test, expect } from '@playwright/test';
import { ADMIN, JOVEN, login } from './helpers';

test('dashboard: KPIs y secciones con métricas reales', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page, ADMIN);

  await expect(page.getByRole('heading', { name: 'Dashboard de inicio' })).toBeVisible({
    timeout: 20_000,
  });

  // Los 3 KPIs cargan valores numéricos (no el "—" del estado de carga)
  const kpis = page.locator('.kpi');
  await expect(kpis).toHaveCount(3);
  await expect(kpis.first().locator('.val')).toHaveText(/\d/, { timeout: 20_000 });

  // Secciones del resumen ejecutivo
  await expect(page.getByRole('heading', { name: 'Desglose por Unidades' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Asistencia' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Progresión por Unidad' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Alertas', exact: true })).toBeVisible();

  // La tendencia pinta exactamente 8 buckets de 7 días
  await expect(
    page.getByRole('img', { name: 'Tendencia semanal de asistencia' }).locator('[title]'),
  ).toHaveCount(8);

  // El desglose del donut muestra al menos una unidad con datos
  await expect(page.locator('.dlegend .li').first()).toBeVisible();
});

test('joven sin joven:view: el dashboard muestra "Vista restringida"', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page, JOVEN);

  // El rol JOVEN no tiene joven:view → 403 gestionado sin botón de reintento
  await expect(page.getByRole('heading', { name: 'Vista restringida' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole('button', { name: 'Reintentar' })).toHaveCount(0);
});
