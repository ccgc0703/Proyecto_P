export type TipoNodoOrganizacion =
  | 'CONSEJO_NACIONAL'
  | 'DIRECCION_EJECUTIVA'
  | 'REGION'
  | 'DISTRITO'
  | 'GRUPO';

export interface UnidadDelNodo {
  id: string;
  nombre: string;
  tipo: string | null;
  grupoId: string | null;
}

export interface NodoOrganizacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoNodoOrganizacion;
  nivel: number;
  padreId: string | null;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  Unidades?: UnidadDelNodo[];
  hijos?: NodoOrganizacion[];
}

export interface NodoPlano extends Omit<NodoOrganizacion, 'hijos' | 'Unidades'> {
  _count?: { hijos: number; Unidades: number };
}

export const ETIQUETA_TIPO: Record<TipoNodoOrganizacion, string> = {
  CONSEJO_NACIONAL: 'Consejo Nacional',
  DIRECCION_EJECUTIVA: 'Dirección Ejecutiva',
  REGION: 'Región',
  DISTRITO: 'Distrito',
  GRUPO: 'Grupo',
};

export const HIJOS_PERMITIDOS: Record<TipoNodoOrganizacion, TipoNodoOrganizacion | null> = {
  CONSEJO_NACIONAL: null,
  DIRECCION_EJECUTIVA: 'CONSEJO_NACIONAL',
  REGION: 'DIRECCION_EJECUTIVA',
  DISTRITO: 'REGION',
  GRUPO: 'DISTRITO',
};

// ── Cargos (Fase 2) ────────────────────────────────────────────────────────

export interface UsuarioCargo {
  id: string;
  nombre: string;
  apellido?: string | null;
  email: string;
}

export interface CargoAsignacion {
  id: string;
  usuarioId: string;
  nodoId: string;
  cargo: string;
  desde: string;
  hasta?: string | null;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  Usuario: UsuarioCargo;
}

export const ETIQUETA_CARGO: Record<string, string> = {
  MIEMBRO_CONSEJO: 'Miembro del Consejo',
  DIR_EJECUTIVO: 'Director Ejecutivo',
  DIR_PROGRAMA_JOVENES: 'Dir. Programa de Jóvenes',
  DIR_ADULTOS_MOVIMIENTO: 'Dir. Adultos en el Movimiento',
  DIR_DESARROLLO_INSTITUCIONAL: 'Dir. Desarrollo Institucional',
  COOPERADOR_NACIONAL: 'Cooperador Nacional',
  COMISIONADO_REGIONAL: 'Comisionado Regional',
  ASISTENTE_PROGRAMA: 'Asistente de Programa',
  COOPERADOR_REGIONAL: 'Cooperador Regional',
  COMISIONADO_DISTRITAL: 'Comisionado Distrital',
  COOPERADOR_DISTRITAL: 'Cooperador Distrital',
  JEFE_GRUPO: 'Jefe de Grupo',
  SUBJEFE_GRUPO: 'Subjefe de Grupo',
  REPRESENTANTE_UNIDAD: 'Representante de Unidad',
  ADULTO_COLABORADOR: 'Adulto Colaborador',
};

export const etiquetaCargo = (cargo: string): string => ETIQUETA_CARGO[cargo] ?? cargo;
