import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useCanViewAllUnidades } from '../hooks/useUnidad';
import { api } from '../api';
import { Card, KpiCard, PageHeader, Pill, StateBlock } from '../components/ui';
import {
  Groups2,
  HomeWork,
  TrendingUp,
  Place,
  ArrowForward,
} from '@mui/icons-material';

interface Stats {
  totalJovenes: number;
  manada: number;
  tropa: number;
  comunidad: number;
  clan: number;
}

interface Actividad {
  id: number;
  titulo: string;
  dia: string;
  mes: string;
  ubicacion: string;
  alcance: 'GRUPO' | 'DISTRITO' | 'REGION' | 'NACIONAL';
}

/** Agenda de referencia — se sustituirá por `GET /planificaciones` en Fase 3. */
const ACTIVIDADES: Actividad[] = [
  { id: 1, titulo: 'Campamento de Primavera', dia: '15', mes: 'ABR', ubicacion: 'Reserva Natural "Los Pinos"', alcance: 'GRUPO' },
  { id: 2, titulo: 'Torneo Comunitario de Limpieza del Río', dia: '22', mes: 'ABR', ubicacion: 'Ribera del Río Bravo', alcance: 'DISTRITO' },
  { id: 3, titulo: 'Inscripción de Dirigentes', dia: '30', mes: 'ABR', ubicacion: 'Sede Central', alcance: 'REGION' },
];

const ALCANCE_COLOR: Record<Actividad['alcance'], string> = {
  GRUPO: 'var(--color-alc-grupo)',
  DISTRITO: 'var(--color-alc-distrito)',
  REGION: 'var(--color-alc-region)',
  NACIONAL: 'var(--color-alc-nacional)',
};

/** Segmentos del donut: circunferencia de r=40 → 2πr ≈ 251.2. */
const CIRC = 251.2;
const COLORES_UNIDAD = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-outline)'];

export const DashboardPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const canViewAll = useCanViewAllUnidades();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const response = await api.get('/jovenes/stats');
        setStats(response.data.data);
      } catch {
        setStats({ totalJovenes: 0, manada: 0, tropa: 0, comunidad: 0, clan: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  const total = stats?.totalJovenes ?? 0;
  const unidades: Array<{ nombre: string; valor: number }> = [
    { nombre: 'Manada', valor: stats?.manada ?? 0 },
    { nombre: 'Tropa', valor: stats?.tropa ?? 0 },
    { nombre: 'Comunidad', valor: stats?.comunidad ?? 0 },
    { nombre: 'Clan', valor: stats?.clan ?? 0 },
  ];
  const unidadesActivas = canViewAll ? 4 : 1;

  /* Acumula el desplazamiento de cada arco del donut. */
  let acumulado = 0;
  const segmentos = unidades.map((u, i) => {
    const largo = total > 0 ? (u.valor / total) * CIRC : 0;
    const seg = { ...u, offset: acumulado, color: COLORES_UNIDAD[i] };
    acumulado += largo;
    return seg;
  });

  return (
    <div className="animate-fade-in-up pb-12">
      <PageHeader
        titulo="Dashboard de inicio"
        subtitulo={
          <>
            Bienvenido de nuevo al centro de comando, <b>{user?.nombre?.split(' ')[0]}</b>.
          </>
        }
        acciones={
          <>
            <button type="button" className="btn btn-soft btn-sm">
              <TrendingUp /> Generar Reporte
            </button>
            {/* La ruta /calendario llega en Fase 3c; hasta entonces no se enlaza. */}
          </>
        }
      />

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="kpis">
        <KpiCard
          tono="grupo"
          etiqueta="Total miembros"
          icono={<Groups2 />}
          valor={loading ? '—' : total}
          nota={<Pill variante="blue" dot>Global</Pill>}
        />
        <KpiCard
          tono="distrito"
          etiqueta="Unidades activas"
          icono={<HomeWork />}
          valor={unidadesActivas}
          nota={<Pill variante="green" dot>Operativas</Pill>}
        />
        <KpiCard
          tono="accent"
          etiqueta="Tasa de crecimiento"
          icono={<TrendingUp />}
          valor="+12"
          sufijo="%"
          nota={<Pill variante="green" dot>+2 este mes</Pill>}
        />
      </div>

      {/* ── Rejilla principal ────────────────────────────────────── */}
      <div className="dash-grid">
        <div className="flex flex-col gap-[18px] min-w-0">
          {/* Desglose por unidades */}
          <Card size="lg">
            <div className="card-head">
              <h3>Desglose por Unidades</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate({ to: '/app/unidades' })}>
                Ver detalles
              </button>
            </div>

            {loading ? (
              <StateBlock estado="loading" filas={3} />
            ) : (
              <div className="donut-wrap">
                <div className="donut">
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-surface-container-highest)" strokeWidth="12" />
                    {segmentos.map(
                      (s) =>
                        s.valor > 0 && (
                          <circle
                            key={s.nombre}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={s.color}
                            strokeWidth="12"
                            strokeDasharray={`${(s.valor / total) * CIRC} ${CIRC}`}
                            strokeDashoffset={-s.offset}
                            strokeLinecap="round"
                          />
                        ),
                    )}
                  </svg>
                  <div className="donut-c">
                    <b>{total}</b>
                    <span>Total</span>
                  </div>
                </div>

                <div className="dlegend">
                  {segmentos.map((s) => (
                    <div className="li" key={s.nombre}>
                      <div className="top">
                        <i style={{ background: s.color }} />
                        <span>{s.nombre}</span>
                      </div>
                      <b>
                        {s.valor}
                        <em>{total > 0 ? `${Math.round((s.valor / total) * 100)}%` : '0%'}</em>
                      </b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Próximas actividades */}
          <Card size="lg">
            <div className="card-head">
              <h3>Próximas Actividades</h3>
              {/* El enlace "Ver todas" se añade junto a la ruta /calendario (Fase 3c) */}
            </div>
            <div className="ag-list">
              {ACTIVIDADES.map((a) => (
                <button key={a.id} type="button" className="ag-item cursor-pointer">
                  <span className="ag-date" aria-hidden="true">
                    <b>{a.dia}</b>
                    <span>{a.mes}</span>
                  </span>
                  <span className="ag-body">
                    <h4>{a.titulo}</h4>
                    <span className="ag-meta">
                      <span className="ag-scope" style={{ color: ALCANCE_COLOR[a.alcance] }}>
                        <i style={{ background: ALCANCE_COLOR[a.alcance] }} />
                        {a.alcance}
                      </span>
                      <span className="ag-loc">
                        <Place /> {a.ubicacion}
                      </span>
                    </span>
                  </span>
                  <ArrowForward className="text-outline/40" sx={{ fontSize: 16 }} aria-hidden="true" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="flex flex-col gap-[18px] min-w-0">
          <section
            className="card card-lg relative overflow-hidden flex flex-col justify-between min-h-[300px]"
            style={{
              background: 'linear-gradient(150deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
              color: '#fff',
            }}
          >
            <div
              aria-hidden="true"
              className="absolute -top-[20%] -right-[12%] w-[230px] h-[230px] rounded-full"
              style={{ background: 'rgba(255,184,0,.2)', filter: 'blur(65px)' }}
            />
            <div className="relative z-[1]">
              <span className="pill pill-gold" style={{ background: 'rgba(255,184,0,.25)', color: '#ffdf7a' }}>
                Especial
              </span>
              <h3
                className="mt-3.5 mb-2 leading-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, letterSpacing: '-0.035em' }}
              >
                Capacitación de Dirigentes 2026
              </h3>
              <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,.78)' }}>
                Únete a la próxima sesión de capacitación estratégica para nuevos dirigentes y jefes de unidad.
              </p>
            </div>
            <div className="relative z-[1] pt-4">
              <button type="button" className="btn btn-gold btn-block">
                Reservar Mi Espacio
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
