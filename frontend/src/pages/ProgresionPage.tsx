import { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Route, TrendingUp } from '@mui/icons-material';
import { unidadesApi } from '../api';
import { useUnidadesFiltradas, ordenarPorUnidad } from '../hooks/useUnidad';
import { UnidadProgresionPanel } from '../features/progresion/UnidadProgresionPanel';
import { UnidadEntity } from '../types/member';

export const ProgresionPage = () => {
  const permitidas = useUnidadesFiltradas();
  const [unidades, setUnidades] = useState<UnidadEntity[]>([]);
  const [seleccion, setSeleccion] = useState<string | null>(null);

  useEffect(() => {
    unidadesApi
      .getAll()
      .then((data) => setUnidades(data as UnidadEntity[]))
      .catch(() => setUnidades([]));
  }, []);

  const opciones = useMemo(
    () =>
      ordenarPorUnidad(
        unidades.filter((u) =>
          permitidas.some((p) => u.nombre?.toLowerCase() === p.toLowerCase()),
        ),
      ),
    [unidades, permitidas],
  );

  useEffect(() => {
    if (!seleccion && opciones.length > 0) {
      setSeleccion(opciones[0].id ?? null);
    }
  }, [opciones, seleccion]);

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <header className="relative overflow-hidden sentinel-gradient p-8 rounded-[2rem] text-on-primary shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-primary shadow-lg rotate-2">
            <TrendingUp />
          </div>
          <div>
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/10">
              Progresión Personal
            </span>
            <h1 className="text-4xl font-black tracking-tighter mt-2">Cuadro de Adelanto</h1>
            <p className="text-sm font-medium opacity-70 max-w-md">
              Avance de cada joven por área de crecimiento y adelanto en curso.
            </p>
          </div>
        </div>
      </header>

      {opciones.length === 0 ? (
        <div className="bg-surface-container-lowest p-10 rounded-[2rem] border border-outline-variant/10 text-center space-y-2">
          <Route className="text-outline mx-auto !text-3xl opacity-40" />
          <p className="text-xs font-bold text-outline uppercase tracking-widest">
            No tenés unidades disponibles para consultar.
          </p>
        </div>
      ) : (
        <Box className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {opciones.map((u) => {
              const activa = u.id === seleccion;
              return (
                <button
                  key={u.id}
                  onClick={() => setSeleccion(u.id ?? null)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activa
                      ? 'sentinel-gradient text-on-primary shadow-lg shadow-primary/20'
                      : 'bg-surface-container-lowest text-primary border border-outline-variant/10 hover:bg-surface-container-low'
                  }`}
                >
                  {u.nombre}
                </button>
              );
            })}
          </div>

          {seleccion && <UnidadProgresionPanel unidadId={seleccion} />}
          {!seleccion && (
            <Typography className="text-xs font-bold text-outline text-center py-6">
              Cargando unidades…
            </Typography>
          )}
        </Box>
      )}
    </div>
  );
};
