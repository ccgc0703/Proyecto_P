import { Box, Chip, LinearProgress, Typography } from '@mui/material';
import {
  EmojiEvents,
  Replay,
  TaskAlt,
  HourglassEmpty,
  Cancel,
  Science,
  TrendingUp,
  WarningAmber,
} from '@mui/icons-material';
import {
  ConteoPrueba,
  HistorialProgresion,
  ResumenProgresion,
} from '../../types/progresion';

interface ProgresionResumenProps {
  resumen: ResumenProgresion | null;
  loading: boolean;
  error: string | null;
  prueba: ConteoPrueba | null;
  onRecargar: () => void;
}

const coloresHistorial: Record<string, string> = {
  APROBADA: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  SOLICITADA: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  RECHAZADA: 'bg-red-500/10 text-red-500 border-red-500/20',
  EN_CURSO: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const iconoHistorial = (estado: string) => {
  if (estado === 'APROBADA') return <TaskAlt fontSize="small" />;
  if (estado === 'RECHAZADA') return <Cancel fontSize="small" />;
  if (estado === 'SOLICITADA') return <HourglassEmpty fontSize="small" />;
  return <EmojiEvents fontSize="small" />;
};

const fechaCorta = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export const ProgresionResumen = ({
  resumen,
  loading,
  error,
  prueba,
  onRecargar,
}: ProgresionResumenProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 space-y-4">
        <WarningAmber className="text-error mx-auto !text-4xl opacity-50" />
        <p className="text-xs font-bold text-outline">{error}</p>
        <button
          onClick={onRecargar}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-colors"
        >
          <Replay fontSize="small" /> Reintentar
        </button>
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="text-center py-10 space-y-2">
        <EmojiEvents className="text-outline mx-auto !text-4xl opacity-30" />
        <p className="text-xs font-bold text-outline uppercase tracking-widest">
          Sin datos de progresión
        </p>
      </div>
    );
  }

  const adelanto = resumen.adelantoActual;
  const pendiente = resumen.historialProgresiones.find((p) => p.estado === 'SOLICITADA');
  const solicitable = !adelanto && !!pendiente;
  const aprobadas = resumen.historialProgresiones.filter((p) => p.estado === 'APROBADA');
  const hayAprobado = aprobadas.length > 0;
  const ultimoAprobado = aprobadas.reduce<HistorialProgresion | null>(
    (mejor, p) => (!mejor || p.orden >= mejor.orden ? p : mejor),
    null,
  );
  const totalPool = resumen.porArea.reduce((suma, a) => suma + a.total, 0);
  const totalCompletados = resumen.porArea.reduce((suma, a) => suma + a.completados, 0);
  const pctPool = totalPool > 0 ? Math.floor((totalCompletados / totalPool) * 100) : 0;

  return (
    <Box className="space-y-6">
      {/* Adelanto actual: último aprobado + próximo adelanto */}
      <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10">
        <Box className="flex flex-wrap justify-between items-center gap-3">
          <Typography className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <EmojiEvents fontSize="small" /> Último adelanto recibido/aprobado
          </Typography>
          {ultimoAprobado ? (
            <Box className="flex flex-wrap items-center gap-3">
              <Chip
                label={`${ultimoAprobado.orden}° ${ultimoAprobado.nombre}`}
                className="bg-emerald-500/10 text-emerald-600 font-black text-[9px] uppercase tracking-widest"
              />
              <span className="text-[9px] font-bold text-outline uppercase tracking-widest">
                Aprobado {fechaCorta(ultimoAprobado.fechaCulminacion)}
              </span>
            </Box>
          ) : (
            <Chip
              label="Sin adelantos aprobados"
              className="bg-surface-container-high text-outline font-black text-[9px] uppercase tracking-widest"
            />
          )}
        </Box>

        <Box className="my-6 border-t border-outline-variant/10" />

        <Box className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <Typography className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <TrendingUp fontSize="small" /> Próximo adelanto
          </Typography>
          <Box className="flex flex-wrap items-center gap-2">
            {adelanto && (
              <>
                <Chip
                  label={`${adelanto.nombre} · ${adelanto.orden}°`}
                  className={adelanto.esPruebaAislada
                    ? 'bg-amber-500/10 text-amber-600 font-black text-[9px] uppercase tracking-widest'
                    : 'bg-primary/10 text-primary font-black text-[9px] uppercase tracking-widest'}
                />
                {adelanto.esPruebaAislada && (
                  <Chip
                    label="Prueba de adelanto · cuenta solo sus ítems"
                    className="bg-amber-500/15 text-amber-700 font-black text-[9px] uppercase tracking-widest"
                  />
                )}
              </>
            )}
            {solicitable && pendiente && (
              <Chip
                label={`${pendiente.nombre} · ascendido solicitado`}
                className="bg-amber-500/10 text-amber-600 font-black text-[9px] uppercase tracking-widest"
              />
            )}
          </Box>
        </Box>

        {!adelanto ? (
          <p className="text-xs font-bold text-outline text-center py-4">
            {solicitable
              ? 'Ascenso solicitado, pendiente de aprobación.'
              : 'Este joven no tiene un adelanto en curso.'}
          </p>
        ) : (
          <GridResumen adelanto={adelanto} bloqueo={resumen.bloqueo} />
        )}
      </div>

      {/* Por área */}
      <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10">
        <Typography className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">
          Avance por Área de Crecimiento
        </Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumen.porArea.map((area) => {
            const pct = area.total > 0 ? Math.floor((area.completados / area.total) * 100) : 0;
            return (
              <div key={area.area} className="bg-white/50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-tight">
                    {area.area}
                  </p>
                  <p className="text-xs font-black text-primary whitespace-nowrap">
                    {area.completados}/{area.total}
                  </p>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  className="h-1.5 rounded-full bg-primary/10"
                />
                <p className="text-[9px] font-bold text-outline uppercase tracking-wider">
                  {area.pendientes} pendientes · {area.enProceso} en proceso ·{' '}
                  {area.pendienteAprobacion} por aprobar
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-4 border-t border-outline/10 flex flex-wrap justify-between items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-outline">
            Total áreas de crecimiento
          </span>
          <span className="text-sm font-black text-primary">
            {totalCompletados}/{totalPool} indicadores
            <span className="text-xs text-outline font-bold"> · {pctPool}%</span>
          </span>
        </div>
      </div>

      {/* Prueba de Adelanto — panel propio, fuera de las áreas de crecimiento.
          Se oculta cuando el joven ya tiene su primer adelanto aprobado. */}
      {prueba && prueba.total > 0 && !hayAprobado && (
        <div className="bg-amber-500/5 p-8 rounded-[2rem] border-2 border-amber-500/25">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <Typography className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Science fontSize="small" /> Prueba de Adelanto · inicio de los adelantos de unidad
            </Typography>
            <Chip
              label={`${prueba.completados}/${prueba.total} completados`}
              className="bg-amber-500/10 text-amber-600 font-black text-[9px] uppercase tracking-widest"
            />
          </div>
          <LinearProgress
            variant="determinate"
            value={prueba.total > 0 ? Math.floor((prueba.completados / prueba.total) * 100) : 0}
            className="h-2 rounded-full bg-amber-500/10 mb-5"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniPrueba label="Pendientes" valor={prueba.pendientes} />
            <MiniPrueba label="En proceso" valor={prueba.enProceso} />
            <MiniPrueba label="Por aprobar" valor={prueba.pendienteAprobacion} />
            <MiniPrueba label="Completados" valor={prueba.completados} destacado />
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10">
        <Typography className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">
          Historial de Adelantos
        </Typography>
        {resumen.historialProgresiones.length === 0 ? (
          <p className="text-xs font-bold text-outline">Sin adelantos registrados todavía.</p>
        ) : (
          <div className="space-y-3">
            {resumen.historialProgresiones.map((prog: HistorialProgresion) => (
              <div
                key={prog.id}
                className="bg-white/50 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    {iconoHistorial(prog.estado)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-primary">
                      {prog.orden}° {prog.nombre}
                    </p>
                    <p className="text-[9px] font-bold text-outline uppercase tracking-widest">
                      Inicio {fechaCorta(prog.fechaInicio)} · Fin {fechaCorta(prog.fechaCulminacion)}
                    </p>
                  </div>
                </div>
                <Chip
                  label={prog.estado.replace('_', ' ')}
                  className={`!font-black !text-[9px] !uppercase !tracking-widest ${
                    coloresHistorial[prog.estado] ?? 'bg-surface-container-high text-primary'
                  }`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {resumen.bloqueo && (
        <div className="bg-error/5 border border-error/20 p-5 rounded-2xl flex items-start gap-3">
          <WarningAmber className="text-error shrink-0" fontSize="small" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-error mb-1">
              Bloqueo
            </p>
            <p className="text-xs font-bold text-error">{resumen.bloqueo.motivo}</p>
          </div>
        </div>
      )}
    </Box>
  );
};

interface GridResumenProps {
  adelanto: NonNullable<ResumenProgresion['adelantoActual']>;
  bloqueo: ResumenProgresion['bloqueo'];
}

const GridResumen = ({ adelanto, bloqueo }: GridResumenProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
    <div className="flex flex-col items-center p-6 bg-white/40 rounded-3xl">
      <Typography className="text-[10px] font-black text-primary uppercase mb-4 text-center">
        Hacia {adelanto.nombre}
      </Typography>
      <Box className="w-28 h-28 rounded-full border-8 border-primary/10 flex items-center justify-center relative">
        <Typography variant="h4" className="font-black text-primary">
          {adelanto.porcentajeActual}%
        </Typography>
      </Box>
      <div className="mt-5 w-full space-y-2">
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-outline">Completados</span>
          <span className="font-black text-primary">
            {adelanto.completados}/{adelanto.requerido}
          </span>
        </div>
        <LinearProgress
          variant="determinate"
          value={Math.min(adelanto.porcentajeActual, 100)}
          className="h-2 rounded-full bg-primary/10"
        />
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-outline">{adelanto.esPruebaAislada ? 'Ítems de prueba' : 'Pool'}</span>
          <span className="font-black text-primary">
            {adelanto.poolTotal} {adelanto.esPruebaAislada ? 'ítems de prueba' : 'indicadores'}
          </span>
        </div>
      </div>
    </div>

    <div className="md:col-span-2 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Metrica
          label="Umbral"
          valor={adelanto.esPruebaAislada ? 'Prueba' : `${adelanto.umbralPorcentaje}%`}
        />
        <Metrica label="Faltantes" valor={String(adelanto.faltantes)} />
        <Metrica label="Estado" valor="En curso" />
      </div>

      {adelanto.faltantes > 0 ? (
        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">
            Para solicitar el ascenso
          </p>
          <p className="text-xs font-bold text-primary">
            Faltan <span className="font-black">{adelanto.faltantes}</span> indicador(es) por
            completar.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">
            Requisitos cumplidos
          </p>
          <p className="text-xs font-bold text-primary">
            Todavía puede solicitar el ascenso a {adelanto.nombre}.
          </p>
        </div>
      )}

      {bloqueo && (
        <div className="bg-error/5 border border-error/20 p-4 rounded-2xl flex items-start gap-2">
          <WarningAmber className="text-error shrink-0" fontSize="small" />
          <p className="text-xs font-bold text-error">{bloqueo.motivo}</p>
        </div>
      )}
    </div>
  </div>
);

const Metrica = ({ label, valor }: { label: string; valor: string }) => (
  <div className="bg-white/50 p-4 rounded-2xl">
    <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">{label}</p>
    <p className="text-lg font-black text-primary">{valor}</p>
  </div>
);

const MiniPrueba = ({
  label,
  valor,
  destacado,
}: {
  label: string;
  valor: number;
  destacado?: boolean;
}) => (
  <div className={`p-4 rounded-2xl ${destacado ? 'bg-amber-500/10' : 'bg-white/50'}`}>
    <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">{label}</p>
    <p className={`text-lg font-black ${destacado ? 'text-amber-600' : 'text-primary'}`}>{valor}</p>
  </div>
);
