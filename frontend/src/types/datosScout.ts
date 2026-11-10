/** Patrulla (sub-unidad) a la que puede pertenecer un miembro. */
export interface PatrullaRef {
  id: string;
  nombre: string;
  color?: string | null;
}

/** Expediente scout de un miembro (relación 1:1 con `Miembro`). */
export interface DatosScout {
  id: string;
  miembroId: string;
  fechaRegistro?: string | null;
  fechaIngreso?: string | null;
  fechaPromesa?: string | null;
  cargoActual?: string | null;
  observaciones?: string | null;
  patrullaId?: string | null;
  Patrulla?: PatrullaRef | null;
}

/** Campos editables del expediente (`PATCH /datos-scout/miembro/:id`). */
export interface CambiosDatosScout {
  fechaRegistro?: string | null;
  fechaIngreso?: string | null;
  fechaPromesa?: string | null;
  cargoActual?: string | null;
  observaciones?: string | null;
  patrullaId?: string | null;
}

export interface NuevoDatosScout extends CambiosDatosScout {
  miembroId: string;
}
