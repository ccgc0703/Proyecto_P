export type TipoSangre =
  | 'A_POSITIVO'
  | 'A_NEGATIVO'
  | 'B_POSITIVO'
  | 'B_NEGATIVO'
  | 'AB_POSITIVO'
  | 'AB_NEGATIVO'
  | 'O_POSITIVO'
  | 'O_NEGATIVO'
  | 'DESCONOCIDO';

export type Severidad = 'LEVE' | 'MODERADA' | 'SEVERA';

export interface AlergiaFichaMedica {
  id: string;
  fichaMedicaId: string;
  nombre: string;
  severidad: Severidad;
  reaccion?: string | null;
  observaciones?: string | null;
}

export interface MedicamentoFichaMedica {
  id: string;
  fichaMedicaId: string;
  nombre: string;
  dosis?: string | null;
  frecuencia?: string | null;
  motivo?: string | null;
  prescritoPor?: string | null;
}

export interface CondicionFichaMedica {
  id: string;
  fichaMedicaId: string;
  nombre: string;
  descripcion?: string | null;
  fechaDiagnostico?: string | null;
  requiereControl: boolean;
}

export interface VacunaFichaMedica {
  id: string;
  fichaMedicaId: string;
  nombre: string;
  fechaAplicacion?: string | null;
  lote?: string | null;
  observaciones?: string | null;
}

export interface FichaMedica {
  id: string;
  miembroId: string;
  tipoSangre?: TipoSangre | null;
  telefono?: string | null;
  email?: string | null;
  medicoTratante?: string | null;
  telefonoMedico?: string | null;
  seguroCompania?: string | null;
  seguroPoliza?: string | null;
  seguroVigencia?: string | null;
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;
  alergias?: string | null;
  medicamentos?: string | null;
  condiciones?: string | null;
  observaciones?: string | null;
  consentimiento?: boolean | null;
  consentimientoFecha?: string | null;
  consentimientoObservaciones?: string | null;
  Alergias: AlergiaFichaMedica[];
  Medicamentos: MedicamentoFichaMedica[];
  Condiciones: CondicionFichaMedica[];
  Vacunas: VacunaFichaMedica[];
}

export const TIPO_SANGRE_OPCIONES: { value: TipoSangre; label: string }[] = [
  { value: 'A_POSITIVO', label: 'A+' },
  { value: 'A_NEGATIVO', label: 'A-' },
  { value: 'B_POSITIVO', label: 'B+' },
  { value: 'B_NEGATIVO', label: 'B-' },
  { value: 'AB_POSITIVO', label: 'AB+' },
  { value: 'AB_NEGATIVO', label: 'AB-' },
  { value: 'O_POSITIVO', label: 'O+' },
  { value: 'O_NEGATIVO', label: 'O-' },
  { value: 'DESCONOCIDO', label: 'Desconocido' },
];

export const SEVERIDAD_OPCIONES: { value: Severidad; label: string }[] = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADA', label: 'Moderada' },
  { value: 'SEVERA', label: 'Severa' },
];

export const tipoSangreLabel = (value?: TipoSangre | null): string =>
  TIPO_SANGRE_OPCIONES.find((o) => o.value === value)?.label ?? 'No registrado';

export const severidadLabel = (value: Severidad): string =>
  SEVERIDAD_OPCIONES.find((o) => o.value === value)?.label ?? value;
