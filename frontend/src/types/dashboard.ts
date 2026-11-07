/**
 * Tipos del resumen ejecutivo del dashboard (GET /dashboard/resumen).
 * Espejo de `src/modules/dashboard/dashboard.service.ts` (backend).
 */

export interface UnidadTotal {
  unidadId: string;
  nombre: string;
  total: number;
}

export interface UnidadPorcentaje {
  unidadId: string;
  nombre: string;
  porcentaje: number;
}

export interface PoblacionDashboard {
  total: number;
  /** Altas − bajas de los últimos 30 días. */
  varMensual: number;
  porUnidad: UnidadTotal[];
}

export interface ProgresionDashboard {
  /** % promedio de indicadores completados (0–100, 1 decimal). */
  promedioPorcentaje: number;
  adelantosAprobadosMes: number;
  solicitudesPendientes: number;
  porUnidad: UnidadPorcentaje[];
}

export interface ActividadReciente {
  id: string;
  titulo: string;
  fecha: string;
  tipo: string;
}

export interface BucketSemana {
  /** Fecha de inicio del bucket (YYYY-MM-DD), de la más antigua a la más reciente. */
  semana: string;
  porcentaje: number;
}

export interface AsistenciaDashboard {
  ultimaActividad: ActividadReciente | null;
  /** % PRESENTE/marcados en la ventana de 30 días. */
  promedio30d: number;
  /** 8 buckets de 7 días (56 días). */
  tendenciaSemanal: BucketSemana[];
  porUnidad: UnidadPorcentaje[];
}

export type TipoAlerta =
  | 'SOLICITUD_PENDIENTE'
  | 'INDICADOR_PENDIENTE'
  | 'SEGURO_POR_VENCER';

export interface AlertaDashboard {
  tipo: TipoAlerta;
  texto: string;
  /** Ruta interna del frontend. */
  link: string;
}

export interface ResumenDashboard {
  poblacion: PoblacionDashboard;
  progresion: ProgresionDashboard;
  asistencia: AsistenciaDashboard;
  alertas: AlertaDashboard[];
}
