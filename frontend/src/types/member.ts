export interface MiembroUnidad {
  id: string;
  nombre?: string;
}

export interface RepresentanteInfo {
  id?: string;
  nombre?: string;
  cedula?: string;
  telefono?: string;
  direccion?: string;
  parentesco?: string;
}

export interface Progresion {
  id: string;
  etapa: string;
  fechaInicio?: string;
}

export interface UnitUser {
  id?: string;
  nombre?: string;
  apellido?: string;
}

export interface UnidadEntity {
  id: string;
  nombre?: string;
  Usuarios?: UnitUser[];
}

export interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  cedula?: string;
  fechaNacimiento?: string;
  genero?: string;
  tipo?: string;
  estado?: string;
  unidadId?: string;
  miembroId?: string;
  email?: string;
  Unidad?: MiembroUnidad;
  Representante?: RepresentanteInfo | null;
  Progresiones?: Progresion[];
}
