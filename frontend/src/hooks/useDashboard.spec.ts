import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useResumenDashboard } from './useDashboard';
import { dashboardApi } from '../api';
import type { ResumenDashboard } from '../types/dashboard';

vi.mock('../api', () => ({
  dashboardApi: { getResumen: vi.fn() },
}));

const getResumen = vi.mocked(dashboardApi.getResumen);

const resumenEjemplo: ResumenDashboard = {
  poblacion: {
    total: 100,
    varMensual: 3,
    porUnidad: [{ unidadId: 'u1', nombre: 'Manada', total: 100 }],
  },
  progresion: {
    promedioPorcentaje: 66.7,
    adelantosAprobadosMes: 1,
    solicitudesPendientes: 2,
    porUnidad: [{ unidadId: 'u1', nombre: 'Manada', porcentaje: 67 }],
  },
  asistencia: {
    ultimaActividad: null,
    promedio30d: 33,
    tendenciaSemanal: [{ semana: '2026-10-01', porcentaje: 33 }],
    porUnidad: [{ unidadId: 'u1', nombre: 'Manada', porcentaje: 33 }],
  },
  alertas: [
    {
      tipo: 'SOLICITUD_PENDIENTE',
      texto: '2 solicitud(es) de adelanto esperando aprobación',
      link: '/app/progresion',
    },
  ],
};

describe('useResumenDashboard', () => {
  beforeEach(() => {
    getResumen.mockReset();
  });

  it('inicia en loading y carga el resumen al montar', async () => {
    getResumen.mockResolvedValue(resumenEjemplo);

    const { result } = renderHook(() => useResumenDashboard());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(resumenEjemplo);
    expect(result.current.error).toBeNull();
    expect(getResumen).toHaveBeenCalledTimes(1);
  });

  it('expone el error y deja data en null cuando la llamada falla', async () => {
    getResumen.mockRejectedValue(new Error('Sin conexión'));

    const { result } = renderHook(() => useResumenDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Sin conexión');
    expect(result.current.status).toBeNull();
  });

  it('captura el status HTTP 403 cuando el rol no tiene joven:view', async () => {
    getResumen.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { message: 'Acceso denegado. Permisos faltantes: joven:view' } },
    });

    const { result } = renderHook(() => useResumenDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.status).toBe(403);
    expect(result.current.error).toBe('Acceso denegado. Permisos faltantes: joven:view');
  });

  it('reload limpia el error y vuelve a pedir los datos', async () => {
    getResumen.mockRejectedValueOnce(new Error('Fallo transitorio'));

    const { result } = renderHook(() => useResumenDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Fallo transitorio');

    getResumen.mockResolvedValueOnce(resumenEjemplo);
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(resumenEjemplo);
    expect(getResumen).toHaveBeenCalledTimes(2);
  });
});
