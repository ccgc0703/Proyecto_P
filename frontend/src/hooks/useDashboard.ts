import { useCallback, useEffect, useState } from 'react';
import { dashboardApi } from '../api';
import { ResumenDashboard } from '../types/dashboard';
import { getApiErrorMessage, getApiStatus } from '../utils/errors';

interface UseResumenDashboardResult {
  data: ResumenDashboard | null;
  loading: boolean;
  error: string | null;
  /** Status HTTP del fallo (null si no es un error axios). */
  status: number | null;
  reload: () => Promise<void>;
}

/**
 * Resumen ejecutivo del dashboard (Fase 2): población, progresión,
 * asistencia y alertas en una sola llamada a `GET /dashboard/resumen`.
 *
 * El alcance por unidad lo resuelve el backend (UnitPolicy), así que este
 * hook no recibe parámetros: siempre pide la vista del usuario autenticado.
 */
export const useResumenDashboard = (): UseResumenDashboardResult => {
  const [data, setData] = useState<ResumenDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      setData(await dashboardApi.getResumen());
    } catch (err: unknown) {
      setData(null);
      setError(getApiErrorMessage(err, 'No se pudo cargar el resumen del dashboard.'));
      setStatus(getApiStatus(err) ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, status, reload };
};
