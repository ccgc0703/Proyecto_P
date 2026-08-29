import { useCallback, useEffect, useState } from 'react';
import { fichaMedicaApi } from '../api';
import { FichaMedica } from '../types/fichaMedica';
import { getApiStatus } from '../utils/errors';

interface UseFichaMedicaResult {
  ficha: FichaMedica | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useFichaMedica = (miembroId: string): UseFichaMedicaResult => {
  const [ficha, setFicha] = useState<FichaMedica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!miembroId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fichaMedicaApi.getByMiembro(miembroId);
      setFicha(data ?? null);
    } catch (err: unknown) {
      // 404 = el miembro aún no tiene ficha (estado válido)
      if (getApiStatus(err) === 404) {
        setFicha(null);
      } else {
        setError('No se pudo cargar la ficha médica.');
      }
    } finally {
      setLoading(false);
    }
  }, [miembroId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ficha, loading, error, reload };
};
