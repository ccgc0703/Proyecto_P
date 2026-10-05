import { useCallback, useEffect, useRef, useState } from 'react';
import { progresionApi } from '../api';
import {
  FilaJovenUnidad,
  ResumenProgresion,
  RespuestaIndicadores,
} from '../types/progresion';
import { getApiErrorMessage, getApiStatus } from '../utils/errors';

interface UseRecursoResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const useRecurso = <T>(
  clave: string | undefined,
  cargar: () => Promise<T>,
  vacio: string,
): UseRecursoResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cargarRef = useRef(cargar);

  useEffect(() => {
    cargarRef.current = cargar;
  });

  const reload = useCallback(async () => {
    if (!clave) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await cargarRef.current());
    } catch (err: unknown) {
      setData(null);
      setError(getApiStatus(err) === 404 ? vacio : getApiErrorMessage(err, vacio));
    } finally {
      setLoading(false);
    }
  }, [clave, vacio]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
};

export const useResumen = (miembroId?: string): UseRecursoResult<ResumenProgresion> =>
  useRecurso(
    miembroId,
    () => progresionApi.getResumen(miembroId as string),
    'Sin datos de progresión para este miembro.',
  );

export const useIndicadores = (
  miembroId?: string,
): UseRecursoResult<RespuestaIndicadores> =>
  useRecurso(
    miembroId,
    () => progresionApi.getIndicadores(miembroId as string),
    'No se pudieron cargar los indicadores.',
  );

export const useJovenesUnidad = (
  unidadId?: string,
): UseRecursoResult<FilaJovenUnidad[]> =>
  useRecurso(
    unidadId,
    () => progresionApi.jovenesDeUnidad(unidadId as string),
    'No se pudo cargar la progresión de la unidad.',
  );
