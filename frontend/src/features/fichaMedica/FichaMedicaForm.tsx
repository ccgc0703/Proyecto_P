import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Close,
  Add,
  DeleteOutline,
  MedicalInformation,
  SaveAlt,
  ErrorOutline,
  Shield,
  ContactEmergency,
  WarningAmber,
  Medication,
  LocalHospital,
  Vaccines,
  VerifiedUser,
  Notes,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fichaMedicaApi } from '../../api';
import { getApiErrorMessage } from '../../utils/errors';
import {
  FichaMedica,
  TIPO_SANGRE_OPCIONES,
  SEVERIDAD_OPCIONES,
  TipoSangre,
  Severidad,
} from '../../types/fichaMedica';

const alergiaSchema = z.object({
  id: z.string().optional(),
  eliminar: z.boolean().optional(),
  nombre: z.string().optional().or(z.literal('')),
  severidad: z.enum(['LEVE', 'MODERADA', 'SEVERA']).default('LEVE'),
  reaccion: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal('')),
});

const medicamentoSchema = z.object({
  id: z.string().optional(),
  eliminar: z.boolean().optional(),
  nombre: z.string().optional().or(z.literal('')),
  dosis: z.string().optional().or(z.literal('')),
  frecuencia: z.string().optional().or(z.literal('')),
  motivo: z.string().optional().or(z.literal('')),
  prescritoPor: z.string().optional().or(z.literal('')),
});

const condicionSchema = z.object({
  id: z.string().optional(),
  eliminar: z.boolean().optional(),
  nombre: z.string().optional().or(z.literal('')),
  descripcion: z.string().optional().or(z.literal('')),
  fechaDiagnostico: z.string().optional().or(z.literal('')),
  requiereControl: z.boolean().optional(),
});

const vacunaSchema = z.object({
  id: z.string().optional(),
  eliminar: z.boolean().optional(),
  nombre: z.string().optional().or(z.literal('')),
  fechaAplicacion: z.string().optional().or(z.literal('')),
  lote: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal('')),
});

const fichaSchema = z.object({
  tipoSangre: z.enum(['A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO', 'DESCONOCIDO']).optional().or(z.literal('')),
  telefono: z.string().optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  medicoTratante: z.string().optional().or(z.literal('')),
  telefonoMedico: z.string().optional().or(z.literal('')),
  seguroCompania: z.string().optional().or(z.literal('')),
  seguroPoliza: z.string().optional().or(z.literal('')),
  seguroVigencia: z.string().optional().or(z.literal('')),
  contactoEmergenciaNombre: z.string().optional().or(z.literal('')),
  contactoEmergenciaTelefono: z.string().optional().or(z.literal('')),
  contactoEmergenciaParentesco: z.string().optional().or(z.literal('')),
  alergias: z.string().optional().or(z.literal('')),
  medicamentos: z.string().optional().or(z.literal('')),
  condiciones: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional().or(z.literal('')),
  consentimiento: z.boolean().optional(),
  consentimientoFecha: z.string().optional().or(z.literal('')),
  consentimientoObservaciones: z.string().optional().or(z.literal('')),
  alergiasDetalle: z.array(alergiaSchema).default([]),
  medicamentosDetalle: z.array(medicamentoSchema).default([]),
  condicionesDetalle: z.array(condicionSchema).default([]),
  vacunasDetalle: z.array(vacunaSchema).default([]),
});

type FichaFormData = z.infer<typeof fichaSchema>;

interface FichaMedicaFormProps {
  open: boolean;
  miembroId: string;
  miembroNombre: string;
  ficha: FichaMedica | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Encabezado de sección numerada (patrón de los formularios de la app). */
const Seccion = ({ n, titulo, icono, accion }: {
  n: number;
  titulo: string;
  icono: ReactNode;
  accion?: ReactNode;
}) => (
  <header>
    <div className="ic" aria-hidden="true">{icono}</div>
    <div className="flex-1 min-w-0">
      <span className="micro">Sección {String(n).padStart(2, '0')}</span>
      <h3>{titulo}</h3>
    </div>
    {accion}
  </header>
);

export const FichaMedicaForm = ({
  open,
  miembroId,
  miembroNombre,
  ficha,
  onClose,
  onSaved,
}: FichaMedicaFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const deletedRef = useRef<Record<string, string[]>>({
    alergias: [],
    medicamentos: [],
    condiciones: [],
    vacunas: [],
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FichaFormData>({
    resolver: zodResolver(fichaSchema),
    defaultValues: {
      tipoSangre: '',
      alergiasDetalle: [],
      medicamentosDetalle: [],
      condicionesDetalle: [],
      vacunasDetalle: [],
    },
  });

  const alergiasArray = useFieldArray({ control, name: 'alergiasDetalle' });
  const medicamentosArray = useFieldArray({ control, name: 'medicamentosDetalle' });
  const condicionesArray = useFieldArray({ control, name: 'condicionesDetalle' });
  const vacunasArray = useFieldArray({ control, name: 'vacunasDetalle' });

  useEffect(() => {
    if (!open) return;
    setError(null);
    deletedRef.current = {
      alergias: [],
      medicamentos: [],
      condiciones: [],
      vacunas: [],
    };
    reset({
      tipoSangre: ficha?.tipoSangre ?? '',
      telefono: ficha?.telefono ?? '',
      email: ficha?.email ?? '',
      medicoTratante: ficha?.medicoTratante ?? '',
      telefonoMedico: ficha?.telefonoMedico ?? '',
      seguroCompania: ficha?.seguroCompania ?? '',
      seguroPoliza: ficha?.seguroPoliza ?? '',
      seguroVigencia: ficha?.seguroVigencia?.toString().split('T')[0] ?? '',
      contactoEmergenciaNombre: ficha?.contactoEmergenciaNombre ?? '',
      contactoEmergenciaTelefono: ficha?.contactoEmergenciaTelefono ?? '',
      contactoEmergenciaParentesco: ficha?.contactoEmergenciaParentesco ?? '',
      alergias: ficha?.alergias ?? '',
      medicamentos: ficha?.medicamentos ?? '',
      condiciones: ficha?.condiciones ?? '',
      observaciones: ficha?.observaciones ?? '',
      consentimiento: ficha?.consentimiento ?? false,
      consentimientoFecha: ficha?.consentimientoFecha?.toString().split('T')[0] ?? '',
      consentimientoObservaciones: ficha?.consentimientoObservaciones ?? '',
      alergiasDetalle: (ficha?.Alergias ?? []).map((a) => ({
        id: a.id,
        nombre: a.nombre,
        severidad: a.severidad,
        reaccion: a.reaccion ?? '',
        observaciones: a.observaciones ?? '',
      })),
      medicamentosDetalle: (ficha?.Medicamentos ?? []).map((m) => ({
        id: m.id,
        nombre: m.nombre,
        dosis: m.dosis ?? '',
        frecuencia: m.frecuencia ?? '',
        motivo: m.motivo ?? '',
        prescritoPor: m.prescritoPor ?? '',
      })),
      condicionesDetalle: (ficha?.Condiciones ?? []).map((c) => ({
        id: c.id,
        nombre: c.nombre,
        descripcion: c.descripcion ?? '',
        fechaDiagnostico: c.fechaDiagnostico?.toString().split('T')[0] ?? '',
        requiereControl: c.requiereControl ?? false,
      })),
      vacunasDetalle: (ficha?.Vacunas ?? []).map((v) => ({
        id: v.id,
        nombre: v.nombre,
        fechaAplicacion: v.fechaAplicacion?.toString().split('T')[0] ?? '',
        lote: v.lote ?? '',
        observaciones: v.observaciones ?? '',
      })),
    });
  }, [open, ficha, reset]);

  const markDelete = (
    key: 'alergias' | 'medicamentos' | 'condiciones' | 'vacunas',
    arr: { fields: Array<{ id?: string }>; remove: (index: number) => void },
    index: number,
  ) => {
    const field = arr.fields[index];
    if (field?.id) {
      deletedRef.current[key].push(field.id);
    }
    arr.remove(index);
  };

  const onSubmit = async (data: FichaFormData) => {
    try {
      setError(null);
      setSaving(true);
      const isUpdate = !!ficha?.id;
      const childField = (v: { id?: string; eliminar?: boolean }) => (isUpdate
        ? { id: v.id, eliminar: v.eliminar }
        : {});
      // Solo se envían filas con nombre: se descartan las vacías o incompletas
      const nonEmpty = <T extends { nombre?: string }>(items: T[]) => items.filter((i) => (i.nombre || '').trim() !== '');
      // Para update, se agregan los ids eliminados en el cliente para soft-delete
      const withDeleted = <T extends { id?: string }>(key: string, items: T[]) => [
        ...items,
        ...deletedRef.current[key].map((id) => ({ id, eliminar: true })),
      ] as Array<T & { eliminar?: boolean }>;

      const alergias = nonEmpty(data.alergiasDetalle);
      const medicamentos = nonEmpty(data.medicamentosDetalle);
      const condiciones = nonEmpty(data.condicionesDetalle);
      const vacunas = nonEmpty(data.vacunasDetalle);

      const payload = {
        tipoSangre: (data.tipoSangre as TipoSangre) || undefined,
        telefono: data.telefono || null,
        email: data.email || null,
        medicoTratante: data.medicoTratante || null,
        telefonoMedico: data.telefonoMedico || null,
        seguroCompania: data.seguroCompania || null,
        seguroPoliza: data.seguroPoliza || null,
        seguroVigencia: data.seguroVigencia || null,
        contactoEmergenciaNombre: data.contactoEmergenciaNombre || null,
        contactoEmergenciaTelefono: data.contactoEmergenciaTelefono || null,
        contactoEmergenciaParentesco: data.contactoEmergenciaParentesco || null,
        alergias: data.alergias || null,
        medicamentos: data.medicamentos || null,
        condiciones: data.condiciones || null,
        observaciones: data.observaciones || null,
        consentimiento: data.consentimiento ?? false,
        consentimientoFecha: data.consentimientoFecha || null,
        consentimientoObservaciones: data.consentimientoObservaciones || null,
        alergiasDetalle: withDeleted('alergias', alergias).map((a) => ({
          ...childField(a),
          nombre: a.nombre,
          severidad: a.severidad as Severidad,
          reaccion: a.reaccion || null,
          observaciones: a.observaciones || null,
        })),
        medicamentosDetalle: withDeleted('medicamentos', medicamentos).map((m) => ({
          ...childField(m),
          nombre: m.nombre,
          dosis: m.dosis || null,
          frecuencia: m.frecuencia || null,
          motivo: m.motivo || null,
          prescritoPor: m.prescritoPor || null,
        })),
        condicionesDetalle: withDeleted('condiciones', condiciones).map((c) => ({
          ...childField(c),
          nombre: c.nombre,
          descripcion: c.descripcion || null,
          fechaDiagnostico: c.fechaDiagnostico || null,
          requiereControl: c.requiereControl ?? false,
        })),
        vacunasDetalle: withDeleted('vacunas', vacunas).map((v) => ({
          ...childField(v),
          nombre: v.nombre,
          fechaAplicacion: v.fechaAplicacion || null,
          lote: v.lote || null,
          observaciones: v.observaciones || null,
        })),
      };

      if (isUpdate) {
        await fichaMedicaApi.update(ficha.id, payload);
      } else {
        await fichaMedicaApi.create({ miembroId, ...payload });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al guardar la ficha médica.'));
    } finally {
      setSaving(false);
    }
  };

  const btnAñadir = (onClick: () => void, etiqueta: string) => (
    <button type="button" onClick={onClick} className="btn btn-soft btn-sm flex-none">
      <Add />
      {etiqueta}
    </button>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-low shadow-2xl max-h-[90vh]' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-surface-container grid place-items-center text-primary flex-none">
              <MedicalInformation />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-primary tracking-tight leading-none">
                {ficha?.id ? 'Editar Ficha Médica' : 'Nueva Ficha Médica'}
              </h2>
              <p className="micro block mt-1.5 truncate">{miembroNombre}</p>
            </div>
          </div>
          <button type="button" className="act-btn flex-none" onClick={onClose} aria-label="Cerrar formulario">
            <Close />
          </button>
        </DialogTitle>

        <DialogContent dividers className="px-6 py-5">
          {error && (
            <div className="banner banner-err" role="alert">
              <ErrorOutline />
              <p>{error}</p>
            </div>
          )}

          {/* 01 · Datos generales */}
          <section className="form-sect">
            <Seccion n={1} titulo="Datos Generales" icono={<MedicalInformation />} />
            <div className="form-grid">
              <div className="field">
                <label className="micro" htmlFor="fm-tipo">Tipo de Sangre</label>
                <Controller
                  name="tipoSangre"
                  control={control}
                  render={({ field }) => (
                    <select id="fm-tipo" {...field} className="inp">
                      <option value="">Seleccionar...</option>
                      {TIPO_SANGRE_OPCIONES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-tel">Teléfono</label>
                <input id="fm-tel" {...register('telefono')} className="inp" placeholder="0412-0000000" />
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-email">Email</label>
                <input
                  id="fm-email"
                  {...register('email')}
                  type="email"
                  className="inp"
                  placeholder="correo@ejemplo.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <span className="field-err">{errors.email.message}</span>}
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-medico">Médico Tratante</label>
                <input id="fm-medico" {...register('medicoTratante')} className="inp" />
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-tel-medico">Teléfono del Médico</label>
                <input id="fm-tel-medico" {...register('telefonoMedico')} className="inp" />
              </div>
            </div>
          </section>

          {/* 02 · Seguro */}
          <section className="form-sect">
            <Seccion n={2} titulo="Seguro Médico" icono={<Shield />} />
            <div className="form-grid">
              <div className="field">
                <label className="micro" htmlFor="fm-seg-comp">Compañía</label>
                <input id="fm-seg-comp" {...register('seguroCompania')} className="inp" />
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-seg-poliza">N° Póliza</label>
                <input id="fm-seg-poliza" {...register('seguroPoliza')} className="inp" />
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-seg-vig">Vigencia</label>
                <input id="fm-seg-vig" {...register('seguroVigencia')} type="date" className="inp" />
              </div>
            </div>
          </section>

          {/* 03 · Contacto de emergencia */}
          <section className="form-sect">
            <Seccion n={3} titulo="Contacto de Emergencia" icono={<ContactEmergency />} />
            <div className="form-grid">
              <div className="field">
                <label className="micro" htmlFor="fm-em-nom">Nombre</label>
                <input id="fm-em-nom" {...register('contactoEmergenciaNombre')} className="inp" />
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-em-tel">Teléfono</label>
                <input id="fm-em-tel" {...register('contactoEmergenciaTelefono')} className="inp" />
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-em-par">Parentesco</label>
                <input id="fm-em-par" {...register('contactoEmergenciaParentesco')} className="inp" />
              </div>
            </div>
          </section>

          {/* 04 · Alergias */}
          <section className="form-sect">
            <Seccion
              n={4}
              titulo="Alergias"
              icono={<WarningAmber />}
              accion={btnAñadir(
                () => alergiasArray.append({ nombre: '', severidad: 'LEVE', reaccion: '', observaciones: '' }),
                'Añadir',
              )}
            />
            <div>
              {alergiasArray.fields.map((field, index) => (
                <div key={field.id} className="det-row">
                  <div className="det-head">
                    <span className="micro">Alergia {index + 1}</span>
                    <button
                      type="button"
                      className="act-btn danger"
                      onClick={() => markDelete('alergias', alergiasArray, index)}
                      title="Eliminar alergia"
                      aria-label={`Eliminar alergia ${index + 1}`}
                    >
                      <DeleteOutline />
                    </button>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label className="micro" htmlFor={`fm-al-${index}-nombre`}>Nombre</label>
                      <input id={`fm-al-${index}-nombre`} {...register(`alergiasDetalle.${index}.nombre`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-al-${index}-sev`}>Severidad</label>
                      <select id={`fm-al-${index}-sev`} {...register(`alergiasDetalle.${index}.severidad`)} className="inp">
                        {SEVERIDAD_OPCIONES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-al-${index}-reac`}>Reacción</label>
                      <input id={`fm-al-${index}-reac`} {...register(`alergiasDetalle.${index}.reaccion`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-al-${index}-obs`}>Observaciones</label>
                      <input id={`fm-al-${index}-obs`} {...register(`alergiasDetalle.${index}.observaciones`)} className="inp" />
                    </div>
                  </div>
                </div>
              ))}
              {alergiasArray.fields.length === 0 && (
                <p className="micro">Sin alergias registradas.</p>
              )}
            </div>
          </section>

          {/* 05 · Medicamentos recetados */}
          <section className="form-sect">
            <Seccion
              n={5}
              titulo="Medicamentos Recetados"
              icono={<Medication />}
              accion={btnAñadir(
                () => medicamentosArray.append({ nombre: '', dosis: '', frecuencia: '', motivo: '', prescritoPor: '' }),
                'Añadir',
              )}
            />
            <div>
              {medicamentosArray.fields.map((field, index) => (
                <div key={field.id} className="det-row">
                  <div className="det-head">
                    <span className="micro">Medicamento {index + 1}</span>
                    <button
                      type="button"
                      className="act-btn danger"
                      onClick={() => markDelete('medicamentos', medicamentosArray, index)}
                      title="Eliminar medicamento"
                      aria-label={`Eliminar medicamento ${index + 1}`}
                    >
                      <DeleteOutline />
                    </button>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label className="micro" htmlFor={`fm-md-${index}-nombre`}>Nombre</label>
                      <input id={`fm-md-${index}-nombre`} {...register(`medicamentosDetalle.${index}.nombre`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-md-${index}-dosis`}>Dosis</label>
                      <input id={`fm-md-${index}-dosis`} {...register(`medicamentosDetalle.${index}.dosis`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-md-${index}-frec`}>Frecuencia</label>
                      <input id={`fm-md-${index}-frec`} {...register(`medicamentosDetalle.${index}.frecuencia`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-md-${index}-motivo`}>Motivo</label>
                      <input id={`fm-md-${index}-motivo`} {...register(`medicamentosDetalle.${index}.motivo`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-md-${index}-presc`}>Prescrito Por</label>
                      <input id={`fm-md-${index}-presc`} {...register(`medicamentosDetalle.${index}.prescritoPor`)} className="inp" />
                    </div>
                  </div>
                </div>
              ))}
              {medicamentosArray.fields.length === 0 && (
                <p className="micro">Sin medicamentos recetados.</p>
              )}
            </div>
          </section>

          {/* 06 · Condiciones */}
          <section className="form-sect">
            <Seccion
              n={6}
              titulo="Condiciones Médicas"
              icono={<LocalHospital />}
              accion={btnAñadir(
                () => condicionesArray.append({ nombre: '', descripcion: '', fechaDiagnostico: '', requiereControl: false }),
                'Añadir',
              )}
            />
            <div>
              {condicionesArray.fields.map((field, index) => (
                <div key={field.id} className="det-row">
                  <div className="det-head">
                    <span className="micro">Condición {index + 1}</span>
                    <button
                      type="button"
                      className="act-btn danger"
                      onClick={() => markDelete('condiciones', condicionesArray, index)}
                      title="Eliminar condición"
                      aria-label={`Eliminar condición ${index + 1}`}
                    >
                      <DeleteOutline />
                    </button>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label className="micro" htmlFor={`fm-cd-${index}-nombre`}>Nombre *</label>
                      <input id={`fm-cd-${index}-nombre`} {...register(`condicionesDetalle.${index}.nombre`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-cd-${index}-desc`}>Descripción</label>
                      <input id={`fm-cd-${index}-desc`} {...register(`condicionesDetalle.${index}.descripcion`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-cd-${index}-fecha`}>Fecha Diagnóstico</label>
                      <input id={`fm-cd-${index}-fecha`} {...register(`condicionesDetalle.${index}.fechaDiagnostico`)} type="date" className="inp" />
                    </div>
                    <div className="field flex items-end">
                      <label className="chk">
                        <input {...register(`condicionesDetalle.${index}.requiereControl`)} type="checkbox" />
                        Requiere control médico
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              {condicionesArray.fields.length === 0 && (
                <p className="micro">Sin condiciones registradas.</p>
              )}
            </div>
          </section>

          {/* 07 · Vacunas */}
          <section className="form-sect">
            <Seccion
              n={7}
              titulo="Vacunas"
              icono={<Vaccines />}
              accion={btnAñadir(
                () => vacunasArray.append({ nombre: '', fechaAplicacion: '', lote: '', observaciones: '' }),
                'Añadir',
              )}
            />
            <div>
              {vacunasArray.fields.map((field, index) => (
                <div key={field.id} className="det-row">
                  <div className="det-head">
                    <span className="micro">Vacuna {index + 1}</span>
                    <button
                      type="button"
                      className="act-btn danger"
                      onClick={() => markDelete('vacunas', vacunasArray, index)}
                      title="Eliminar vacuna"
                      aria-label={`Eliminar vacuna ${index + 1}`}
                    >
                      <DeleteOutline />
                    </button>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label className="micro" htmlFor={`fm-vc-${index}-nombre`}>Nombre *</label>
                      <input id={`fm-vc-${index}-nombre`} {...register(`vacunasDetalle.${index}.nombre`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-vc-${index}-fecha`}>Fecha Aplicación</label>
                      <input id={`fm-vc-${index}-fecha`} {...register(`vacunasDetalle.${index}.fechaAplicacion`)} type="date" className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-vc-${index}-lote`}>Lote</label>
                      <input id={`fm-vc-${index}-lote`} {...register(`vacunasDetalle.${index}.lote`)} className="inp" />
                    </div>
                    <div className="field">
                      <label className="micro" htmlFor={`fm-vc-${index}-obs`}>Observaciones</label>
                      <input id={`fm-vc-${index}-obs`} {...register(`vacunasDetalle.${index}.observaciones`)} className="inp" />
                    </div>
                  </div>
                </div>
              ))}
              {vacunasArray.fields.length === 0 && (
                <p className="micro">Sin vacunas registradas.</p>
              )}
            </div>
          </section>

          {/* 08 · Consentimiento */}
          <section className="form-sect">
            <Seccion n={8} titulo="Consentimiento / Autorización Médica" icono={<VerifiedUser />} />
            <div className="form-grid">
              <div className="field flex items-end">
                <label className="chk">
                  <input {...register('consentimiento')} type="checkbox" />
                  Autorización médica otorgada
                </label>
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-consent-fecha">Fecha de Autorización</label>
                <input id="fm-consent-fecha" {...register('consentimientoFecha')} type="date" className="inp" />
              </div>
              <div className="field">
                <label className="micro" htmlFor="fm-consent-obs">Observaciones</label>
                <input id="fm-consent-obs" {...register('consentimientoObservaciones')} className="inp" />
              </div>
            </div>
          </section>

          {/* 09 · Notas generales */}
          <section className="form-sect">
            <Seccion n={9} titulo="Notas y Resumen" icono={<Notes />} />
            <div className="field">
              <label className="micro" htmlFor="fm-obs">Observaciones Generales</label>
              <textarea
                id="fm-obs"
                {...register('observaciones')}
                rows={3}
                className="inp resize-none"
                placeholder="Antecedentes, alergias, notas relevantes…"
              />
            </div>
          </section>
        </DialogContent>

        <DialogActions className="px-6 py-5 !justify-between">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            <SaveAlt />
            {saving ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
