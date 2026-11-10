import { useCallback, useEffect, useRef, useState } from 'react';
import { datosScoutApi } from '../api';
import { DatosScout } from '../types/datosScout';
import { getApiStatus } from '../utils/errors';

interface UseDatosScoutResult {
  datos: DatosScout | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useDatosScout = (miembroId: string): UseDatosScoutResult => {
  const [datos, setDatos] = useState<DatosScout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guardia de secuencia: StrictMode monta y desmonta el efecto, y el guardado
  // encadena otra carga. Solo la última petición escribe estado.
  const peticionRef = useRef(0);

  const reload = useCallback(async () => {
    if (!miembroId) return;
    const peticion = ++peticionRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await datosScoutApi.getByMiembro(miembroId);
      if (peticion !== peticionRef.current) return;
      setDatos(data ?? null);
    } catch (err: unknown) {
      if (peticion !== peticionRef.current) return;
      // 404 = el miembro aún no tiene expediente (estado válido)
      if (getApiStatus(err) === 404) {
        setDatos(null);
      } else {
        setError('No se pudo cargar el expediente scout.');
      }
    } finally {
      if (peticion === peticionRef.current) setLoading(false);
    }
  }, [miembroId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { datos, loading, error, reload };
};
