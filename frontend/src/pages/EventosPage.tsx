import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CalendarMonth,
  Shield,
  Search,
  Add,
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { eventosApi, unidadesApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import {
  Actividad,
  Planificacion,
  ESTADOS_PLANIFICACION,
  metaEstadoPlanificacion,
} from '../types/eventos';
import { getApiErrorMessage } from '../utils/errors';
import { ListaActividades } from '../features/eventos/ListaActividades';
import { FormActividad } from '../features/eventos/FormActividad';
import { DialogoAsistencia } from '../features/eventos/DialogoAsistencia';

const planificacionSchema = z
  .object({
    titulo: z.string().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
    descripcion: z.string().max(500, 'Máximo 500 caracteres'),
    fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
    fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
    estado: z.enum(['BORRADOR', 'APROBADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO']),
    unidadId: z.string(),
  })
  .refine((d) => new Date(d.fechaFin) >= new Date(d.fechaInicio), {
    message: 'La fecha de fin debe ser posterior o igual a la de inicio',
    path: ['fechaFin'],
  });

type PlanificacionFormData = z.infer<typeof planificacionSchema>;

interface UnidadOpcion {
  id: string;
  nombre: string;
}

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

export const EventosPage = () => {
  const canView = usePermission('evento:view');
  const canCreate = usePermission('evento:create');
  const canViewAsistencia = usePermission('asistencia:view');
  const canManageAsistencia = usePermission('asistencia:manage');

  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [unidades, setUnidades] = useState<UnidadOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionId, setSeleccionId] = useState<string | null>(null);

  const [dialogoPlan, setDialogoPlan] = useState(false);
  const [editandoPlan, setEditandoPlan] = useState<Planificacion | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const [dialogoActividad, setDialogoActividad] = useState(false);
  const [editandoActividad, setEditandoActividad] = useState<Actividad | null>(null);
  const [planificacionActiva, setPlanificacionActiva] = useState<string | null>(null);

  const [dialogoAsistencia, setDialogoAsistencia] = useState(false);
  const [actividadAsistencia, setActividadAsistencia] = useState<string | null>(null);
  const [reloadActividades, setReloadActividades] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanificacionFormData>({
    resolver: zodResolver(planificacionSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      estado: 'BORRADOR',
      unidadId: '',
    },
  });

  const cargarPlanificaciones = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data: Planificacion[] = await eventosApi.getPlanificaciones();
      setPlanificaciones(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar las planificaciones.'));
      setPlanificaciones([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (canView) void cargarPlanificaciones();
  }, [canView, cargarPlanificaciones]);

  // Unidades para el select de ámbito (opcional: sin unidad:view se queda en "Grupo").
  useEffect(() => {
    if (!canView) return;
    let vivo = true;
    unidadesApi
      .getAll()
      .then((data: UnidadOpcion[]) => {
        if (vivo && Array.isArray(data)) setUnidades(data);
      })
      .catch(() => {
        /* sin permiso o sin datos: el select queda solo con "Grupo" */
      });
    return () => {
      vivo = false;
    };
  }, [canView]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return planificaciones;
    return planificaciones.filter(
      (p) =>
        p.titulo.toLowerCase().includes(texto) ||
        (p.descripcion ?? '').toLowerCase().includes(texto),
    );
  }, [planificaciones, busqueda]);

  const abrirDialogoPlan = (plan?: Planificacion) => {
    if (plan) {
      setEditandoPlan(plan);
      reset({
        titulo: plan.titulo,
        descripcion: plan.descripcion ?? '',
        fechaInicio: plan.fechaInicio.slice(0, 10),
        fechaFin: plan.fechaFin.slice(0, 10),
        estado: plan.estado,
        unidadId: plan.unidadId ?? '',
      });
    } else {
      setEditandoPlan(null);
      reset({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        estado: 'BORRADOR',
        unidadId: '',
      });
    }
    setError(null);
    setDialogoPlan(true);
  };

  const onSubmitPlan = async (data: PlanificacionFormData) => {
    const payload = {
      titulo: data.titulo,
      descripcion: data.descripcion || undefined,
      fechaInicio: new Date(data.fechaInicio).toISOString(),
      fechaFin: new Date(data.fechaFin).toISOString(),
      estado: data.estado,
      unidadId: data.unidadId || undefined,
    };
    try {
      if (editandoPlan) {
        await eventosApi.updatePlanificacion(editandoPlan.id, payload);
      } else {
        await eventosApi.createPlanificacion(payload);
      }
      setDialogoPlan(false);
      setEditandoPlan(null);
      reset();
      await cargarPlanificaciones();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la planificación.'));
    }
  };

  const eliminarPlan = async (id: string) => {
    setEliminandoId(id);
    setError(null);
    try {
      await eventosApi.deletePlanificacion(id);
      if (seleccionId === id) setSeleccionId(null);
      await cargarPlanificaciones();
    } catch (err: unknown) {
      // 409: tiene actividades activas.
      setError(getApiErrorMessage(err, 'No se pudo eliminar la planificación.'));
    } finally {
      setEliminandoId(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-8 glass-panel border border-error/20 rounded-2xl flex flex-col items-center gap-4 text-center">
        <Shield className="text-error text-5xl opacity-20" fontSize="large" />
        <div>
          <h3 className="text-xl font-black text-error">Acceso Restringido</h3>
          <p className="text-sm font-medium text-outline">
            Se requiere el permiso evento:view para visualizar los eventos del grupo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-tertiary/10 rounded-2xl flex items-center justify-center text-primary">
            <CalendarMonth fontSize="medium" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-primary">Eventos y Asistencias</h2>
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
              {planificaciones.length} Planificación(es) · {filtradas.length} visible(s)
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={() => abrirDialogoPlan()}
            className="sentinel-gradient px-6 py-3 rounded-xl text-on-primary font-bold tracking-tight shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <Add fontSize="small" />
            <span>Nueva Planificación</span>
          </button>
        )}
      </header>

      {error && !dialogoPlan && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs uppercase tracking-widest px-2 hover:underline">
            Ignorar
          </button>
        </div>
      )}

      {/* Buscador */}
      <section className="bg-surface-container-low p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
            <Search fontSize="small" />
          </div>
          <input
            type="text"
            placeholder="Buscar planificación por título o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary transition-all font-medium"
          />
        </div>
      </section>

      {/* Estado de carga */}
      {cargando && (
        <div className="flex items-center justify-center py-12 gap-3 text-outline">
          <CircularProgress size={22} />
          <span className="text-[10px] font-black uppercase tracking-widest">Cargando planificaciones…</span>
        </div>
      )}

      {/* Empty state */}
      {!cargando && planificaciones.length === 0 && (
        <div className="p-8 text-center animate-fade-in-up">
          <CalendarMonth className="text-outline text-5xl opacity-20" fontSize="large" />
          <h3 className="text-xl font-black text-primary mt-4">Sin planificaciones</h3>
          <p className="text-base text-outline/60 mb-6">
            Organiza el año scout creando la primera planificación.
          </p>
          {canCreate && (
            <button
              onClick={() => abrirDialogoPlan()}
              className="sentinel-gradient px-6 py-3 rounded-xl text-on-primary font-bold tracking-tight shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            >
              <Add fontSize="small" /> Crear Primera Planificación
            </button>
          )}
        </div>
      )}

      {!cargando && planificaciones.length > 0 && filtradas.length === 0 && (
        <p className="text-xs font-bold text-outline text-center py-6">
          Ninguna planificación coincide con “{busqueda}”.
        </p>
      )}

      {/* Lista de planificaciones */}
      <div className="space-y-3">
        {filtradas.map((plan) => {
          const abierta = seleccionId === plan.id;
          const meta = metaEstadoPlanificacion(plan.estado);
          return (
            <section
              key={plan.id}
              className="bg-surface-container-low rounded-[1.5rem] border border-outline-variant/10 overflow-hidden"
            >
              <div className="flex items-stretch bg-surface-container-high hover:bg-primary/5 transition-colors">
                <button
                  onClick={() => setSeleccionId(abierta ? null : plan.id)}
                  aria-expanded={abierta}
                  className="flex-1 flex items-center justify-between gap-3 px-6 py-4 text-left min-w-0"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    {abierta ? (
                      <ExpandLess className="text-primary shrink-0" />
                    ) : (
                      <ExpandMore className="text-primary shrink-0" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-primary truncate">{plan.titulo}</span>
                      <span className="block text-[10px] font-bold text-outline uppercase tracking-widest">
                        {fechaCorta(plan.fechaInicio)} → {fechaCorta(plan.fechaFin)}
                        {plan.descripcion ? ` · ${plan.descripcion}` : ''}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${meta.clase}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      {plan._count?.Actividades ?? 0} act.
                    </span>
                  </span>
                </button>
                {canCreate && (
                  <div className="flex items-center gap-1 pr-4 shrink-0">
                    <button
                      type="button"
                      onClick={() => abrirDialogoPlan(plan)}
                      aria-label={`Editar ${plan.titulo}`}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all"
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void eliminarPlan(plan.id)}
                      disabled={eliminandoId === plan.id}
                      aria-label={`Eliminar ${plan.titulo}`}
                      className="p-2 rounded-lg hover:bg-error/10 text-error transition-all disabled:opacity-40"
                    >
                      {eliminandoId === plan.id ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <Delete fontSize="small" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {abierta && (
                <div className="px-6 py-5 border-t border-outline/10 bg-surface-container-lowest/50">
                  <ListaActividades
                    planificacionId={plan.id}
                    canManage={canCreate}
                    canViewAsistencia={canViewAsistencia}
                    canManageAsistencia={canManageAsistencia}
                    reloadKey={reloadActividades}
                    onOpenForm={(actividad) => {
                      setPlanificacionActiva(plan.id);
                      setEditandoActividad(actividad);
                      setDialogoActividad(true);
                    }}
                    onOpenAsistencia={(actividadId) => {
                      setActividadAsistencia(actividadId);
                      setDialogoAsistencia(true);
                    }}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Dialogo de planificación */}
      <Dialog
        open={dialogoPlan}
        onClose={() => {
          setDialogoPlan(false);
          setEditandoPlan(null);
          reset();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up' }}
      >
        <form onSubmit={handleSubmit(onSubmitPlan)}>
          <DialogTitle className="text-xl font-black text-primary px-8 pt-8">
            {editandoPlan ? 'Modificar Planificación' : 'Nueva Planificación'}
          </DialogTitle>
          <DialogContent className="px-8 space-y-4">
            <div className="space-y-2 mt-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Título</label>
              <input
                {...register('titulo')}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
                placeholder="Ej: Semana 1 de marzo"
              />
              {errors.titulo && <p className="text-[10px] text-error font-bold px-1">{errors.titulo.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  {...register('fechaInicio')}
                  className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
                />
                {errors.fechaInicio && (
                  <p className="text-[10px] text-error font-bold px-1">{errors.fechaInicio.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  {...register('fechaFin')}
                  className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
                />
                {errors.fechaFin && (
                  <p className="text-[10px] text-error font-bold px-1">{errors.fechaFin.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Estado</label>
                <select
                  {...register('estado')}
                  className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none"
                >
                  {ESTADOS_PLANIFICACION.map((e) => (
                    <option key={e.valor} value={e.valor}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">
                  Ámbito (unidad)
                </label>
                <select
                  {...register('unidadId')}
                  className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none"
                >
                  <option value="">Grupo (todas las unidades)</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">
                Descripción
              </label>
              <textarea
                {...register('descripcion')}
                rows={3}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary resize-none"
                placeholder="Detalles de la planificación (opcional)"
              />
              {errors.descripcion && (
                <p className="text-[10px] text-error font-bold px-1">{errors.descripcion.message}</p>
              )}
            </div>
          </DialogContent>
          <DialogActions className="p-8 gap-4">
            <button
              type="button"
              onClick={() => {
                setDialogoPlan(false);
                setEditandoPlan(null);
                reset();
              }}
              className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando…' : editandoPlan ? 'Confirmar Cambios' : 'Crear Planificación'}
            </button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialogo de actividad */}
      <FormActividad
        open={dialogoActividad}
        planificacionId={planificacionActiva}
        actividad={editandoActividad}
        onClose={() => {
          setDialogoActividad(false);
          setEditandoActividad(null);
        }}
        onSaved={() => {
          setReloadActividades((k) => k + 1);
          void cargarPlanificaciones();
        }}
      />

      {/* Dialogo de planilla de asistencia */}
      <DialogoAsistencia
        open={dialogoAsistencia}
        actividadId={actividadAsistencia}
        canManage={canManageAsistencia}
        onClose={() => {
          setDialogoAsistencia(false);
          setActividadAsistencia(null);
        }}
        onSaved={() => setReloadActividades((k) => k + 1)}
      />
    </div>
  );
};
