import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import {
  Close,
  ErrorOutline,
  HistoryEdu,
  SaveAlt,
  BadgeOutlined,
  Groups,
  Notes,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { datosScoutApi, unidadesApi } from '../../api';
import { getApiErrorMessage } from '../../utils/errors';
import { DatosScout, PatrullaRef } from '../../types/datosScout';

const fechaOpcional = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((valor) => !valor || !Number.isNaN(new Date(valor).getTime()), {
    message: 'Fecha inválida',
  });

const datosScoutSchema = z.object({
  fechaRegistro: fechaOpcional,
  fechaIngreso: fechaOpcional,
  fechaPromesa: fechaOpcional,
  cargoActual: z
    .string()
    .max(80, 'Máximo 80 caracteres')
    .optional()
    .or(z.literal('')),
  patrullaId: z.string().optional().or(z.literal('')),
  observaciones: z
    .string()
    .max(1000, 'Máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
});

type DatosScoutFormData = z.infer<typeof datosScoutSchema>;

/** Fecha ISO → valor de `<input type="date">` (sin desplazamiento de zona). */
const aInputFecha = (valor?: string | null) => (valor ? valor.slice(0, 10) : '');

interface DatosScoutFormProps {
  open: boolean;
  miembroId: string;
  miembroNombre: string;
  unidadId?: string;
  datos: DatosScout | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export const DatosScoutForm = ({
  open,
  miembroId,
  miembroNombre,
  unidadId,
  datos,
  onClose,
  onSaved,
}: DatosScoutFormProps) => {
  const [patrullas, setPatrullas] = useState<PatrullaRef[]>([]);
  const [cargandoPatrullas, setCargandoPatrullas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DatosScoutFormData>({
    resolver: zodResolver(datosScoutSchema),
    defaultValues: {
      fechaRegistro: '',
      fechaIngreso: '',
      fechaPromesa: '',
      cargoActual: '',
      patrullaId: '',
      observaciones: '',
    },
  });

  // Patrullas de la unidad del miembro: la API rechaza patrullas de otra unidad.
  useEffect(() => {
    if (!open || !unidadId) return;
    let vigente = true;
    setCargandoPatrullas(true);
    unidadesApi
      .getPatrullas(unidadId)
      .then((lista: PatrullaRef[]) => {
        if (vigente) setPatrullas(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        // Sin catálogo de patrullas el resto del expediente sigue siendo editable.
        if (vigente) setPatrullas([]);
      })
      .finally(() => {
        if (vigente) setCargandoPatrullas(false);
      });
    return () => {
      vigente = false;
    };
  }, [open, unidadId]);

  // Rellena el formulario cada vez que se abre con datos frescos.
  useEffect(() => {
    if (!open) return;
    setError(null);
    reset({
      fechaRegistro: aInputFecha(datos?.fechaRegistro),
      fechaIngreso: aInputFecha(datos?.fechaIngreso),
      fechaPromesa: aInputFecha(datos?.fechaPromesa),
      cargoActual: datos?.cargoActual ?? '',
      patrullaId: datos?.patrullaId ?? '',
      observaciones: datos?.observaciones ?? '',
    });
  }, [open, datos, reset]);

  const onSubmit = async (data: DatosScoutFormData) => {
    setSaving(true);
    setError(null);
    try {
      await datosScoutApi.actualizar(miembroId, {
        fechaRegistro: data.fechaRegistro || null,
        fechaIngreso: data.fechaIngreso || null,
        fechaPromesa: data.fechaPromesa || null,
        cargoActual: data.cargoActual?.trim() || null,
        patrullaId: data.patrullaId || null,
        observaciones: data.observaciones?.trim() || null,
      });
      await onSaved();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el expediente scout.'));
    } finally {
      setSaving(false);
    }
  };

  // Si el catálogo no cargó (o la patrulla actual ya no está activa), se
  // conserva la asignación vigente como opción para no borrarla al guardar.
  const opcionesPatrulla = (() => {
    if (!datos?.patrullaId) return patrullas;
    if (patrullas.some((p) => p.id === datos.patrullaId)) return patrullas;
    return [
      {
        id: datos.patrullaId,
        nombre: datos.Patrulla?.nombre ?? 'Patrulla actual',
        color: datos.Patrulla?.color ?? null,
      },
      ...patrullas,
    ];
  })();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-low shadow-2xl max-h-[90vh]' }}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-surface-container grid place-items-center text-primary flex-none">
              <HistoryEdu />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-primary tracking-tight leading-none">
                {datos?.id ? 'Editar Datos Scout' : 'Nuevo Expediente Scout'}
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

          {/* 01 · Fechas de trayectoria */}
          <section className="form-sect">
            <header>
              <div className="ic" aria-hidden="true">
                <HistoryEdu />
              </div>
              <div className="flex-1 min-w-0">
                <span className="micro">01 · Trayectoria</span>
                <h3>Fechas Scout</h3>
              </div>
            </header>
            <div className="form-grid">
              <div className="field">
                <label className="micro" htmlFor="ds-registro">Fecha de registro</label>
                <input id="ds-registro" type="date" {...register('fechaRegistro')} className="inp" />
                {errors.fechaRegistro && (
                  <span className="field-err">{errors.fechaRegistro.message}</span>
                )}
              </div>
              <div className="field">
                <label className="micro" htmlFor="ds-ingreso">Fecha de ingreso</label>
                <input id="ds-ingreso" type="date" {...register('fechaIngreso')} className="inp" />
                {errors.fechaIngreso && (
                  <span className="field-err">{errors.fechaIngreso.message}</span>
                )}
              </div>
              <div className="field">
                <label className="micro" htmlFor="ds-promesa">Fecha de promesa</label>
                <input id="ds-promesa" type="date" {...register('fechaPromesa')} className="inp" />
                {errors.fechaPromesa && (
                  <span className="field-err">{errors.fechaPromesa.message}</span>
                )}
              </div>
            </div>
          </section>

          {/* 02 · Patrulla y cargo */}
          <section className="form-sect">
            <header>
              <div className="ic" aria-hidden="true">
                <Groups />
              </div>
              <div className="flex-1 min-w-0">
                <span className="micro">02 · Unidad</span>
                <h3>Patrulla y Cargo</h3>
              </div>
            </header>
            <div className="form-grid">
              <div className="field">
                <label className="micro" htmlFor="ds-patrulla">Patrulla</label>
                <select
                  id="ds-patrulla"
                  {...register('patrullaId')}
                  className="inp"
                  disabled={cargandoPatrullas}
                >
                  <option value="">
                    {cargandoPatrullas ? 'Cargando patrullas…' : 'Sin asignar'}
                  </option>
                  {opcionesPatrulla.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                {!cargandoPatrullas && opcionesPatrulla.length === 0 && (
                  <span className="field-err">
                    La unidad no tiene patrullas registradas.
                  </span>
                )}
              </div>
              <div className="field">
                <label className="micro" htmlFor="ds-cargo">
                  <BadgeOutlined sx={{ fontSize: 12 }} /> Cargo actual
                </label>
                <input
                  id="ds-cargo"
                  {...register('cargoActual')}
                  className="inp"
                  placeholder="Guía de patrulla, Subguía, …"
                  aria-invalid={!!errors.cargoActual}
                />
                {errors.cargoActual && (
                  <span className="field-err">{errors.cargoActual.message}</span>
                )}
              </div>
            </div>
          </section>

          {/* 03 · Observaciones */}
          <section className="form-sect">
            <header>
              <div className="ic" aria-hidden="true">
                <Notes />
              </div>
              <div className="flex-1 min-w-0">
                <span className="micro">03 · Notas</span>
                <h3>Observaciones</h3>
              </div>
            </header>
            <div className="field">
              <label className="micro" htmlFor="ds-obs">Observaciones del expediente</label>
              <textarea
                id="ds-obs"
                {...register('observaciones')}
                rows={3}
                className="inp resize-none"
                placeholder="Traspasos, distinciones, notas relevantes…"
              />
              {errors.observaciones && (
                <span className="field-err">{errors.observaciones.message}</span>
              )}
            </div>
          </section>
        </DialogContent>

        <DialogActions className="px-6 py-5 !justify-between">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            <SaveAlt />
            {saving ? 'Guardando...' : 'Guardar Expediente'}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
