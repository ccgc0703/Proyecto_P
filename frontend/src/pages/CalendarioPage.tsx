import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Add,
  CalendarMonth,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Error as ErrorIcon,
  Schedule,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { eventosApi, organizacionApi } from '../api';
import { PageHeader, StateBlock } from '../components/ui';
import type {
  AlcancePlanificacion,
  EstadoPlanificacion,
  Planificacion,
} from '../types/eventos';
import type { NodoOrganizacion, TipoNodoOrganizacion } from '../types/organizacion';
import { getApiErrorMessage } from '../utils/errors';

type Alcance = AlcancePlanificacion;

/* ═══ Constantes de presentación (espejo de la maqueta) ═══ */

const ALCANCES: { id: Alcance; label: string; cls: string; color: string }[] = [
  { id: 'GRUPO', label: 'Grupo', cls: 's-grupo', color: 'var(--color-alc-grupo)' },
  { id: 'DISTRITO', label: 'Distrito', cls: 's-distrito', color: 'var(--color-alc-distrito)' },
  { id: 'REGION', label: 'Región', cls: 's-region', color: 'var(--color-alc-region)' },
  { id: 'NACIONAL', label: 'Nacional', cls: 's-nacional', color: 'var(--color-alc-nacional)' },
];

/** Defensivo: nunca devuelve undefined aunque el alcance venga vacío. */
const alcInfo = (id?: string | null): (typeof ALCANCES)[number] =>
  ALCANCES.find((a) => a.id === id) ?? ALCANCES[0];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MESES_C = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const ESTADO_PILL: Record<EstadoPlanificacion, { cls: string; txt: string }> = {
  BORRADOR: { cls: 'pill-grey', txt: 'Borrador' },
  APROBADO: { cls: 'pill-blue', txt: 'Aprobado' },
  EN_CURSO: { cls: 'pill-gold', txt: 'En curso' },
  COMPLETADO: { cls: 'pill-green', txt: 'Completada' },
  CANCELADO: { cls: 'pill-red', txt: 'Cancelada' },
};

const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const fmtISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** `'YYYY-MM-DD'` de un ISO de Prisma (`2026-12-01T00:00:00.000Z`). */
const aIso = (iso: string): string =>
  /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : fmtISO(new Date(iso));

/** Fecha local sin corrimiento horario (misma técnica que la maqueta). */
const parseIso = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const alcanceDelNodo = (tipo: TipoNodoOrganizacion): Alcance =>
  tipo === 'REGION' ? 'REGION' : tipo === 'DISTRITO' ? 'DISTRITO' : tipo === 'GRUPO' ? 'GRUPO' : 'NACIONAL';

/** Camino desde la raíz hasta `id` (o `null` si no existe). */
const buscarCamino = (
  nodos: NodoOrganizacion[],
  id: string,
  camino: NodoOrganizacion[] = [],
): NodoOrganizacion[] | null => {
  for (const nodo of nodos) {
    const actual = [...camino, nodo];
    if (nodo.id === id) return actual;
    const encontrado = buscarCamino(nodo.hijos ?? [], id, actual);
    if (encontrado) return encontrado;
  }
  return null;
};

/** Rango legible de fechas para el detalle (como en la maqueta). */
const rangoFechas = (p: Planificacion): string => {
  const i = aIso(p.fechaInicio);
  const f = aIso(p.fechaFin);
  const d1 = parseIso(i);
  const d2 = parseIso(f);
  if (i === f) return `${DOW[d1.getDay()]} ${d1.getDate()} ${MESES_C[d1.getMonth()]} ${d1.getFullYear()}`;
  return `${d1.getDate()} ${MESES_C[d1.getMonth()]} – ${d2.getDate()} ${MESES_C[d2.getMonth()]} ${d2.getFullYear()}`;
};

/* ═══ Formulario de nueva planificación ═══ */

const schema = z
  .object({
    titulo: z.string().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
    fechaInicio: z.string().min(1, 'Elegí la fecha de inicio'),
    fechaFin: z.string().min(1, 'Elegí la fecha de fin'),
    descripcion: z.string().max(500, 'Máximo 500 caracteres'),
    alcance: z.string(),
  })
  .refine((d) => new Date(d.fechaFin) >= new Date(d.fechaInicio), {
    message: 'La fecha final no puede ser anterior al inicio',
    path: ['fechaFin'],
  });

type FormData = z.infer<typeof schema>;

/**
 * Calendario de planificación (Fase 3 · vista mensual).
 *
 * Regla de alcance: el usuario ve TODOS los niveles (lo publicado en niveles
 * superiores llega hacia abajo), pero solo PUEDE CREAR en su propio nivel
 * (`Usuario.nodoId`, derivado en el backend). `SYSTEM_ADMIN` crea en
 * cualquiera; sin permiso `evento:create` la vista es de solo lectura.
 */
export const CalendarioPage = () => {
  const puedeVer = usePermission('evento:view');
  const puedeCrear = usePermission('evento:create');
  const { user } = useAuth();
  const esAdmin = user?.roles?.includes('SYSTEM_ADMIN') ?? false;

  const [planes, setPlanes] = useState<Planificacion[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  /** Nivel jerárquico propio (resuelto desde el árbol organizacional). */
  const [nodoAlcance, setNodoAlcance] = useState<Alcance | null>(null);
  /** Pestaña elegida por el usuario (null = la de su propio nivel). */
  const [sel, setSel] = useState<Alcance | null>(null);
  const [mes, setMes] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [diaSel, setDiaSel] = useState<string | null>(null);

  const [dialogoNuevo, setDialogoNuevo] = useState(false);
  const [detalle, setDetalle] = useState<Planificacion | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [snack, setSnack] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const alcanceSel: Alcance = sel ?? nodoAlcance ?? 'GRUPO';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: '', fechaInicio: '', fechaFin: '', descripcion: '', alcance: 'GRUPO' },
  });

  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      const data = await eventosApi.getPlanificaciones();
      setPlanes(Array.isArray(data) ? (data as Planificacion[]) : []);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Nivel propio del usuario (para el subtítulo, la pestaña inicial y el
  // alcance de creación). Complementario: si falla, la vista sigue operativa.
  useEffect(() => {
    const nodoId = user?.nodoId;
    if (!nodoId) return;
    let vivo = true;
    void organizacionApi
      .getArbol()
      .then((raiz) => {
        if (!vivo || !Array.isArray(raiz)) return;
        const camino = buscarCamino(raiz as NodoOrganizacion[], nodoId);
        const nodo = camino?.[camino.length - 1];
        if (nodo) setNodoAlcance(alcanceDelNodo(nodo.tipo));
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [user?.nodoId]);

  /** Solo se publica en el propio nivel (o en cualquiera si es admin). */
  const puedeCrearEn = useCallback(
    (a: Alcance) => esAdmin || a === nodoAlcance,
    [esAdmin, nodoAlcance],
  );

  const visibles = useMemo(
    () => planes.filter((p) => (p.alcance ?? 'GRUPO') === alcanceSel),
    [planes, alcanceSel],
  );

  const conteos = useMemo(() => {
    const c: Record<Alcance, number> = { GRUPO: 0, DISTRITO: 0, REGION: 0, NACIONAL: 0 };
    for (const p of planes) {
      const a = (p.alcance ?? 'GRUPO') as Alcance;
      if (a in c) c[a] += 1;
    }
    return c;
  }, [planes]);

  const kpis = useMemo(() => {
    const enMes = visibles.filter((p) => {
      const [y, m] = aIso(p.fechaInicio).split('-').map(Number);
      return m - 1 === mes.getMonth() && y === mes.getFullYear();
    }).length;
    const prox = visibles.filter((p) => aIso(p.fechaInicio) >= fmtISO(hoy)).length;
    const comp = visibles.filter((p) => p.estado === 'COMPLETADO').length;
    return { enMes, prox, comp };
  }, [visibles, mes]);

  /** 6 semanas × 7 días, lunes primero (como en la maqueta). */
  const semanas = useMemo(() => {
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const offset = (primero.getDay() + 6) % 7;
    const inicio = addDays(primero, -offset);
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => addDays(inicio, w * 7 + d)),
    );
  }, [mes]);

  const agenda = useMemo(() => {
    const orden = [...visibles].sort((a, b) => (aIso(a.fechaInicio) < aIso(b.fechaInicio) ? -1 : 1));
    if (!diaSel) return orden;
    return orden.filter((p) => aIso(p.fechaInicio) <= diaSel && diaSel <= aIso(p.fechaFin));
  }, [visibles, diaSel]);

  const delDia = (iso: string): Planificacion[] =>
    visibles.filter((p) => aIso(p.fechaInicio) <= iso && iso <= aIso(p.fechaFin));

  const mesAnterior = () => setMes((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const mesSiguiente = () => setMes((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const irHoy = () => {
    setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    setDiaSel(fmtISO(hoy));
  };

  const abrirNuevo = () => {
    if (!puedeCrear) return;
    const base = puedeCrearEn(alcanceSel) ? alcanceSel : (nodoAlcance ?? 'GRUPO');
    const dia = diaSel ?? fmtISO(hoy);
    reset({ titulo: '', fechaInicio: dia, fechaFin: dia, descripcion: '', alcance: base });
    setDialogoNuevo(true);
  };

  const onSubmit = async (data: FormData) => {
    setEnviando(true);
    try {
      const payload: Record<string, unknown> = {
        titulo: data.titulo.trim(),
        fechaInicio: new Date(data.fechaInicio).toISOString(),
        fechaFin: new Date(data.fechaFin).toISOString(),
      };
      if (data.descripcion.trim()) payload.descripcion = data.descripcion.trim();
      if (esAdmin) {
        // Admin sin nodo → plan de ámbito libre (flujo legado del backend).
        payload.alcance = data.alcance;
      } else if (user?.nodoId) {
        // El backend deriva y valida el alcance a partir del tipo de nodo.
        payload.nodoId = user.nodoId;
        payload.alcance = data.alcance;
      }

      const creada = (await eventosApi.createPlanificacion(payload)) as Planificacion;
      const [y, m] = aIso(creada.fechaInicio).split('-').map(Number);
      setMes(new Date(y, m - 1, 1));
      if (creada.alcance) setSel(creada.alcance);
      setDialogoNuevo(false);
      reset();
      setSnack({
        tipo: 'success',
        texto: `Planificación publicada en ${alcInfo(creada.alcance).label}`,
      });
      await cargar();
    } catch (err) {
      setSnack({ tipo: 'error', texto: getApiErrorMessage(err, 'No se pudo crear la planificación') });
    } finally {
      setEnviando(false);
    }
  };

  const subtitulo = puedeCrear
    ? `Publicá y consultá actividades de tu alcance${nodoAlcance ? ` (${alcInfo(nodoAlcance).label})` : ''} y del movimiento scout.`
    : 'Consultá las actividades publicadas. Tu rol no tiene permiso de publicar.';

  if (!puedeVer) {
    return (
      <div className="animate-fade-in-up pb-10">
        <StateBlock
          estado="error"
          titulo="Sin permiso"
          mensaje="No tenés permiso para ver el calendario de planificación."
        />
      </div>
    );
  }

  const mostrarSelect = esAdmin || nodoAlcance !== null;
  const hayGrid = estado === 'listo' && visibles.length > 0;

  return (
    <div className="animate-fade-in-up pb-10">
      <PageHeader
        micro={
          <>
            Gestión <span style={{ color: 'var(--color-outline-variant)' }}>/</span>{' '}
            <span style={{ color: 'var(--color-accent)' }}>Planificación</span>
          </>
        }
        titulo="Calendario de planificación"
        subtitulo={subtitulo}
        acciones={
          <>
            <button type="button" className="btn btn-soft btn-sm" onClick={irHoy}>
              Hoy
            </button>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              disabled
              title="Próximamente: exportación ICS / PDF"
            >
              Exportar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={abrirNuevo}
              disabled={!puedeCrear}
              title={!puedeCrear ? 'Tu rol solo tiene acceso de consulta' : undefined}
            >
              <Add />
              Nueva planificación
            </button>
          </>
        }
      />

      {/* Selector de alcance + regla de lectura */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="scope-tabs" role="tablist" aria-label="Alcance de la planificación">
          {ALCANCES.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={alcanceSel === a.id}
              className={`scope-tab ${a.cls}${alcanceSel === a.id ? ' on' : ''}`}
              onClick={() => {
                setSel(a.id);
                setDiaSel(null);
              }}
            >
              <span className="sw" aria-hidden="true" />
              {a.label}
              <span className="cnt">{conteos[a.id]}</span>
            </button>
          ))}
        </div>
        <span className="pill pill-grey">
          <i style={{ background: 'var(--color-success)' }} aria-hidden="true" />
          Solo lectura: planes superiores publicados hacia abajo
        </span>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi c-grupo">
          <div className="lbl">
            <CalendarMonth />
            <span className="micro">Este mes</span>
          </div>
          <div className="val">{estado === 'listo' ? kpis.enMes : '—'}</div>
          <div className="note">
            <span className="pill pill-grey">
              <i aria-hidden="true" />
              {alcInfo(alcanceSel).label}
            </span>
          </div>
        </div>
        <div className="kpi c-accent">
          <div className="lbl">
            <Schedule />
            <span className="micro">Próximas</span>
          </div>
          <div className="val">{estado === 'listo' ? kpis.prox : '—'}</div>
          <div className="note">
            <span className="pill pill-gold">
              <i aria-hidden="true" />
              Programadas
            </span>
          </div>
        </div>
        <div className="kpi c-distrito">
          <div className="lbl">
            <CheckCircle />
            <span className="micro">Completadas</span>
          </div>
          <div className="val">{estado === 'listo' ? kpis.comp : '—'}</div>
          <div className="note">
            <span className="pill pill-green">
              <i aria-hidden="true" />
              Cerradas
            </span>
          </div>
        </div>
      </div>

      <div className="cal-layout">
        {/* Calendario mensual */}
        <section className="card card-lg" aria-label="Calendario mensual">
          <div className="cal-bar">
            <div className="cal-nav">
              <button type="button" className="nav-btn" aria-label="Mes anterior" onClick={mesAnterior}>
                <ChevronLeft />
              </button>
              <h2>
                {MESES[mes.getMonth()]} {mes.getFullYear()}
              </h2>
              <button type="button" className="nav-btn" aria-label="Mes siguiente" onClick={mesSiguiente}>
                <ChevronRight />
              </button>
            </div>
            <span className="micro">
              {estado === 'listo' ? `${visibles.length} actividades en este alcance` : ''}
            </span>
          </div>

          {estado === 'cargando' && <StateBlock estado="loading" />}

          {estado === 'error' && (
            <StateBlock
              estado="error"
              titulo="No se pudo cargar el calendario"
              mensaje="Se perdió la conexión con el servidor de planificación. Verificá tu red e intentá de nuevo."
              accion={
                <button type="button" className="btn btn-soft btn-sm" onClick={() => void cargar()}>
                  Reintentar
                </button>
              }
            />
          )}

          {estado === 'listo' && visibles.length === 0 && (
            <StateBlock
              estado="empty"
              titulo="Sin planificaciones en este alcance"
              mensaje="Aún no hay actividades publicadas en este alcance. Creá la primera planificación para empezar."
              accion={
                puedeCrear ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={abrirNuevo}>
                    <Add />
                    Crear planificación
                  </button>
                ) : undefined
              }
            />
          )}

          {hayGrid && (
            <div className="cal-grid">
              <div className="cal-dows" aria-hidden="true">
                <span>Lun</span>
                <span>Mar</span>
                <span>Mié</span>
                <span>Jue</span>
                <span>Vie</span>
                <span className="we">Sáb</span>
                <span className="we">Dom</span>
              </div>
              {semanas.map((semana, i) => (
                <div className="cal-week" key={`s-${i}`}>
                  {semana.map((d) => {
                    const iso = fmtISO(d);
                    const fuera = d.getMonth() !== mes.getMonth();
                    const esHoy = iso === fmtISO(hoy);
                    const eventosDelDia = delDia(iso);
                    return (
                      <button
                        key={iso}
                        type="button"
                        className={`cal-day${fuera ? ' out' : ''}${esHoy ? ' today' : ''}${
                          diaSel === iso ? ' sel' : ''
                        }`}
                        aria-label={`${d.getDate()} de ${MESES[d.getMonth()]}`}
                        aria-current={esHoy ? 'date' : undefined}
                        onClick={() => setDiaSel((v) => (v === iso ? null : iso))}
                      >
                        <span className="cal-dnum">{d.getDate()}</span>
                        <span className="cal-evs">
                          {eventosDelDia.slice(0, 2).map((p) => (
                            <span
                              key={p.id}
                              className={`cal-ev g-${(p.alcance ?? 'GRUPO').toLowerCase()}`}
                              title={p.titulo}
                            >
                              <i aria-hidden="true" />
                              {p.titulo}
                            </span>
                          ))}
                          {eventosDelDia.length > 2 && (
                            <span className="cal-more">+{eventosDelDia.length - 2} más</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {hayGrid && (
            <div className="legend">
              <span className="micro" style={{ marginRight: 2 }}>
                Leyenda
              </span>
              {ALCANCES.map((a) => (
                <span className="li" key={a.id}>
                  <i style={{ background: a.color }} aria-hidden="true" />
                  {a.label}
                </span>
              ))}
              <span className="li" style={{ marginLeft: 'auto', color: 'var(--color-outline)' }}>
                <i style={{ background: 'var(--color-accent)' }} aria-hidden="true" />
                Hoy
              </span>
            </div>
          )}
        </section>

        {/* Agenda lateral */}
        <aside className="card card-lg agenda" aria-label="Agenda de actividades">
          <div className="card-head">
            <div>
              <span className="micro">Próximas</span>
              <h3 style={{ marginTop: 4 }}>Agenda</h3>
            </div>
            <span className="pill pill-grey">{agenda.length}</span>
          </div>

          {agenda.length === 0 ? (
            <StateBlock
              estado="empty"
              titulo="Agenda despejada"
              mensaje="No hay actividades próximas en este alcance."
              className="!py-8"
            />
          ) : (
            <div className="ag-list">
              {agenda.map((p) => {
                const d = parseIso(aIso(p.fechaInicio));
                const a = alcInfo(p.alcance);
                const est = ESTADO_PILL[p.estado] ?? ESTADO_PILL.BORRADOR;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="ag-item"
                    onClick={() => setDetalle(p)}
                  >
                    <span className="ag-date">
                      <b>{d.getDate()}</b>
                      <span>{MESES_C[d.getMonth()]}</span>
                    </span>
                    <span className="ag-body">
                      <h4>{p.titulo}</h4>
                      <span className="ag-meta">
                        <span className="ag-scope" style={{ color: a.color }}>
                          <i style={{ background: a.color }} aria-hidden="true" />
                          {a.label}
                        </span>
                      </span>
                      <span className={`pill ${est.cls}`} style={{ marginTop: 7 }}>
                        <i aria-hidden="true" />
                        {est.txt}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {/* ── Diálogo: nueva planificación ─────────────────────────────── */}
      <Dialog
        open={dialogoNuevo}
        onClose={() => !enviando && setDialogoNuevo(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up',
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle className="text-xl font-black text-primary px-8 pt-8">
            Nueva planificación
          </DialogTitle>
          <DialogContent className="px-8 space-y-4">
            <div className="field !mb-0">
              <label className="micro" htmlFor="cal-titulo">
                Título de la actividad<span className="req">*</span>
              </label>
              <input
                id="cal-titulo"
                className="inp"
                placeholder="Ej: Campamento de otoño"
                aria-invalid={errors.titulo ? true : undefined}
                {...register('titulo')}
              />
              {errors.titulo && <span className="field-err">{errors.titulo.message}</span>}
            </div>

            {mostrarSelect ? (
              <div className="field !mb-0">
                <label className="micro" htmlFor="cal-alcance">
                  Ámbito de publicación
                </label>
                <select
                  id="cal-alcance"
                  className="inp"
                  disabled={!esAdmin}
                  {...register('alcance')}
                >
                  {ALCANCES.map((a) => (
                    <option key={a.id} value={a.id} disabled={!puedeCrearEn(a.id)}>
                      {a.label}
                      {puedeCrearEn(a.id) ? '' : ' (solo lectura)'}
                    </option>
                  ))}
                </select>
                <span className="hint">
                  {esAdmin
                    ? 'Los planes de cada nivel se publican hacia abajo en la jerarquía.'
                    : 'Solo podés publicar en tu propio ámbito jerárquico.'}
                </span>
              </div>
            ) : (
              <div className="field !mb-0">
                <span className="micro">Ámbito de publicación</span>
                <p className="hint" style={{ marginTop: 6 }}>
                  Se publicará en tu ámbito jerárquico.
                </p>
              </div>
            )}

            <div className="form-grid">
              <div className="field !mb-0">
                <label className="micro" htmlFor="cal-desde">
                  Desde<span className="req">*</span>
                </label>
                <input
                  id="cal-desde"
                  type="date"
                  className="inp"
                  aria-invalid={errors.fechaInicio ? true : undefined}
                  {...register('fechaInicio')}
                />
                {errors.fechaInicio && <span className="field-err">{errors.fechaInicio.message}</span>}
              </div>
              <div className="field !mb-0">
                <label className="micro" htmlFor="cal-hasta">
                  Hasta<span className="req">*</span>
                </label>
                <input
                  id="cal-hasta"
                  type="date"
                  className="inp"
                  aria-invalid={errors.fechaFin ? true : undefined}
                  {...register('fechaFin')}
                />
                {errors.fechaFin && <span className="field-err">{errors.fechaFin.message}</span>}
              </div>
            </div>

            <div className="field !mb-0">
              <label className="micro" htmlFor="cal-desc">
                Descripción
              </label>
              <textarea
                id="cal-desc"
                className="inp"
                rows={3}
                placeholder="Detalles, requisitos de equipaje, horarios…"
                {...register('descripcion')}
              />
              {errors.descripcion && <span className="field-err">{errors.descripcion.message}</span>}
            </div>
          </DialogContent>
          <DialogActions className="px-8 pb-8">
            <Button onClick={() => setDialogoNuevo(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar planificación'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Diálogo: detalle de la planificación ─────────────────────── */}
      <Dialog
        open={!!detalle}
        onClose={() => setDetalle(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl' }}
      >
        {detalle && (
          <>
            <DialogTitle className="text-xl font-black text-primary px-8 pt-8">
              {detalle.titulo}
            </DialogTitle>
            <DialogContent className="px-8 space-y-4">
              <div className="flex gap-2 flex-wrap pt-1">
                <span className={`pill ${(ESTADO_PILL[detalle.estado] ?? ESTADO_PILL.BORRADOR).cls}`}>
                  <i aria-hidden="true" />
                  {(ESTADO_PILL[detalle.estado] ?? ESTADO_PILL.BORRADOR).txt}
                </span>
                <span className="pill pill-blue">
                  <i aria-hidden="true" />
                  {alcInfo(detalle.alcance).label}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="micro">Fechas</dt>
                  <dd className="text-sm font-bold mt-1">{rangoFechas(detalle)}</dd>
                </div>
                <div>
                  <dt className="micro">Actividades</dt>
                  <dd className="text-sm font-bold mt-1">{detalle._count?.Actividades ?? 0}</dd>
                </div>
                <div>
                  <dt className="micro">Ámbito</dt>
                  <dd className="text-sm font-bold mt-1">{alcInfo(detalle.alcance).label}</dd>
                </div>
                <div>
                  <dt className="micro">Publicado</dt>
                  <dd className="text-sm font-bold mt-1">
                    {detalle.createdAt
                      ? `${String(parseIso(aIso(detalle.createdAt)).getDate()).padStart(2, '0')} ${
                          MESES_C[parseIso(aIso(detalle.createdAt)).getMonth()]
                        } ${parseIso(aIso(detalle.createdAt)).getFullYear()}`
                      : '—'}
                  </dd>
                </div>
              </dl>
              <div>
                <p className="micro mb-1.5">Descripción</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {detalle.descripcion || 'Sin descripción.'}
                </p>
              </div>
            </DialogContent>
            <DialogActions className="px-8 pb-8">
              <Button onClick={() => setDetalle(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold ${
            snack?.tipo === 'success'
              ? 'bg-success-container text-on-success-container'
              : 'bg-error-container text-on-error-container'
          }`}
        >
          {snack?.tipo === 'success' ? (
            <CheckCircle sx={{ fontSize: 16 }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 16 }} />
          )}
          {snack?.texto}
        </div>
      </Snackbar>
    </div>
  );
};
