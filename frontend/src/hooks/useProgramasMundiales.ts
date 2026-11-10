import { useCallback, useEffect, useRef, useState } from 'react';
import { programasMundialesApi } from '../api';
import { ProgramaMiembro } from '../types/programaMundial';
import { getApiStatus } from '../utils/errors';

interface UseProgramasMundialesResult {
  enlaces: ProgramaMiembro[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useProgramasMundiales = (miembroId: string): UseProgramasMundialesResult => {
  const [enlaces, setEnlaces] = useState<ProgramaMiembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guardia de secuencia: StrictMode monta/desmonta y el guardado encadena
  // otra carga. Solo la última petición escribe estado.
  const peticionRef = useRef(0);

  const reload = useCallback(async () => {
    if (!miembroId) return;
    const peticion = ++peticionRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await programasMundialesApi.listarPorMiembro(miembroId);
      if (peticion !== peticionRef.current) return;
      setEnlaces(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (peticion !== peticionRef.current) return;
      setEnlaces([]);
      // 404 = miembro no visible para este usuario (fail-closed): lista vacía
      if (getApiStatus(err) !== 404) {
        setError('No se pudieron cargar los programas mundiales.');
      }
    } finally {
      if (peticion === peticionRef.current) setLoading(false);
    }
  }, [miembroId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { enlaces, loading, error, reload };
};
