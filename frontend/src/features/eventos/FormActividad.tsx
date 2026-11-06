import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { eventosApi } from '../../api';
import { Actividad, TIPOS_ACTIVIDAD, ESTADOS_ACTIVIDAD } from '../../types/eventos';
import { getApiErrorMessage } from '../../utils/errors';

const actividadSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipo: z.enum([
    'REUNION',
    'CAMPAMENTO',
    'EXCURSION',
    'SERVICIO_COMUNITARIO',
    'TALLER',
    'CEREMONIA',
    'COMPETENCIA',
    'OTRO',
  ]),
  estado: z.enum(['PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA']),
  horaInicio: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM')
    .or(z.literal('')),
  horaFin: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM')
    .or(z.literal('')),
  lugar: z.string().max(120, 'Máximo 120 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres'),
});

type ActividadFormData = z.infer<typeof actividadSchema>;

interface FormActividadProps {
  open: boolean;
  planificacionId: string | null;
  /** Actividad a editar; `null` = creación. */
  actividad: Actividad | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Dialogo de creación/edición de actividad dentro de una planificación.
 * El `planificacionId` lo manda el endpoint anidado (POST) o el propio
 * registro (PATCH), nunca el formulario.
 */
export const FormActividad = ({ open, planificacionId, actividad, onClose, onSaved }: FormActividadProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActividadFormData>({
    resolver: zodResolver(actividadSchema),
    defaultValues: {
      titulo: '',
      fecha: '',
      tipo: 'REUNION',
      estado: 'PENDIENTE',
      horaInicio: '',
      horaFin: '',
      lugar: '',
      descripcion: '',
    },
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (actividad) {
      reset({
        titulo: actividad.titulo,
        fecha: actividad.fecha.slice(0, 10),
        tipo: actividad.tipo,
        estado: actividad.estado,
        horaInicio: actividad.horaInicio ?? '',
        horaFin: actividad.horaFin ?? '',
        lugar: actividad.lugar ?? '',
        descripcion: actividad.descripcion ?? '',
      });
    } else {
      reset({
        titulo: '',
        fecha: '',
        tipo: 'REUNION',
        estado: 'PENDIENTE',
        horaInicio: '',
        horaFin: '',
        lugar: '',
        descripcion: '',
      });
    }
  }, [open, actividad, reset]);

  const onSubmit = async (data: ActividadFormData) => {
    const payload = {
      titulo: data.titulo,
      fecha: new Date(data.fecha).toISOString(),
      tipo: data.tipo,
      estado: data.estado,
      horaInicio: data.horaInicio || undefined,
      horaFin: data.horaFin || undefined,
      lugar: data.lugar || undefined,
      descripcion: data.descripcion || undefined,
    };
    try {
      if (actividad) {
        await eventosApi.updateActividad(actividad.id, payload);
      } else if (planificacionId) {
        await eventosApi.createActividad(planificacionId, payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      // Se queda abierto para que el usuario vea el motivo (p.ej. 409 en uso).
      setError(getApiErrorMessage(err, 'No se pudo guardar la actividad.'));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up' }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle className="text-xl font-black text-primary px-8 pt-8">
          {actividad ? 'Modificar Actividad' : 'Nueva Actividad'}
        </DialogTitle>
        <DialogContent className="px-8 space-y-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-bold animate-fade-in">
              {error}
            </div>
          )}
          <div className="space-y-2 mt-2">
            <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Título</label>
            <input
              {...register('titulo')}
              className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
              placeholder="Ej: Reunión semanal"
            />
            {errors.titulo && <p className="text-[10px] text-error font-bold px-1">{errors.titulo.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Fecha</label>
              <input
                type="date"
                {...register('fecha')}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
              />
              {errors.fecha && <p className="text-[10px] text-error font-bold px-1">{errors.fecha.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Tipo</label>
              <select
                {...register('tipo')}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none"
              >
                {TIPOS_ACTIVIDAD.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.tipo && <p className="text-[10px] text-error font-bold px-1">{errors.tipo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Inicio</label>
              <input
                {...register('horaInicio')}
                placeholder="16:00"
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
              />
              {errors.horaInicio && (
                <p className="text-[10px] text-error font-bold px-1">{errors.horaInicio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Fin</label>
              <input
                {...register('horaFin')}
                placeholder="18:00"
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
              />
              {errors.horaFin && <p className="text-[10px] text-error font-bold px-1">{errors.horaFin.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Estado</label>
              <select
                {...register('estado')}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none"
              >
                {ESTADOS_ACTIVIDAD.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Lugar</label>
            <input
              {...register('lugar')}
              className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
              placeholder="Ej: Casa scout"
            />
            {errors.lugar && <p className="text-[10px] text-error font-bold px-1">{errors.lugar.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Descripción</label>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary resize-none"
              placeholder="Detalles de la actividad (opcional)"
            />
            {errors.descripcion && (
              <p className="text-[10px] text-error font-bold px-1">{errors.descripcion.message}</p>
            )}
          </div>
        </DialogContent>
        <DialogActions className="p-8 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando…' : actividad ? 'Confirmar Cambios' : 'Crear Actividad'}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
