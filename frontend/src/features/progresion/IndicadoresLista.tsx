import { useMemo, useState } from 'react';
import {
  Alert,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import {
  Checklist,
  ExpandLess,
  ExpandMore,
  Science,
  Search,
} from '@mui/icons-material';
import { progresionApi } from '../../api';
import { EstadoIndicador, IndicadorJoven } from '../../types/progresion';
import { getApiErrorMessage } from '../../utils/errors';

interface IndicadoresListaProps {
  miembroId: string;
  indicadores: IndicadorJoven[];
  canEdit: boolean;
  onCambio: () => void;
}

const CLAVE_PRUEBA = '__prueba__';

const ESTADOS: { valor: EstadoIndicador; label: string; clase: string }[] = [
  {
    valor: 'PENDIENTE',
    label: 'Pendiente',
    clase: 'bg-surface-container-high text-outline border-outline/10',
  },
  { valor: 'EN_PROCESO', label: 'En proceso', clase: 'bg-blue-500/5 text-blue-600 border-blue-500/20' },
  {
    valor: 'PENDIENTE_APROBACION',
    label: 'Por aprobar',
    clase: 'bg-amber-500/5 text-amber-600 border-amber-500/20',
  },
  {
    valor: 'COMPLETADO',
    label: 'Completado',
    clase: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20',
  },
];

const metaEstado = (estado: EstadoIndicador) =>
  ESTADOS.find((e) => e.valor === estado) ?? ESTADOS[0];

const nuevoConteo = (): Record<EstadoIndicador, number> => ({
  PENDIENTE: 0,
  EN_PROCESO: 0,
  PENDIENTE_APROBACION: 0,
  COMPLETADO: 0,
});

const coincide = (i: IndicadorJoven, texto: string) =>
  i.texto.toLowerCase().includes(texto) ||
  i.codigo.toLowerCase().includes(texto) ||
  i.area.toLowerCase().includes(texto);

export const IndicadoresLista = ({
  miembroId,
  indicadores,
  canEdit,
  onCambio,
}: IndicadoresListaProps) => {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pool = useMemo(() => indicadores.filter((i) => i.areaTipo === 'AREA_CRECIMIENTO'), [indicadores]);
  const prueba = useMemo(() => indicadores.filter((i) => i.areaTipo === 'PRUEBA_ADELANTO'), [indicadores]);

  const texto = busqueda.trim().toLowerCase();

  const grupos = useMemo(() => {
    const filtrados = texto ? pool.filter((i) => coincide(i, texto)) : pool;
    const mapa = new Map<string, IndicadorJoven[]>();
    for (const ind of filtrados) {
      const lista = mapa.get(ind.area) ?? [];
      lista.push(ind);
      mapa.set(ind.area, lista);
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.orden - b.orden);
    return Array.from(mapa.entries());
  }, [pool, texto]);

  const pruebaFiltrada = useMemo(
    () => (texto ? prueba.filter((i) => coincide(i, texto)) : prueba),
    [prueba, texto],
  );

  const totalesPool = useMemo(() => {
    const cuenta = nuevoConteo();
    for (const i of pool) cuenta[i.estado] += 1;
    return cuenta;
  }, [pool]);

  const totalesPrueba = useMemo(() => {
    const cuenta = nuevoConteo();
    for (const i of prueba) cuenta[i.estado] += 1;
    return cuenta;
  }, [prueba]);

  const hayBusqueda = texto.length > 0;
  const estaAbierta = (clave: string, hayCoincidencias: boolean) =>
    hayBusqueda ? hayCoincidencias : (abierto[clave] ?? false);

  const claves = [...grupos.map(([area]) => area), CLAVE_PRUEBA];

  const alternar = (clave: string) => setAbierto((prev) => ({ ...prev, [clave]: !prev[clave] }));
  const expandirTodo = () =>
    setAbierto(Object.fromEntries(claves.map((k) => [k, true])) as Record<string, boolean>);
  const colapsarTodo = () =>
    setAbierto(Object.fromEntries(claves.map((k) => [k, false])) as Record<string, boolean>);

  const cambiarEstado = async (indicador: IndicadorJoven, estado: EstadoIndicador) => {
    setGuardandoId(indicador.id);
    setError(null);
    try {
      await progresionApi.setEstado(miembroId, indicador.id, { estado });
      onCambio();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el indicador.'));
    } finally {
      setGuardandoId(null);
    }
  };

  if (indicadores.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <Checklist className="text-outline mx-auto !text-4xl opacity-30" />
        <p className="text-xs font-bold text-outline uppercase tracking-widest">
          Sin indicadores para esta unidad
        </p>
      </div>
    );
  }

  const sinResultados = hayBusqueda && grupos.length === 0 && pruebaFiltrada.length === 0;

  return (
    <div className="space-y-6">
      {/* Contadores: crecimiento (separado de la prueba) */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-2">
            Áreas de crecimiento · {pool.length} indicadores
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ESTADOS.map((e) => (
              <div key={e.valor} className={`p-3 rounded-xl border ${e.clase}`}>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
                  {e.label}
                </p>
                <p className="text-lg font-black leading-tight">{totalesPool[e.valor]}</p>
              </div>
            ))}
          </div>
        </div>

        {prueba.length > 0 && (
          <div className="xl:w-[380px] p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1.5 mb-2">
              <Science sx={{ fontSize: 13 }} /> Prueba de Adelanto · inicio de los adelantos
            </p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-2xl font-black text-amber-600 leading-none">
                {totalesPrueba.COMPLETADO}
                <span className="text-sm text-outline">/{prueba.length}</span>
              </p>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest text-right">
                {totalesPrueba.PENDIENTE} pend · {totalesPrueba.EN_PROCESO} proc ·{' '}
                {totalesPrueba.PENDIENTE_APROBACION} apr
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Buscador + controles de colapso */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" fontSize="small" />
          <input
            type="text"
            placeholder="BUSCAR INDICADOR..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all shadow-inner"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandirTodo}
            disabled={hayBusqueda}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-40"
          >
            <ExpandMore sx={{ fontSize: 16 }} /> Expandir todo
          </button>
          <button
            onClick={colapsarTodo}
            disabled={hayBusqueda}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-surface-container-high text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-all disabled:opacity-40"
          >
            <ExpandLess sx={{ fontSize: 16 }} /> Colapsar todo
          </button>
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {sinResultados && (
        <p className="text-xs font-bold text-outline text-center py-6">
          Ningún indicador coincide con “{busqueda}”.
        </p>
      )}

      {/* Áreas de crecimiento (colapsables) */}
      {grupos.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-outline px-1">
            Áreas de crecimiento · {grupos.length} áreas
          </p>
          {grupos.map(([area, items]) => {
            const abierta = estaAbierta(area, true);
            const completados = items.filter((i) => i.estado === 'COMPLETADO').length;
            return (
              <section
                key={area}
                className="bg-surface-container-low rounded-[1.5rem] border border-outline-variant/10 overflow-hidden"
              >
                <button
                  onClick={() => alternar(area)}
                  className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-surface-container-high hover:bg-primary/5 transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    {abierta ? (
                      <ExpandLess className="text-primary" />
                    ) : (
                      <ExpandMore className="text-primary" />
                    )}
                    <Typography className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {area}
                    </Typography>
                  </span>
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    {completados}/{items.length} completados
                  </span>
                </button>

                {abierta && (
                  <div className="divide-y divide-outline/5">
                    {items.map((ind) => (
                      <FilaIndicador
                        key={ind.id}
                        indicador={ind}
                        canEdit={canEdit}
                        guardando={guardandoId === ind.id}
                        onCambiar={(estado) => cambiarEstado(ind, estado)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Prueba de Adelanto — panel propio, fuera del listado de indicadores */}
      {prueba.length > 0 && (
        <div className="border-t-2 border-dashed border-amber-500/30 pt-6">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 px-1 mb-3">
            Prueba de Adelanto · inicio de los adelantos de unidad · {prueba.length} ítems
          </p>
          <section className="rounded-[1.5rem] border-2 border-amber-500/30 bg-amber-500/5 overflow-hidden">
            <button
              onClick={() => alternar(CLAVE_PRUEBA)}
              className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                {estaAbierta(CLAVE_PRUEBA, pruebaFiltrada.length > 0) ? (
                  <ExpandLess className="text-amber-600" />
                ) : (
                  <ExpandMore className="text-amber-600" />
                )}
                <Science className="text-amber-600" fontSize="small" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                  Prueba de Adelanto
                </span>
              </span>
              <span className="text-[10px] font-black text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                {pruebaFiltrada.filter((i) => i.estado === 'COMPLETADO').length}/
                {pruebaFiltrada.length} completados
              </span>
            </button>

            {estaAbierta(CLAVE_PRUEBA, pruebaFiltrada.length > 0) && (
              <div className="divide-y divide-amber-500/10">
                {pruebaFiltrada.map((ind) => (
                  <FilaIndicador
                    key={ind.id}
                    indicador={ind}
                    canEdit={canEdit}
                    guardando={guardandoId === ind.id}
                    onCambiar={(estado) => cambiarEstado(ind, estado)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

interface FilaIndicadorProps {
  indicador: IndicadorJoven;
  canEdit: boolean;
  guardando: boolean;
  onCambiar: (estado: EstadoIndicador) => void;
}

const FilaIndicador = ({ indicador, canEdit, guardando, onCambiar }: FilaIndicadorProps) => {
  const meta = metaEstado(indicador.estado);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-3 hover:bg-white/40 transition-colors">
      <span className="text-[10px] font-black text-primary bg-surface-container-high px-2 py-1 rounded-lg border border-outline/10 w-fit shrink-0">
        {indicador.codigo}
      </span>
      <p className="flex-1 text-xs font-bold text-primary leading-snug">{indicador.texto}</p>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${meta.clase} ${canEdit ? 'hidden sm:inline-block' : ''}`}
        >
          {meta.label}
        </span>
        {canEdit && (
          <FormControl size="small" className="min-w-[150px]">
            <Select
              value={indicador.estado}
              disabled={guardando}
              onChange={(e) => onCambiar(e.target.value as EstadoIndicador)}
              className="!text-[10px] !font-black !uppercase !tracking-widest !rounded-lg"
              renderValue={(v) => metaEstado(v as EstadoIndicador).label}
            >
              {ESTADOS.map((e) => (
                <MenuItem key={e.valor} value={e.valor}>
                  {e.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {guardando && <CircularProgress size={14} />}
      </div>
    </div>
  );
};
