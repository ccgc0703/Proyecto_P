export type EstadoProgramaMundial = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO';

export type TipoProgramaMundial = 'PROGRAMA_MUNDIAL' | 'DESAFIO' | 'INICIATIVA';

/** Programa del catálogo mundial (WHC, Jamboree, desafíos…). */
export interface ProgramaMundial {
  id: string;
  nombre: string;
  tipo: TipoProgramaMundial;
  descripcion?: string | null;
  activo: boolean;
}

/** Enlace de un programa mundial con un miembro. */
export interface ProgramaMiembro {
  id: string;
  miembroId: string;
  programaMundialId: string;
  fechaInicio: string;
  fechaCompletado?: string | null;
  estado: EstadoProgramaMundial;
  ProgramaMundial?: ProgramaMundial | null;
}

/** Alta de un enlace (`POST /programas-mundiales`). */
export interface NuevaInscripcionPrograma {
  miembroId: string;
  programaMundialId: string;
  fechaInicio: string;
  fechaCompletado?: string | null;
  estado?: EstadoProgramaMundial;
}

/** Edición de un enlace (`PATCH /programas-mundiales/:id`). */
export interface CambiosInscripcionPrograma {
  programaMundialId?: string;
  fechaInicio?: string;
  fechaCompletado?: string | null;
  estado?: EstadoProgramaMundial;
}
