import { useCallback, useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { Add, Edit, Delete, Checklist, EventBusy, Place, Schedule } from '@mui/icons-material';
import { eventosApi } from '../../api';
import { Actividad, metaEstadoActividad, metaTipoActividad } from '../../types/eventos';
import { getApiErrorMessage } from '../../utils/errors';

interface ListaActividadesProps {
  planificacionId: string;
  /** evento:create — crear/editar/eliminar actividades. */
  canManage: boolean;
  /** asistencia:view — abrir la planilla. */
  canViewAsistencia: boolean;
  /** asistencia:manage — marcar dentro de la planilla. */
  canManageAsistencia: boolean;
  onOpenForm: (actividad: Actividad | null) => void;
  onOpenAsistencia: (actividadId: string) => void;
  /** Incrementar para forzar la recarga (p.ej. tras guardar en otro dialogo). */
  reloadKey?: number;
}

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

/** Actividades de una planificación, con acciones de edición y asistencia. */
export const ListaActividades = ({
  planificacionId,
  canManage,
  canViewAsistencia,
  canManageAsistencia,
  onOpenForm,
  onOpenAsistencia,
  reloadKey = 0,
}: ListaActividadesProps) => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data: Actividad[] = await eventosApi.getActividades({ planificacionId });
      setActividades(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar las actividades.'));
      setActividades([]);
    } finally {
      setCargando(false);
    }
  }, [planificacionId]);

  useEffect(() => {
    void cargar();
  }, [cargar, reloadKey]);

  const eliminar = async (actividad: Actividad) => {
    setEliminandoId(actividad.id);
    setError(null);
    try {
      await eventosApi.deleteActividad(actividad.id);
      await cargar();
    } catch (err: unknown) {
      // 409: tiene asistencias registradas — se muestra el motivo del backend.
      setError(getApiErrorMessage(err, 'No se pudo eliminar la actividad.'));
    } finally {
      setEliminandoId(null);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-10 gap-3 text-outline">
        <CircularProgress size={20} />
        <span className="text-[10px] font-black uppercase tracking-widest">Cargando actividades…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-outline px-1">
          Actividades · {actividades.length}
        </p>
        {canManage && (
          <button
            type="button"
            onClick={() => onOpenForm(null)}
            className="sentinel-gradient px-5 py-2.5 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 w-fit"
          >
            <Add fontSize="small" />
            Nueva Actividad
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs uppercase tracking-widest px-2 hover:underline">
            Ignorar
          </button>
        </div>
      )}

      {!error && actividades.length === 0 && (
        <div className="text-center py-10 space-y-2 bg-surface-container-low rounded-2xl">
          <EventBusy className="text-outline mx-auto !text-4xl opacity-30" />
          <p className="text-xs font-bold text-outline uppercase tracking-widest">
            Sin actividades en esta planificación
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => onOpenForm(null)}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
            >
              Crear la primera
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {actividades.map((actividad) => {
          const estado = metaEstadoActividad(actividad.estado);
          const tipo = metaTipoActividad(actividad.tipo);
          return (
            <section
              key={actividad.id}
              className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-4 sm:p-5 hover:bg-surface-container-high/60 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                      {tipo.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${estado.clase}`}>
                      {estado.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-primary truncate">{actividad.titulo}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-outline">
                    <span className="inline-flex items-center gap-1">
                      <Schedule sx={{ fontSize: 12 }} />
                      {fechaCorta(actividad.fecha)}
                      {actividad.horaInicio && ` · ${actividad.horaInicio}${actividad.horaFin ? `–${actividad.horaFin}` : ''}`}
                    </span>
                    {actividad.lugar && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Place sx={{ fontSize: 12 }} />
                        {actividad.lugar}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canViewAsistencia && (
                    <button
                      type="button"
                      onClick={() => onOpenAsistencia(actividad.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                    >
                      <Checklist sx={{ fontSize: 14 }} />
                      {canManageAsistencia ? 'Asistencia' : 'Ver asistencia'}
                    </button>
                  )}
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenForm(actividad)}
                        aria-label={`Editar ${actividad.titulo}`}
                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all"
                      >
                        <Edit fontSize="small" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void eliminar(actividad)}
                        disabled={eliminandoId === actividad.id}
                        aria-label={`Eliminar ${actividad.titulo}`}
                        className="p-2 rounded-lg hover:bg-error/10 text-error transition-all disabled:opacity-40"
                      >
                        {eliminandoId === actividad.id ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <Delete fontSize="small" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
