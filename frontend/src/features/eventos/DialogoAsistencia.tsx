import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { Checklist, PictureAsPdf, QrCode2, Save, Undo } from '@mui/icons-material';
import { eventosApi } from '../../api';
import { usePermission } from '../../hooks/usePermission';
import {
  EstadoAsistencia,
  ESTADOS_ASISTENCIA,
  FilaAsistencia,
  PlanillaAsistencia,
  metaTipoActividad,
} from '../../types/eventos';
import { getApiErrorMessage } from '../../utils/errors';
import { DialogoQrPresencia } from './DialogoQrPresencia';

interface DialogoAsistenciaProps {
  open: boolean;
  actividadId: string | null;
  /** `true` = puede marcar (asistencia:manage); `false` = solo lectura. */
  canManage: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-VE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * Planilla de asistencia: lista los jóvenes del ámbito de la actividad con
 * sus tres estados (Presente / Ausente / Justificado). El guardado es
 * masivo: solo envía las filas que cambiaron respecto a lo cargado.
 */
export const DialogoAsistencia = ({ open, actividadId, canManage, onClose, onSaved }: DialogoAsistenciaProps) => {
  const puedeDescargar = usePermission('asistencia:view');
  const [planilla, setPlanilla] = useState<PlanillaAsistencia | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marcas, setMarcas] = useState<Record<string, EstadoAsistencia>>({});
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [qrAbierto, setQrAbierto] = useState(false);
  const [limpiando, setLimpiando] = useState<string | null>(null);

  const cargar = async () => {
    if (!actividadId) return;
    setCargando(true);
    setError(null);
    try {
      const data: PlanillaAsistencia = await eventosApi.getPlanilla(actividadId);
      setPlanilla(data);
      const iniciales: Record<string, EstadoAsistencia> = {};
      for (const fila of data.registros) {
        if (fila.estado) iniciales[fila.miembroId] = fila.estado;
      }
      setMarcas(iniciales);
      setGuardado(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo cargar la planilla.'));
      setPlanilla(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPlanilla(null);
      setMarcas({});
      setError(null);
      setQrAbierto(false);
      void cargar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, actividadId]);

  const filas = useMemo(() => planilla?.registros ?? [], [planilla]);

  const cambiadas = useMemo(() => {
    const original = new Map(filas.map((f) => [f.miembroId, f.estado]));
    return filas.filter((f) => (original.get(f.miembroId) ?? null) !== (marcas[f.miembroId] ?? null));
  }, [filas, marcas]);

  const conteo = useMemo(() => {
    const cuenta: Record<EstadoAsistencia, number> = { PRESENTE: 0, AUSENTE: 0, JUSTIFICADO: 0 };
    for (const valor of Object.values(marcas)) cuenta[valor] += 1;
    return cuenta;
  }, [marcas]);

  const marcarTodos = (estado: EstadoAsistencia) => {
    const siguiente: Record<string, EstadoAsistencia> = {};
    for (const fila of filas) siguiente[fila.miembroId] = estado;
    setMarcas(siguiente);
  };

  const guardar = async () => {
    if (!actividadId || cambiadas.length === 0) return;
    setGuardando(true);
    setError(null);
    try {
      await eventosApi.guardarAsistencias(
        actividadId,
        cambiadas.map((f) => ({
          miembroId: f.miembroId,
          estado: marcas[f.miembroId],
        })),
      );
      setGuardado(true);
      await cargar();
      onSaved?.();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la asistencia.'));
    } finally {
      setGuardando(false);
    }
  };

  const marcarFila = (miembroId: string, estado: EstadoAsistencia) => {
    setGuardado(false);
    setMarcas((prev) => ({ ...prev, [miembroId]: estado }));
  };

  /** Deshace la marca guardada de una fila (soft-delete en el backend). */
  const limpiarFila = async (fila: FilaAsistencia) => {
    if (!fila.asistenciaId || limpiando) return;
    setLimpiando(fila.asistenciaId);
    setError(null);
    try {
      await eventosApi.deleteAsistencia(fila.asistenciaId);
      await cargar();
      onSaved?.();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo deshacer la marca.'));
    } finally {
      setLimpiando(null);
    }
  };

  const descargarPdf = async () => {
    if (!actividadId) return;
    setDescargandoPdf(true);
    setError(null);
    try {
      await eventosApi.listadoAsistenciaPdf(actividadId);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo generar el listado de asistencia.'));
    } finally {
      setDescargandoPdf(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up' }}
    >
      <DialogTitle className="px-8 pt-8 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Checklist fontSize="small" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-primary truncate">
              {planilla ? planilla.actividad.titulo : 'Planilla de asistencia'}
            </h3>
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.15em]">
              {planilla
                ? `${metaTipoActividad(planilla.actividad.tipo).label} · ${fechaCorta(planilla.actividad.fecha)}`
                : 'Cargando…'}
            </p>
          </div>
        </div>
      </DialogTitle>

      <DialogContent className="px-8 py-5 space-y-4">
        {cargando && (
          <div className="flex items-center justify-center py-12 gap-3 text-outline">
            <CircularProgress size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest">Cargando planilla…</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-bold animate-fade-in">
            {error}
          </div>
        )}

        {!cargando && planilla && (
          <>
            {/* Resumen + acciones masivas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2">
                {ESTADOS_ASISTENCIA.map((e) => (
                  <div key={e.valor} className={`px-3 py-2 rounded-xl border ${e.clase}`}>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{e.label}</p>
                    <p className="text-lg font-black leading-tight">{conteo[e.valor]}</p>
                  </div>
                ))}
                <div className="px-3 py-2 rounded-xl border bg-surface-container-high text-outline border-outline/10">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Sin marca</p>
                  <p className="text-lg font-black leading-tight">
                    {filas.length - Object.keys(marcas).length}
                  </p>
                </div>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQrAbierto(true)}
                    className="px-4 py-2.5 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <QrCode2 sx={{ fontSize: 14 }} />
                    QR de presencia
                  </button>
                  <button
                    type="button"
                    onClick={() => marcarTodos('PRESENTE')}
                    className="px-4 py-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                  >
                    Marcar todos presente
                  </button>
                </div>
              )}
            </div>

            {filas.length === 0 && (
              <p className="text-xs font-bold text-outline text-center py-8">
                No hay jóvenes activos en el ámbito de esta actividad.
              </p>
            )}

            {/* Filas de la planilla */}
            <div className="divide-y divide-outline/5 max-h-[45vh] overflow-y-auto rounded-xl border border-outline/10">
              {filas.map((fila) => (
                <FilaPlanilla
                  key={fila.miembroId}
                  fila={fila}
                  estado={marcas[fila.miembroId] ?? null}
                  canManage={canManage}
                  limpiando={limpiando === fila.asistenciaId}
                  onMarcar={(estado) => marcarFila(fila.miembroId, estado)}
                  onLimpiar={() => limpiarFila(fila)}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>

      <DialogActions className="p-8 gap-4 justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest text-outline">
          {cambiadas.length > 0 ? `${cambiadas.length} cambio(s) pendiente(s)` : guardado ? '✓ Guardado' : 'Sin cambios'}
        </div>
        <div className="flex gap-4">
          {puedeDescargar && planilla && (
            <button
              type="button"
              onClick={descargarPdf}
              disabled={descargandoPdf}
              className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {descargandoPdf ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <PictureAsPdf sx={{ fontSize: 14 }} />
              )}
              Planilla (.pdf)
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors"
          >
            Cerrar
          </button>
          {canManage && (
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || cambiadas.length === 0}
              className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {guardando ? <CircularProgress size={14} color="inherit" /> : <Save sx={{ fontSize: 14 }} />}
              Guardar asistencia
            </button>
          )}
        </div>
      </DialogActions>

      {/* QR anidado: se cierra junto con la planilla */}
      <DialogoQrPresencia
        open={qrAbierto && open}
        actividadId={actividadId}
        onClose={() => setQrAbierto(false)}
      />
    </Dialog>
  );
};

interface FilaPlanillaProps {
  fila: FilaAsistencia;
  estado: EstadoAsistencia | null;
  canManage: boolean;
  limpiando?: boolean;
  onMarcar: (estado: EstadoAsistencia) => void;
  onLimpiar?: () => void;
}

const FilaPlanilla = ({ fila, estado, canManage, limpiando, onMarcar, onLimpiar }: FilaPlanillaProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-white/40 transition-colors">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-primary truncate">
        {fila.apellidos}, {fila.nombres}
      </p>
      {fila.observacion && (
        <p className="text-[10px] text-outline italic truncate">{fila.observacion}</p>
      )}
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="flex gap-1.5">
        {ESTADOS_ASISTENCIA.map((e) => {
          const activo = estado === e.valor;
          return (
            <button
              key={e.valor}
              type="button"
              disabled={!canManage}
              onClick={() => onMarcar(e.valor)}
              aria-pressed={activo}
              aria-label={`${fila.nombres} ${fila.apellidos}: ${e.label}`}
              className={`min-w-[38px] px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed ${
                activo ? e.clase : 'bg-surface-container-high text-outline/60 border-outline/10 hover:border-outline/30'
              } ${!canManage && !activo ? 'opacity-50' : ''}`}
            >
              {e.short}
            </button>
          );
        })}
      </div>
      {canManage && fila.asistenciaId && onLimpiar && (
        <button
          type="button"
          disabled={limpiando}
          onClick={onLimpiar}
          aria-label={`Limpiar ${fila.nombres} ${fila.apellidos}`}
          title="Deshacer esta marca"
          className="min-w-[32px] px-2 py-1.5 rounded-lg border border-outline/10 bg-surface-container-high text-outline/60 hover:text-error hover:border-error/30 transition-all disabled:opacity-50 inline-flex items-center justify-center"
        >
          {limpiando ? <CircularProgress size={12} color="inherit" /> : <Undo sx={{ fontSize: 13 }} />}
        </button>
      )}
    </div>
  </div>
);
