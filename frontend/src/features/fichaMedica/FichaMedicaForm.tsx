import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Close,
  Add,
  DeleteOutline,
  MedicalInformation,
  SaveAlt,
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

const inputClasses =
  'w-full p-3 bg-surface-container-high border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary transition-all h-[44px]';
const labelClasses = 'text-[9px] font-black uppercase tracking-widest px-1 text-outline';

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl max-h-[90vh]' }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle className="flex items-center justify-between px-8 pt-8 pb-4 sticky top-0 bg-surface-container-lowest z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <MedicalInformation />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary uppercase tracking-tight leading-none">
                {ficha?.id ? 'Editar Ficha Médica' : 'Nueva Ficha Médica'}
              </h2>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">
                {miembroNombre}
              </p>
            </div>
          </div>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers className="px-8 py-6 space-y-8 overflow-y-auto">
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          {/* Datos generales */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-5">Datos Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className={labelClasses}>Tipo de Sangre</label>
                <Controller
                  name="tipoSangre"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className={`${inputClasses} appearance-none`}>
                      <option value="">Seleccionar...</option>
                      {TIPO_SANGRE_OPCIONES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Teléfono</label>
                <input {...register('telefono')} className={inputClasses} placeholder="0412-0000000" />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Email</label>
                <input {...register('email')} type="email" className={inputClasses} placeholder="correo@ejemplo.com" />
                {errors.email && <p className="text-[10px] text-error font-bold px-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Médico Tratante</label>
                <input {...register('medicoTratante')} className={inputClasses} />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Teléfono del Médico</label>
                <input {...register('telefonoMedico')} className={inputClasses} />
              </div>
            </div>
          </section>

          {/* Seguro */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-5">Seguro Médico</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className={labelClasses}>Compañía</label>
                <input {...register('seguroCompania')} className={inputClasses} />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>N° Póliza</label>
                <input {...register('seguroPoliza')} className={inputClasses} />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Vigencia</label>
                <input {...register('seguroVigencia')} type="date" className={inputClasses} />
              </div>
            </div>
          </section>

          {/* Contacto de emergencia */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-5">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className={labelClasses}>Nombre</label>
                <input {...register('contactoEmergenciaNombre')} className={inputClasses} />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Teléfono</label>
                <input {...register('contactoEmergenciaTelefono')} className={inputClasses} />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Parentesco</label>
                <input {...register('contactoEmergenciaParentesco')} className={inputClasses} />
              </div>
            </div>
          </section>

          {/* Alergias */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Alergias</h3>
              <button
                type="button"
                onClick={() => alergiasArray.append({ nombre: '', severidad: 'LEVE', reaccion: '', observaciones: '' })}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-colors"
              >
                <Add fontSize="small" /> Añadir
              </button>
            </div>
            <div className="space-y-3">
              {alergiasArray.fields.map((field, index) => (
                <div key={field.id} className="bg-white/30 p-4 rounded-2xl space-y-3 border border-outline-variant/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className={labelClasses}>Nombre</label>
                      <input {...register(`alergiasDetalle.${index}.nombre`)} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Severidad</label>
                      <select {...register(`alergiasDetalle.${index}.severidad`)} className={`${inputClasses} appearance-none`}>
                        {SEVERIDAD_OPCIONES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Reacción</label>
                      <input {...register(`alergiasDetalle.${index}.reaccion`)} className={inputClasses} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <label className={labelClasses}>Observaciones</label>
                      <input {...register(`alergiasDetalle.${index}.observaciones`)} className={inputClasses} />
                    </div>
                    <IconButton
                      size="small"
                      onClick={() => markDelete('alergias', alergiasArray, index)}
                      className="!text-error"
                      title="Eliminar alergia"
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              ))}
              {alergiasArray.fields.length === 0 && (
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Sin alergias registradas.</p>
              )}
            </div>
          </section>

          {/* Medicamentos recetados */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Medicamentos Recetados</h3>
              <button
                type="button"
                onClick={() => medicamentosArray.append({ nombre: '', dosis: '', frecuencia: '', motivo: '', prescritoPor: '' })}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-colors"
              >
                <Add fontSize="small" /> Añadir
              </button>
            </div>
            <div className="space-y-3">
              {medicamentosArray.fields.map((field, index) => (
                <div key={field.id} className="bg-white/30 p-4 rounded-2xl space-y-3 border border-outline-variant/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className={labelClasses}>Nombre</label>
                      <input {...register(`medicamentosDetalle.${index}.nombre`)} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Dosis</label>
                      <input {...register(`medicamentosDetalle.${index}.dosis`)} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Frecuencia</label>
                      <input {...register(`medicamentosDetalle.${index}.frecuencia`)} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Motivo</label>
                      <input {...register(`medicamentosDetalle.${index}.motivo`)} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Prescrito Por</label>
                      <input {...register(`medicamentosDetalle.${index}.prescritoPor`)} className={inputClasses} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <IconButton size="small" onClick={() => markDelete('medicamentos', medicamentosArray, index)} className="!text-error" title="Eliminar">
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              ))}
              {medicamentosArray.fields.length === 0 && (
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Sin medicamentos recetados.</p>
              )}
            </div>
          </section>

          {/* Condiciones */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Condiciones Médicas</h3>
              <button
                type="button"
                onClick={() => condicionesArray.append({ nombre: '', descripcion: '', fechaDiagnostico: '', requiereControl: false })}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-colors"
              >
                <Add fontSize="small" /> Añadir
              </button>
            </div>
            <div className="space-y-3">
              {condicionesArray.fields.map((field, index) => (
                <div key={field.id} className="bg-white/30 p-4 rounded-2xl space-y-3 border border-outline-variant/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className={labelClasses}>Nombre *</label>
                      <input {...register(`condicionesDetalle.${index}.nombre`)} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Descripción</label>
                      <input {...register(`condicionesDetalle.${index}.descripcion`)} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Fecha Diagnóstico</label>
                      <input {...register(`condicionesDetalle.${index}.fechaDiagnostico`)} type="date" className={inputClasses} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-primary cursor-pointer">
                      <input {...register(`condicionesDetalle.${index}.requiereControl`)} type="checkbox" className="w-4 h-4 accent-emerald-600" />
                      Requiere control médico
                    </label>
                    <IconButton size="small" onClick={() => markDelete('condiciones', condicionesArray, index)} className="!text-error" title="Eliminar">
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              ))}
              {condicionesArray.fields.length === 0 && (
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Sin condiciones registradas.</p>
              )}
            </div>
          </section>

          {/* Vacunas */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Vacunas</h3>
              <button
                type="button"
                onClick={() => vacunasArray.append({ nombre: '', fechaAplicacion: '', lote: '', observaciones: '' })}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-colors"
              >
                <Add fontSize="small" /> Añadir
              </button>
            </div>
            <div className="space-y-3">
              {vacunasArray.fields.map((field, index) => (
                <div key={field.id} className="bg-white/30 p-4 rounded-2xl space-y-3 border border-outline-variant/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className={labelClasses}>Nombre *</label>
                      <input {...register(`vacunasDetalle.${index}.nombre`)} className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Fecha Aplicación</label>
                      <input {...register(`vacunasDetalle.${index}.fechaAplicacion`)} type="date" className={inputClasses} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>Lote</label>
                      <input {...register(`vacunasDetalle.${index}.lote`)} className={inputClasses} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <label className={labelClasses}>Observaciones</label>
                      <input {...register(`vacunasDetalle.${index}.observaciones`)} className={inputClasses} />
                    </div>
                    <IconButton size="small" onClick={() => markDelete('vacunas', vacunasArray, index)} className="!text-error" title="Eliminar">
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              ))}
              {vacunasArray.fields.length === 0 && (
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Sin vacunas registradas.</p>
              )}
            </div>
          </section>

          {/* Consentimiento */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-5">Consentimiento / Autorización Médica</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <label className="flex items-center gap-2 text-sm font-bold text-primary cursor-pointer pt-2">
                <input {...register('consentimiento')} type="checkbox" className="w-5 h-5 accent-emerald-600" />
                Autorización médica otorgada
              </label>
              <div className="space-y-1">
                <label className={labelClasses}>Fecha de Autorización</label>
                <input {...register('consentimientoFecha')} type="date" className={inputClasses} />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Observaciones</label>
                <input {...register('consentimientoObservaciones')} className={inputClasses} />
              </div>
            </div>
          </section>

          {/* Notas generales */}
          <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-5">Notas y Resumen</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className={labelClasses}>Observaciones Generales</label>
                <textarea {...register('observaciones')} rows={3} className="w-full p-3 bg-surface-container-high border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary resize-none" />
              </div>
            </div>
          </section>
        </DialogContent>

        <DialogActions className="px-8 py-5 !justify-between sticky bottom-0 bg-surface-container-lowest">
          <button type="button" onClick={onClose} className="px-6 py-2.5 bg-surface-container-high text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container-highest transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
            <SaveAlt sx={{ fontSize: 16 }} />
            {saving ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
