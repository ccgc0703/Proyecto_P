import { useEffect, useMemo, useState } from 'react';
import { TrendingUp } from '@mui/icons-material';
import { unidadesApi } from '../api';
import { useUnidadesFiltradas, ordenarPorUnidad } from '../hooks/useUnidad';
import { UnidadProgresionPanel } from '../features/progresion/UnidadProgresionPanel';
import { UnidadEntity } from '../types/member';
import { Hero, HeroChip, StateBlock } from '../components/ui';

/** Color de acento por unidad — espejo de `UNIDAD_DOT` de la maqueta. */
const COLOR_UNIDAD: Record<string, string> = {
  MANADA: 'var(--color-primary)',
  TROPA: 'var(--color-secondary)',
  COMUNIDAD: 'var(--color-accent)',
  CLAN: 'var(--color-outline)',
};

export const ProgresionPage = () => {
  const permitidas = useUnidadesFiltradas();
  const [unidades, setUnidades] = useState<UnidadEntity[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccion, setSeleccion] = useState<string | null>(null);

  useEffect(() => {
    unidadesApi
      .getAll()
      .then((data) => setUnidades(data as UnidadEntity[]))
      .catch(() => setUnidades([]))
      .finally(() => setCargando(false));
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

  const nombreSeleccion = opciones.find((u) => u.id === seleccion)?.nombre;

  useEffect(() => {
    if (!seleccion && opciones.length > 0) {
      setSeleccion(opciones[0].id ?? null);
    }
  }, [opciones, seleccion]);

  return (
    <div className="space-y-5 animate-fade-in-up pb-10">
      <Hero
        chips={<HeroChip icono={<TrendingUp />}>Progresión Personal</HeroChip>}
        titulo="Cuadro de Adelanto"
        subtitulo="Avance de cada joven por área de crecimiento y adelanto en curso."
        icono={<TrendingUp />}
      />

      {cargando ? (
        <StateBlock estado="loading" filas={4} />
      ) : opciones.length === 0 ? (
        <StateBlock
          estado="empty"
          titulo="Sin unidades disponibles"
          mensaje="No tenés unidades disponibles para consultar."
        />
      ) : (
        <>
          {/* Selector de unidad */}
          <div className="chip-form" role="tablist" aria-label="Seleccionar unidad">
            {opciones.map((u) => {
              const activa = u.id === seleccion;
              const color =
                COLOR_UNIDAD[(u.nombre ?? '').toUpperCase()] ?? 'var(--color-outline)';
              return (
                <button
                  key={u.id}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  className={`chip-btn${activa ? ' on' : ''}`}
                  onClick={() => setSeleccion(u.id ?? null)}
                >
                  <i aria-hidden="true" style={{ background: color }} />
                  {u.nombre}
                </button>
              );
            })}
          </div>

          {seleccion ? (
            <UnidadProgresionPanel unidadId={seleccion} titulo={nombreSeleccion} />
          ) : (
            <StateBlock estado="loading" filas={4} />
          )}
        </>
      )}
    </div>
  );
};
