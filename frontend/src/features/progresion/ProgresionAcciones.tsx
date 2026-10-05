import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddTask,
  AppRegistration,
  Block,
  Download,
  HowToReg,
  TrendingUp,
} from '@mui/icons-material';
import { catalogoApi, progresionApi, unidadesApi } from '../../api';
import { usePermission } from '../../hooks/usePermission';
import { AdelantoCatalogo, ResumenProgresion, ResultadoSolicitud } from '../../types/progresion';
import { UnidadEntity } from '../../types/member';
import { getApiErrorMessage } from '../../utils/errors';

interface ProgresionAccionesProps {
  miembroId: string;
  resumen: ResumenProgresion | null;
  onChanged: () => void;
}

interface Snack {
  severidad: 'success' | 'error' | 'info';
  texto: string;
}

export const ProgresionAcciones = ({ miembroId, resumen, onChanged }: ProgresionAccionesProps) => {
  const puedeVer = usePermission('progresion:view');
  const puedeCrear = usePermission('progresion:create');
  const puedeActualizar = usePermission('progresion:update');
  const puedeAprobar = usePermission('progresion:aprobar');

  const [snack, setSnack] = useState<Snack | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogoIniciar, setDialogoIniciar] = useState(false);
  const [adelantos, setAdelantos] = useState<AdelantoCatalogo[] | null>(null);
  const [catalogoError, setCatalogoError] = useState<string | null>(null);
  const [dialogoSolicitar, setDialogoSolicitar] = useState(false);
  const [resultadoSolicitud, setResultadoSolicitud] = useState<ResultadoSolicitud | null>(null);
  const [dialogoAprobar, setDialogoAprobar] = useState(false);
  const [dialogoRechazar, setDialogoRechazar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [exportando, setExportando] = useState(false);

  const adelanto = resumen?.adelantoActual ?? null;
  const pendiente = resumen?.historialProgresiones.find((p) => p.estado === 'SOLICITADA') ?? null;
  const iniciados = new Set<string>([
    ...(adelanto ? [adelanto.adelantoId] : []),
    ...(resumen?.historialProgresiones ?? []).map((p) => p.adelantoId),
  ]);
  const puedeIniciar = puedeCrear && !!resumen && !adelanto && !pendiente;
  const puedeAccionarAprobacion = puedeAprobar && !!resumen?.puedeAprobar && !!pendiente;

  const notificar = (severidad: Snack['severidad'], texto: string) => setSnack({ severidad, texto });

  const ejecutar = async (accion: () => Promise<void>) => {
    setCargando(true);
    setError(null);
    try {
      await accion();
      onChanged();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'La operación falló. Intentá de nuevo.'));
    } finally {
      setCargando(false);
    }
  };

  const abrirIniciar = async () => {
    setDialogoIniciar(true);
    setAdelantos(null);
    setCatalogoError(null);
    try {
      const unidades = (await unidadesApi.getAll()) as UnidadEntity[];
      const unidad = unidades.find(
        (u) => u.nombre?.toLowerCase() === resumen?.joven.unidad.toLowerCase(),
      );
      if (!unidad?.id) throw new Error('No se pudo resolver la unidad del joven.');
      const lista = (await catalogoApi.getAdelantos(unidad.id)) as AdelantoCatalogo[];
      setAdelantos(lista.filter((a) => a.activo).sort((a, b) => a.orden - b.orden));
    } catch (err: unknown) {
      setCatalogoError(
        getApiErrorMessage(err, 'No se pudo cargar el catálogo de adelantos de la unidad.'),
      );
    }
  };

  const iniciar = (adelantoId: string) =>
    ejecutar(async () => {
      await progresionApi.iniciar(miembroId, adelantoId);
      setDialogoIniciar(false);
      notificar('success', 'Adelanto iniciado correctamente.');
    });

  const solicitar = async () => {
    if (!adelanto) return;
    setCargando(true);
    setError(null);
    try {
      const resultado = await progresionApi.solicitar(adelanto.id);
      if (resultado.apto) {
        setDialogoSolicitar(false);
        setResultadoSolicitud(null);
        notificar('success', 'Ascenso solicitado. Esperá la aprobación del adulto responsable.');
        onChanged();
      } else {
        setResultadoSolicitud(resultado);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo solicitar el ascenso.'));
    } finally {
      setCargando(false);
    }
  };

  const aprobar = () => {
    if (!pendiente) return;
    ejecutar(async () => {
      const resultado = await progresionApi.aprobar(pendiente.id);
      setDialogoAprobar(false);
      notificar(
        'success',
        resultado.siguiente
          ? `Ascenso aprobado. Nuevo adelanto en curso: ${resultado.siguiente.Adelanto?.nombre ?? 'siguiente adelanto'}.`
          : 'Ascenso aprobado. Es el último adelanto de la unidad.',
      );
    });
  };

  const rechazar = () => {
    if (!pendiente) return;
    ejecutar(async () => {
      await progresionApi.rechazar(pendiente.id, motivo.trim() || undefined);
      setDialogoRechazar(false);
      setMotivo('');
      notificar('success', 'Solicitud rechazada.');
    });
  };

  const exportar = async () => {
    setExportando(true);
    try {
      const nombre = await progresionApi.exportJoven(miembroId);
      notificar('success', `Descargado: ${nombre}`);
    } catch (err: unknown) {
      notificar(
        'error',
        getApiErrorMessage(err, 'No se pudo generar el Cuadro de Adelanto del joven.'),
      );
    } finally {
      setExportando(false);
    }
  };

  return (
    <Box className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <TrendingUp fontSize="small" /> Acciones de Progresión
        </Typography>
        {puedeVer && (
          <button
            onClick={exportar}
            disabled={exportando}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {exportando ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Download sx={{ fontSize: 15 }} />
            )}
            Cuadro de Adelanto (.xlsx)
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {puedeIniciar && (
          <button
            onClick={abrirIniciar}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <AddTask sx={{ fontSize: 16 }} /> Iniciar adelanto
          </button>
        )}

        {puedeActualizar && adelanto && !pendiente && (
          <button
            onClick={() => {
              setResultadoSolicitud(null);
              setDialogoSolicitar(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <AppRegistration sx={{ fontSize: 16 }} /> Solicitar ascenso
          </button>
        )}

        {puedeAccionarAprobacion && (
          <>
            <button
              onClick={() => setDialogoAprobar(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              <HowToReg sx={{ fontSize: 16 }} /> Aprobar ascenso
            </button>
            <button
              onClick={() => setDialogoRechazar(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-error text-on-error rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Block sx={{ fontSize: 16 }} /> Rechazar
            </button>
          </>
        )}

        {!puedeIniciar && !adelanto && !pendiente && (
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest self-center">
            Sin adelantos disponibles para iniciar
          </p>
        )}
      </div>

      {error && (
        <div className="bg-error/5 border border-error/20 p-4 rounded-2xl">
          <p className="text-xs font-bold text-error">{error}</p>
        </div>
      )}

      {/* Iniciar adelanto */}
      <Dialog
        open={dialogoIniciar}
        onClose={() => !cargando && setDialogoIniciar(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '1.5rem' } }}
      >
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-primary">
          Iniciar adelanto
        </DialogTitle>
        <DialogContent dividers>
          {catalogoError ? (
            <div className="py-4 text-center space-y-3">
              <p className="text-xs font-bold text-error">{catalogoError}</p>
              <Button onClick={abrirIniciar} size="small">
                Reintentar
              </Button>
            </div>
          ) : !adelantos ? (
            <div className="flex justify-center py-8">
              <CircularProgress size={28} />
            </div>
          ) : adelantos.length === 0 ? (
            <p className="text-xs font-bold text-outline py-4">
              La unidad no tiene adelantos definidos.
            </p>
          ) : (
            <div className="space-y-3">
              {adelantos.map((a) => {
                const yaIniciado = iniciados.has(a.id);
                return (
                  <button
                    key={a.id}
                    disabled={yaIniciado || cargando}
                    onClick={() => iniciar(a.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      yaIniciado
                        ? 'bg-surface-container-low border-outline/10 opacity-60 cursor-not-allowed'
                        : 'bg-white/60 border-primary/20 hover:border-primary/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-primary">
                          {a.orden}° {a.nombre}
                        </p>
                        <p className="text-[9px] font-bold text-outline uppercase tracking-widest">
                          {a.umbralPorcentaje === null
                            ? 'Prueba aislada'
                            : `Umbral ${a.umbralPorcentaje}%`}
                          {a.edadMinima != null ? ` · desde ${a.edadMinima} años` : ''}
                        </p>
                      </div>
                      {yaIniciado ? (
                        <Chip
                          label="Ya iniciado"
                          className="!bg-surface-container-high !text-outline !font-black !text-[9px] !uppercase"
                        />
                      ) : (
                        <Chip
                          label="Disponible"
                          className="!bg-emerald-500/10 !text-emerald-600 !font-black !text-[9px] !uppercase"
                        />
                      )}
                    </div>
                    {cargando && !yaIniciado && <LinearProgress className="mt-3" />}
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoIniciar(false)} disabled={cargando}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Solicitar ascenso */}
      <Dialog
        open={dialogoSolicitar}
        onClose={() => !cargando && setDialogoSolicitar(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '1.5rem' } }}
      >
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-primary">
          Solicitar ascenso
        </DialogTitle>
        <DialogContent dividers>
          {!resultadoSolicitud ? (
            <div className="space-y-3 py-2">
              <p className="text-sm font-bold text-primary">
                ¿Solicitar el ascenso del adelanto <strong>{adelanto?.nombre}</strong>?
              </p>
              <div className="bg-surface-container-low p-4 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                  Requerido {adelanto?.requerido} de {adelanto?.poolTotal} indicadores
                </p>
                <p className="text-xs font-black text-primary">
                  {adelanto?.completados} completados · faltan {adelanto?.faltantes}
                </p>
                {adelanto && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(adelanto.porcentajeActual, 100)}
                    className="h-1.5 rounded-full bg-primary/10 mt-2"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm font-bold text-error">
                Aún no se cumplen los requisitos: faltan {resultadoSolicitud.faltantes}{' '}
                indicador(es).
              </p>
              {resultadoSolicitud.faltantesDetallados &&
                resultadoSolicitud.faltantesDetallados.length > 0 && (
                  <div className="bg-error/5 border border-error/20 p-4 rounded-2xl space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-error">
                      Faltantes
                    </p>
                    <ul className="space-y-1.5">
                      {resultadoSolicitud.faltantesDetallados.map((f) => (
                        <li key={f.id} className="text-xs text-primary">
                          <span className="font-black">{f.codigo}</span> · {f.texto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
          {error && <p className="text-xs font-bold text-error mt-3">{error}</p>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoSolicitar(false)} disabled={cargando}>
            {resultadoSolicitud ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!resultadoSolicitud && (
            <Button
              onClick={solicitar}
              disabled={cargando}
              variant="contained"
              className="!bg-primary !text-on-primary !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest"
            >
              {cargando ? <CircularProgress size={16} color="inherit" /> : 'Confirmar solicitud'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Aprobar ascenso */}
      <Dialog
        open={dialogoAprobar}
        onClose={() => !cargando && setDialogoAprobar(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '1.5rem' } }}
      >
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-primary">
          Aprobar ascenso
        </DialogTitle>
        <DialogContent dividers>
          <p className="text-sm font-bold text-primary">
            Se aprobará el ascenso del adelanto <strong>{pendiente?.nombre}</strong>. El joven
            pasará al siguiente adelanto de la unidad en curso.
          </p>
          {error && <p className="text-xs font-bold text-error mt-3">{error}</p>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAprobar(false)} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            onClick={aprobar}
            disabled={cargando}
            variant="contained"
            className="!bg-emerald-600 !text-white !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest"
          >
            {cargando ? <CircularProgress size={16} color="inherit" /> : 'Aprobar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rechazar ascenso */}
      <Dialog
        open={dialogoRechazar}
        onClose={() => !cargando && setDialogoRechazar(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '1.5rem' } }}
      >
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-primary">
          Rechazar ascenso
        </DialogTitle>
        <DialogContent dividers>
          <p className="text-sm font-bold text-primary mb-4">
            Se rechazará la solicitud del adelanto <strong>{pendiente?.nombre}</strong>.
          </p>
          <TextField
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            label="Motivo (opcional)"
            multiline
            minRows={2}
            fullWidth
            inputProps={{ maxLength: 300 }}
          />
          {error && <p className="text-xs font-bold text-error mt-3">{error}</p>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoRechazar(false)} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            onClick={rechazar}
            disabled={cargando}
            variant="contained"
            className="!bg-error !text-on-error !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest"
          >
            {cargando ? <CircularProgress size={16} color="inherit" /> : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.severidad} onClose={() => setSnack(null)} variant="filled">
          {snack?.texto}
        </Alert>
      </Snackbar>
    </Box>
  );
};
