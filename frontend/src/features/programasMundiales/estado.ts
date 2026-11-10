import { EstadoProgramaMundial } from '../../types/programaMundial';

/** Etiqueta legible de cada estado de la inscripción. */
export const ETIQUETA_ESTADO: Record<EstadoProgramaMundial, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  COMPLETADO: 'Completado',
};

/** Color del token de tema asociado a cada estado. */
export const COLOR_ESTADO: Record<EstadoProgramaMundial, string> = {
  PENDIENTE: 'var(--color-outline)',
  EN_CURSO: 'var(--color-warning)',
  COMPLETADO: 'var(--color-success, #2e7d32)',
};

/** Fecha corta en español, forzada a UTC para que no corra un día. */
export const formatoFecha = (valor?: string | null) =>
  valor
    ? new Date(valor).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '—';
