/** Formación (curso/certificación) de un adulto responsable. */
export interface Formacion {
  id: string;
  nombre: string;
  /** ISO 8601 (la API devuelve la fecha completa). */
  fecha: string;
  director: string;
  adultoId: string;
  createdAt: string;
  updatedAt: string;
  Adulto: {
    id: string;
    Miembro: {
      id: string;
      nombres: string;
      apellidos: string;
      unidadId: string;
    };
  };
}

/** Adulto tal como lo devuelve `GET /adultos` (Miembro aplanado). */
export interface AdultoFormacion {
  id: string;
  nombres: string;
  apellidos: string;
  unidadId: string;
  Unidad?: { id: string; nombre: string } | null;
}

export interface NuevaFormacion {
  nombre: string;
  fecha: string;
  director: string;
  adultoId: string;
}

export type CambiosFormacion = Partial<NuevaFormacion>;
