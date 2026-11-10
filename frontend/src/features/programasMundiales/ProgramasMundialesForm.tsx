import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Close, DeleteOutline, DoneAll, ErrorOutline, Public, TravelExplore } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { programasMundialesApi } from '../../api';
import { getApiErrorMessage } from '../../utils/errors';
import {
  EstadoProgramaMundial,
  ProgramaMiembro,
  ProgramaMundial,
} from '../../types/programaMundial';
import { COLOR_ESTADO, ETIQUETA_ESTADO, formatoFecha } from './estado';

const enlaceSchema = z
  .object({
    programaMundialId: z.string().min(1, 'Selecciona un programa'),
    fechaInicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
    estado: z.enum(['PENDIENTE', 'EN_CURSO', 'COMPLETADO']),
    fechaCompletado: z.string().optional().or(z.literal('')),
  })
  .refine((valor) => valor.estado !== 'COMPLETADO' || !!valor.fechaCompletado, {
    path: ['fechaCompletado'],
    message: 'Indica la fecha de finalización',
  });

type EnlaceFormData = z.infer<typeof enlaceSchema>;

const hoy = () => new Date().toISOString().slice(0, 10);

interface ProgramasMundialesFormProps {
  open: boolean;
  miembroId: string;
  miembroNombre: string;
  enlaces: ProgramaMiembro[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export const ProgramasMundialesForm = ({
  open,
  miembroId,
  miembroNombre,
  enlaces,
  onClose,
  onSaved,
}: ProgramasMundialesFormProps) => {
  const [catalogo, setCatalogo] = useState<ProgramaMundial[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [accionId, setAccionId] = useState<string | null>(null);
  const peticionRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EnlaceFormData>({
    resolver: zodResolver(enlaceSchema),
    defaultValues: {
      programaMundialId: '',
      fechaInicio: hoy(),
      estado: 'EN_CURSO',
      fechaCompletado: '',
    },
  });

  const estado = watch('estado');

  useEffect(() => {
    if (!open) return;
    const peticion = ++peticionRef.current;
    setCargandoCatalogo(true);
    setError(null);
    programasMundialesApi
      .catalogo()
      .then((lista) => {
        if (peticion === peticionRef.current) setCatalogo(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (peticion === peticionRef.current) setCatalogo([]);
      })
      .finally(() => {
        if (peticion === peticionRef.current) setCargandoCatalogo(false);
      });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    reset({
      programaMundialId: '',
      fechaInicio: hoy(),
      estado: 'EN_CURSO',
      fechaCompletado: '',
    });
  }, [open, reset]);

  const yaEnlazados = new Set(enlaces.map((enlace) => enlace.programaMundialId));
  const disponibles = catalogo.filter((programa) => !yaEnlazados.has(programa.id));

  const onSubmit = async (data: EnlaceFormData) => {
    setGuardando(true);
    setError(null);
    try {
      await programasMundialesApi.crear({
        miembroId,
        programaMundialId: data.programaMundialId,
        fechaInicio: data.fechaInicio,
        estado: data.estado,
        fechaCompletado: data.fechaCompletado || null,
      });
      await onSaved();
      reset({
        programaMundialId: '',
        fechaInicio: hoy(),
        estado: 'EN_CURSO',
        fechaCompletado: '',
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo enlazar el programa mundial.'));
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarAccion = async (id: string, accion: () => Promise<unknown>) => {
    setAccionId(id);
    setError(null);
    try {
      await accion();
      await onSaved();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el programa mundial.'));
    } finally {
      setAccionId(null);
    }
  };

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
              <Public />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-primary tracking-tight leading-none">
                Programas Mundiales
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

          {/* 01 · Enlaces actuales */}
          <section className="form-sect">
            <header>
              <div className="ic" aria-hidden="true">
                <TravelExplore />
              </div>
              <div className="flex-1 min-w-0">
                <span className="micro">01 · Trayectoria mundial</span>
                <h3>Programas enlazados</h3>
              </div>
            </header>

            {enlaces.length === 0 ? (
              <p className="text-center py-4 micro block">Todavía no hay programas enlazados.</p>
            ) : (
              <div className="space-y-2">
                {enlaces.map((enlace) => {
                  const nombre = enlace.ProgramaMundial?.nombre ?? 'Programa mundial';
                  const ocupado = accionId === enlace.id;
                  return (
                    <div key={enlace.id} className="np-cargo">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-primary break-words">{nombre}</p>
                          <p className="text-[11.5px] text-on-surface-variant mt-1">
                            Inicio {formatoFecha(enlace.fechaInicio)}
                            {enlace.estado === 'COMPLETADO' &&
                              ` · Fin ${formatoFecha(enlace.fechaCompletado)}`}
                            {' · '}
                            <span
                              className="font-extrabold uppercase tracking-wide"
                              style={{ color: COLOR_ESTADO[enlace.estado] }}
                            >
                              {ETIQUETA_ESTADO[enlace.estado]}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-none">
                          {enlace.estado !== 'COMPLETADO' && (
                            <button
                              type="button"
                              className="act-btn"
                              aria-label={`Marcar completado ${nombre}`}
                              disabled={ocupado}
                              onClick={() =>
                                ejecutarAccion(enlace.id, () =>
                                  programasMundialesApi.actualizar(enlace.id, {
                                    estado: 'COMPLETADO' as EstadoProgramaMundial,
                                    fechaCompletado: hoy(),
                                  }),
                                )
                              }
                            >
                              <DoneAll />
                            </button>
                          )}
                          <button
                            type="button"
                            className="act-btn"
                            aria-label={`Quitar ${nombre}`}
                            disabled={ocupado}
                            onClick={() =>
                              ejecutarAccion(enlace.id, () =>
                                programasMundialesApi.eliminar(enlace.id),
                              )
                            }
                          >
                            <DeleteOutline />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 02 · Nuevo enlace */}
          <section className="form-sect">
            <header>
              <div className="ic" aria-hidden="true">
                <TravelExplore />
              </div>
              <div className="flex-1 min-w-0">
                <span className="micro">02 · Nuevo</span>
                <h3>Enlazar programa</h3>
              </div>
            </header>

            <div className="form-grid">
              <div className="field">
                <label className="micro" htmlFor="pm-programa">Programa</label>
                <select
                  id="pm-programa"
                  {...register('programaMundialId')}
                  className="inp"
                  disabled={cargandoCatalogo || disponibles.length === 0}
                >
                  <option value="">
                    {cargandoCatalogo ? 'Cargando programas…' : 'Selecciona un programa'}
                  </option>
                  {disponibles.map((programa) => (
                    <option key={programa.id} value={programa.id}>{programa.nombre}</option>
                  ))}
                </select>
                {errors.programaMundialId && (
                  <span className="field-err">{errors.programaMundialId.message}</span>
                )}
                {!cargandoCatalogo && catalogo.length > 0 && disponibles.length === 0 && (
                  <span className="field-err">El miembro ya tiene todos los programas disponibles.</span>
                )}
                {!cargandoCatalogo && catalogo.length === 0 && (
                  <span className="field-err">No hay programas activos en el catálogo.</span>
                )}
              </div>

              <div className="field">
                <label className="micro" htmlFor="pm-inicio">Fecha de inicio</label>
                <input id="pm-inicio" type="date" {...register('fechaInicio')} className="inp" />
                {errors.fechaInicio && (
                  <span className="field-err">{errors.fechaInicio.message}</span>
                )}
              </div>

              <div className="field">
                <label className="micro" htmlFor="pm-estado">Estado</label>
                <select id="pm-estado" {...register('estado')} className="inp">
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_CURSO">En curso</option>
                  <option value="COMPLETADO">Completado</option>
                </select>
              </div>

              {estado === 'COMPLETADO' && (
                <div className="field">
                  <label className="micro" htmlFor="pm-fin">Fecha de finalización</label>
                  <input id="pm-fin" type="date" {...register('fechaCompletado')} className="inp" />
                  {errors.fechaCompletado && (
                    <span className="field-err">{errors.fechaCompletado.message}</span>
                  )}
                </div>
              )}
            </div>
          </section>
        </DialogContent>

        <DialogActions className="px-6 py-5 !justify-between">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cerrar
          </button>
          <button
            type="submit"
            disabled={guardando || disponibles.length === 0}
            className="btn btn-primary"
          >
            <TravelExplore />
            {guardando ? 'Enlazando...' : 'Enlazar Programa'}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
