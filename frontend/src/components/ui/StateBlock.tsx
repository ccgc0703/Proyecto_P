import type { ReactNode } from 'react';
import { Inbox, ErrorOutline, HourglassEmpty } from '@mui/icons-material';

type EstadoCarga = 'loading' | 'empty' | 'error';

interface StateBlockProps {
  estado: EstadoCarga;
  titulo?: string;
  mensaje?: ReactNode;
  /** Botón de reintento o acción secundaria. */
  accion?: ReactNode;
  /** Número de filas de esqueleto a pintar en `loading`. */
  filas?: number;
  className?: string;
}

const PRESETS: Record<EstadoCarga, { titulo: string; mensaje: string; Icono: typeof Inbox }> = {
  loading: {
    titulo: 'Cargando',
    mensaje: 'Estamos recuperando la información…',
    Icono: HourglassEmpty,
  },
  empty: {
    titulo: 'Sin resultados',
    mensaje: 'Todavía no hay datos que mostrar con los filtros actuales.',
    Icono: Inbox,
  },
  error: {
    titulo: 'Algo salió mal',
    mensaje: 'No pudimos cargar la información. Intenta de nuevo en unos segundos.',
    Icono: ErrorOutline,
  },
};

/**
 * Estado unificado de carga / vacío / error para todas las vistas.
 * Reemplaza los tres patrones distintos que hoy hay repartidos por las páginas.
 */
export const StateBlock = ({
  estado,
  titulo,
  mensaje,
  accion,
  filas = 4,
  className = '',
}: StateBlockProps) => {
  const preset = PRESETS[estado];

  if (estado === 'loading') {
    return (
      <div className={['space-y-3', className].filter(Boolean).join(' ')} role="status" aria-live="polite">
        <span className="sr-only">{titulo ?? preset.titulo}</span>
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="skel h-14 w-full" aria-hidden="true" />
        ))}
      </div>
    );
  }

  const Icono = preset.Icono;
  const esError = estado === 'error';

  return (
    <div
      className={['state', esError ? 'state-error' : 'state-empty', className].filter(Boolean).join(' ')}
      role={esError ? 'alert' : 'status'}
    >
      <div className="ic" aria-hidden="true">
        <Icono sx={{ fontSize: 29 }} />
      </div>
      <h3>{titulo ?? preset.titulo}</h3>
      <p>{mensaje ?? preset.mensaje}</p>
      {accion}
    </div>
  );
};
