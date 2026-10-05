export type EstadoIndicador =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'PENDIENTE_APROBACION'
  | 'COMPLETADO';

export type EstadoProgresion =
  | 'EN_CURSO'
  | 'SOLICITADA'
  | 'APROBADA'
  | 'RECHAZADA';

export interface JovenRef {
  id: string;
  jovenId: string;
  nombres: string;
  apellidos: string;
  unidad: string;
}

export interface AdelantoActual {
  id: string;
  adelantoId: string;
  orden: number;
  nombre: string;
  umbralPorcentaje: number | null;
  poolTotal: number;
  requerido: number;
  completados: number;
  porcentajeActual: number;
  esPruebaAislada: boolean;
  faltantes: number;
}

export interface AreaResumen {
  area: string;
  total: number;
  completados: number;
  enProceso: number;
  pendienteAprobacion: number;
  pendientes: number;
}

export interface ConteoPrueba {
  total: number;
  completados: number;
  enProceso: number;
  pendienteAprobacion: number;
  pendientes: number;
}

export interface HistorialProgresion {
  id: string;
  adelantoId: string;
  orden: number;
  nombre: string;
  estado: EstadoProgresion;
  fechaInicio: string;
  fechaCulminacion: string | null;
  aprobadoPor: string | null;
  aprobadoEn: string | null;
}

export interface ResumenProgresion {
  joven: JovenRef;
  adelantoActual: AdelantoActual | null;
  porArea: AreaResumen[];
  historialProgresiones: HistorialProgresion[];
  puedeAprobar: boolean;
  bloqueo: { motivo: string } | null;
}

export interface IndicadorJoven {
  id: string;
  codigo: string;
  texto: string;
  orden: number;
  areaId: string;
  area: string;
  areaTipo: 'AREA_CRECIMIENTO' | 'PRUEBA_ADELANTO';
  etapaId: string | null;
  estado: EstadoIndicador;
  observaciones: string | null;
  registradoPor: string | null;
  registradoEn: string | null;
  aprobadoPor: string | null;
  aprobadoEn: string | null;
}

export interface RespuestaIndicadores {
  joven: JovenRef;
  adelantoActual: { id: string; orden: number; nombre: string } | null;
  indicadores: IndicadorJoven[];
}

export interface FaltanteDetallado {
  id: string;
  codigo: string;
  texto: string;
}

export interface ResultadoSolicitud {
  apto: boolean;
  requerido: number;
  completados: number;
  faltantes: number;
  bloqueo: { motivo: string } | null;
  faltantesDetallados?: FaltanteDetallado[];
}

export interface FilaJovenUnidad {
  miembroId: string;
  jovenId: string | null;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  adelantoActual: {
    id: string;
    orden: number;
    nombre: string;
    estado: EstadoProgresion;
  } | null;
  poolTotal: number;
  requerido: number;
  completados: number;
  porcentajeActual: number;
  progresiones: number;
}

export interface AdelantoCatalogo {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  umbralPorcentaje: number | null;
  edadMinima: number | null;
  rama: 'MANADA' | 'TROPA' | 'COMUNIDAD' | 'CLAN';
}

export interface AprobacionResultado {
  progresion: { id: string; estado: EstadoProgresion; adelanto?: unknown };
  siguiente: { id: string; estado: EstadoProgresion; Adelanto?: { nombre: string } } | null;
}
