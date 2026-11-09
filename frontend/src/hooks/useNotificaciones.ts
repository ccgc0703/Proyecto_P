import { useCallback, useEffect, useRef, useState } from 'react';
import { notificacionesApi } from '../api';
import { Notificacion } from '../types/notificacion';

/** Intervalo de sondeo silencioso del badge (Fase 3: sin websockets). */
const INTERVALO_SONDEO_MS = 60_000;

interface UseNotificacionesResult {
  items: Notificacion[];
  /** Cuenta de no leídas para el badge del campana. */
  noLeidas: number;
  loading: boolean;
  /** Error solo de la carga inicial (el sondeo lo traga en silencio). */
  error: string | null;
  /** Recarga visible (muestra loading y expone errores). */
  reload: () => Promise<void>;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodas: () => Promise<void>;
}

const mensajeError = (err: unknown): string =>
  err instanceof Error && err.message ? err.message : 'No se pudieron cargar las notificaciones.';

/**
 * Notificaciones in-app del usuario autenticado (Fase 3).
 *
 * - Carga inicial + sondeo silencioso cada 60 s (errores del sondeo se
 *   tragan: el badge simplemente conserva su último valor).
 * - `marcarLeida`/`marcarTodas` son optimistas y reconcilian con el
 *   servidor; si fallan, recargan para reflejar el estado real.
 */
export const useNotificaciones = (): UseNotificacionesResult => {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vivo = useRef(true);

  /** Trae la lista y actualiza items + badge. */
  const traer = useCallback(async (silencioso: boolean) => {
    try {
      const l = await notificacionesApi.listar({ limit: 20 });
      if (!vivo.current) return;
      setItems(l.items);
      setNoLeidas(l.noLeidas);
      if (!silencioso) setError(null);
    } catch (err) {
      if (!vivo.current) return;
      // Sondeo silencioso: no molesta al usuario, el badge queda como estaba.
      if (!silencioso) setError(mensajeError(err));
    } finally {
      if (vivo.current && !silencioso) setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    await traer(false);
  }, [traer]);

  // Carga inicial + intervalo de sondeo silencioso.
  useEffect(() => {
    vivo.current = true;
    void traer(false);
    const timer = window.setInterval(() => void traer(true), INTERVALO_SONDEO_MS);
    return () => {
      vivo.current = false;
      window.clearInterval(timer);
    };
  }, [traer]);

  const marcarLeida = useCallback(
    async (id: string) => {
      const previo = items;
      // Optimista: baja el badge al instante.
      setItems((actuales) =>
        actuales.map((n) => (n.id === id && !n.leidaEn ? { ...n, leidaEn: new Date().toISOString() } : n)),
      );
      setNoLeidas((c) => Math.max(0, c - (previo.find((n) => n.id === id && !n.leidaEn) ? 1 : 0)));
      try {
        await notificacionesApi.marcarLeida(id);
      } catch {
        // Reconcilia con el servidor si la escritura falló.
        setItems(previo);
        await traer(true);
      }
    },
    [items, traer],
  );

  const marcarTodas = useCallback(async () => {
    const previo = items;
    setItems((actuales) =>
      actuales.map((n) => (n.leidaEn ? n : { ...n, leidaEn: new Date().toISOString() })),
    );
    setNoLeidas(0);
    try {
      await notificacionesApi.marcarTodas();
    } catch {
      setItems(previo);
      await traer(true);
    }
  }, [items, traer]);

  return { items, noLeidas, loading, error, reload, marcarLeida, marcarTodas };
};
