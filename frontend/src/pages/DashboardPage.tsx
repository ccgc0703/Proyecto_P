import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useResumenDashboard } from '../hooks/useDashboard';
import { Card, KpiCard, PageHeader, Pill, StateBlock } from '../components/ui';
import {
  Groups2,
  EventAvailable,
  TrendingUp,
  Place,
  ArrowForward,
} from '@mui/icons-material';

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

/** Color de barra según el porcentaje (semáforo suave). */
const colorBarra = (pct: number): string =>
  pct >= 70 ? 'var(--color-success)' : pct >= 40 ? 'var(--color-secondary)' : 'var(--color-warning)';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: resumen, loading, error, status, reload } = useResumenDashboard();

  const poblacion = resumen?.poblacion;
  const progresion = resumen?.progresion;
  const asistencia = resumen?.asistencia;
  const alertas = resumen?.alertas ?? [];

  const total = poblacion?.total ?? 0;
  const varMes = poblacion?.varMensual ?? 0;
  const unidades = poblacion?.porUnidad ?? [];
  const solicitudes = progresion?.solicitudesPendientes ?? 0;

  /* Acumula el desplazamiento de cada arco del donut. */
  let acumulado = 0;
  const segmentos = unidades.map((u, i) => {
    const largo = total > 0 ? (u.total / total) * CIRC : 0;
    const seg = { ...u, offset: acumulado, color: COLORES_UNIDAD[i % COLORES_UNIDAD.length] };
    acumulado += largo;
    return seg;
  });

  const cabecera = (
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
  );

  /* Fallo total sin datos: 403 → vista restringida (reintentar no ayuda);
     cualquier otro fallo → estado de error con reintento. */
  if (error && !resumen) {
    const denegado = status === 403;
    return (
      <div className="animate-fade-in-up pb-12">
        {cabecera}
        <StateBlock
          estado={denegado ? 'empty' : 'error'}
          titulo={denegado ? 'Vista restringida' : undefined}
          mensaje={
            denegado
              ? 'Tu rol no tiene acceso a las métricas del grupo. Pide a tu jefatura los permisos que necesites.'
              : error
          }
          accion={
            denegado ? undefined : (
              <button type="button" className="btn btn-soft btn-sm" onClick={reload}>
                Reintentar
              </button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up pb-12">
      {cabecera}

      {/* ── KPIs ─────────────────────────────────────────────────── */}
      <div className="kpis">
        <KpiCard
          tono="grupo"
          etiqueta="Total miembros"
          icono={<Groups2 />}
          valor={loading ? '—' : total}
          nota={
            <Pill variante={varMes > 0 ? 'green' : varMes < 0 ? 'red' : 'grey'} dot>
              {varMes > 0 ? `+${varMes}` : varMes} este mes
            </Pill>
          }
        />
        <KpiCard
          tono="distrito"
          etiqueta="Asistencia 30 días"
          icono={<EventAvailable />}
          valor={loading ? '—' : asistencia?.promedio30d ?? 0}
          sufijo="%"
          nota={<Pill variante="blue" dot>Promedio móvil</Pill>}
        />
        <KpiCard
          tono="accent"
          etiqueta="Progresión"
          icono={<TrendingUp />}
          valor={loading ? '—' : progresion?.promedioPorcentaje ?? 0}
          sufijo="%"
          nota={
            <Pill variante={solicitudes > 0 ? 'gold' : 'green'} dot>
              {solicitudes > 0 ? `${solicitudes} solicitud(es)` : 'Sin solicitudes'}
            </Pill>
          }
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
                        s.total > 0 && (
                          <circle
                            key={s.unidadId}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={s.color}
                            strokeWidth="12"
                            strokeDasharray={`${(s.total / total) * CIRC} ${CIRC}`}
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
                    <div className="li" key={s.unidadId}>
                      <div className="top">
                        <i style={{ background: s.color }} />
                        <span>{s.nombre}</span>
                      </div>
                      <b>
                        {s.total}
                        <em>{total > 0 ? `${Math.round((s.total / total) * 100)}%` : '0%'}</em>
                      </b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Asistencia: promedio, tendencia semanal y última actividad */}
          <Card size="lg">
            <div className="card-head">
              <h3>Asistencia</h3>
              {asistencia?.ultimaActividad && (
                <span className="micro">Última: {asistencia.ultimaActividad.titulo}</span>
              )}
            </div>

            {loading ? (
              <StateBlock estado="loading" filas={3} />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                  <b style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-0.03em' }}>
                    {asistencia?.promedio30d ?? 0}
                  </b>
                  <small className="micro">% promedio · últimos 30 días</small>
                </div>

                <div>
                  <span className="micro">Tendencia semanal · 8 semanas</span>
                  <div
                    className="flex items-end gap-1.5 mt-2"
                    style={{ height: 116 }}
                    role="img"
                    aria-label="Tendencia semanal de asistencia"
                  >
                    {(asistencia?.tendenciaSemanal ?? []).map((b) => (
                      <div key={b.semana} className="flex flex-col items-center gap-1 min-w-0 flex-1 h-full">
                        <span className="micro" style={{ fontSize: 9 }}>
                          {b.porcentaje}
                        </span>
                        <div className="w-full flex-1 flex items-end min-h-0">
                          <div
                            className="w-full rounded-t-md"
                            style={{
                              height: `${Math.max(b.porcentaje, 2)}%`,
                              minHeight: 4,
                              background: colorBarra(b.porcentaje),
                            }}
                            title={`${b.semana}: ${b.porcentaje}%`}
                          />
                        </div>
                        <span style={{ fontSize: 9, color: 'var(--color-outline)' }}>{b.semana.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Progresión: barras por unidad */}
          <Card size="lg">
            <div className="card-head">
              <h3>Progresión por Unidad</h3>
              <Pill variante="blue" dot>
                {progresion?.adelantosAprobadosMes ?? 0} adelanto(s) este mes
              </Pill>
            </div>

            {loading ? (
              <StateBlock estado="loading" filas={3} />
            ) : (progresion?.porUnidad.length ?? 0) === 0 ? (
              <StateBlock
                estado="empty"
                titulo="Sin indicadores"
                mensaje="Aún no hay indicadores de progresión registrados en tu ámbito."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {(progresion?.porUnidad ?? []).map((u) => (
                  <div key={u.unidadId} className="flex items-center gap-3">
                    <span className="truncate" style={{ width: 96, fontSize: 12.5 }}>
                      {u.nombre}
                    </span>
                    <div
                      className="flex-1 h-2.5 rounded-full overflow-hidden min-w-0"
                      style={{ background: 'var(--color-surface-container-highest)' }}
                      role="progressbar"
                      aria-valuenow={u.porcentaje}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progresión de ${u.nombre}`}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${u.porcentaje}%`, background: colorBarra(u.porcentaje) }}
                      />
                    </div>
                    <b style={{ width: 44, textAlign: 'right', fontSize: 12.5 }}>{u.porcentaje}%</b>
                  </div>
                ))}
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
          {/* Alertas del ámbito (calculadas en tiempo real por el backend) */}
          <Card>
            <div className="card-head">
              <h3>Alertas</h3>
              <Pill variante={alertas.length > 0 ? 'gold' : 'green'} dot>
                {loading ? '…' : alertas.length}
              </Pill>
            </div>

            {loading ? (
              <StateBlock estado="loading" filas={2} />
            ) : alertas.length === 0 ? (
              <StateBlock
                estado="empty"
                titulo="Sin alertas"
                mensaje="No hay pendientes que requieran tu atención."
              />
            ) : (
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                {alertas.map((a) => (
                  <li key={a.tipo}>
                    <button
                      type="button"
                      className="ag-item w-full cursor-pointer text-left"
                      onClick={() => navigate({ to: a.link })}
                    >
                      <span className="ag-body">
                        <h4 style={{ fontSize: 13 }}>{a.texto}</h4>
                        <span className="ag-meta">
                          <span className="ag-scope" style={{ color: 'var(--color-primary)' }}>
                            <i style={{ background: 'var(--color-primary)' }} />
                            {a.tipo.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </span>
                      </span>
                      <ArrowForward className="text-outline/40" sx={{ fontSize: 16 }} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <section
            className="card card-lg relative overflow-hidden flex flex-col justify-between min-h-[300px] fill-brand"
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
