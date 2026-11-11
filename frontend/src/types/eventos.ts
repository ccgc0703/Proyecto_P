// Tipos del módulo de Eventos y Asistencias (espejo de los enums de Prisma).

export type EstadoPlanificacion =
  | 'BORRADOR'
  | 'APROBADO'
  | 'EN_CURSO'
  | 'COMPLETADO'
  | 'CANCELADO';

export type TipoActividad =
  | 'REUNION'
  | 'CAMPAMENTO'
  | 'EXCURSION'
  | 'SERVICIO_COMUNITARIO'
  | 'TALLER'
  | 'CEREMONIA'
  | 'COMPETENCIA'
  | 'OTRO';

export type EstadoActividad = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';

export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO';

/** Ámbito jerárquico de publicación (Fase 3 · Calendario). */
export type AlcancePlanificacion = 'GRUPO' | 'DISTRITO' | 'REGION' | 'NACIONAL';

export interface Planificacion {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fechaInicio: string;
  fechaFin: string;
  unidadId?: string | null;
  /** Nodo desde el que se publicó (null = planificación legada). */
  nodoId?: string | null;
  /** Nivel derivado en el backend a partir del tipo de nodo. */
  alcance?: AlcancePlanificacion;
  estado: EstadoPlanificacion;
  createdAt?: string;
  updatedAt?: string;
  _count?: { Actividades: number };
}

export interface ResumenPlanificacion {
  id: string;
  titulo: string;
  unidadId: string | null;
  estado: EstadoPlanificacion;
  fechaInicio: string;
  fechaFin: string;
}

export interface Actividad {
  id: string;
  titulo: string;
  descripcion?: string | null;
  tipo: TipoActividad;
  fecha: string;
  horaInicio?: string | null;
  horaFin?: string | null;
  lugar?: string | null;
  responsable?: string | null;
  estado: EstadoActividad;
  planificacionId: string;
  Planificacion?: ResumenPlanificacion;
}

/** Fila de la planilla: joven del ámbito + su marca (null = sin marcar). */
export interface FilaAsistencia {
  miembroId: string;
  nombres: string;
  apellidos: string;
  unidadId: string;
  asistenciaId: string | null;
  estado: EstadoAsistencia | null;
  observacion?: string | null;
}

export interface PlanillaAsistencia {
  actividad: {
    id: string;
    titulo: string;
    fecha: string;
    tipo: TipoActividad;
    estado: EstadoActividad;
    planificacionId: string;
    planificacion: ResumenPlanificacion;
  };
  registros: FilaAsistencia[];
}

/** Registro enviado en el marcado masivo (POST /eventos/actividades/:id/asistencias). */
export interface MarcaAsistencia {
  miembroId: string;
  estado: EstadoAsistencia;
  observacion?: string;
}

export const ESTADOS_PLANIFICACION: { valor: EstadoPlanificacion; label: string; clase: string }[] = [
  { valor: 'BORRADOR', label: 'Borrador', clase: 'bg-surface-container-high text-outline border-outline/10' },
  { valor: 'APROBADO', label: 'Aprobado', clase: 'bg-blue-500/5 text-blue-600 border-blue-500/20' },
  { valor: 'EN_CURSO', label: 'En curso', clase: 'bg-amber-500/5 text-amber-600 border-amber-500/20' },
  { valor: 'COMPLETADO', label: 'Completado', clase: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' },
  { valor: 'CANCELADO', label: 'Cancelado', clase: 'bg-error/5 text-error border-error/20' },
];

export const ESTADOS_ACTIVIDAD: { valor: EstadoActividad; label: string; clase: string }[] = [
  { valor: 'PENDIENTE', label: 'Pendiente', clase: 'bg-surface-container-high text-outline border-outline/10' },
  { valor: 'EN_CURSO', label: 'En curso', clase: 'bg-amber-500/5 text-amber-600 border-amber-500/20' },
  { valor: 'COMPLETADA', label: 'Completada', clase: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' },
  { valor: 'CANCELADA', label: 'Cancelada', clase: 'bg-error/5 text-error border-error/20' },
];

export const TIPOS_ACTIVIDAD: { valor: TipoActividad; label: string }[] = [
  { valor: 'REUNION', label: 'Reunión' },
  { valor: 'CAMPAMENTO', label: 'Campamento' },
  { valor: 'EXCURSION', label: 'Excursión' },
  { valor: 'SERVICIO_COMUNITARIO', label: 'Servicio comunitario' },
  { valor: 'TALLER', label: 'Taller' },
  { valor: 'CEREMONIA', label: 'Ceremonia' },
  { valor: 'COMPETENCIA', label: 'Competencia' },
  { valor: 'OTRO', label: 'Otro' },
];

export const ESTADOS_ASISTENCIA: { valor: EstadoAsistencia; label: string; clase: string; short: string }[] = [
  { valor: 'PRESENTE', label: 'Presente', clase: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', short: 'P' },
  { valor: 'AUSENTE', label: 'Ausente', clase: 'bg-error/10 text-error border-error/30', short: 'A' },
  { valor: 'JUSTIFICADO', label: 'Justificado', clase: 'bg-amber-500/10 text-amber-600 border-amber-500/30', short: 'J' },
];

export const metaEstadoPlanificacion = (estado: EstadoPlanificacion) =>
  ESTADOS_PLANIFICACION.find((e) => e.valor === estado) ?? ESTADOS_PLANIFICACION[0];

export const metaEstadoActividad = (estado: EstadoActividad) =>
  ESTADOS_ACTIVIDAD.find((e) => e.valor === estado) ?? ESTADOS_ACTIVIDAD[0];

export const metaTipoActividad = (tipo: TipoActividad) =>
  TIPOS_ACTIVIDAD.find((t) => t.valor === tipo) ?? { valor: tipo, label: tipo };
