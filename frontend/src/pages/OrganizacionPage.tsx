import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowBack, ArrowForward, Hub } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { miembrosApi, organizacionApi } from '../api';
import { Hero, HeroChip, StateBlock } from '../components/ui';
import {
  ETIQUETA_TIPO,
  HIJOS_PERMITIDOS,
  NodoOrganizacion,
  TipoNodoOrganizacion,
} from '../types/organizacion';

type Nodo = NodoOrganizacion;

/** Siglas de nivel para las migas de pan (CN · DE · REG · DIS · GR). */
const SIGLA: Record<TipoNodoOrganizacion, string> = {
  CONSEJO_NACIONAL: 'CN',
  DIRECCION_EJECUTIVA: 'DE',
  REGION: 'REG',
  DISTRITO: 'DIS',
  GRUPO: 'GR',
};

const PLURAL: Record<TipoNodoOrganizacion, string> = {
  CONSEJO_NACIONAL: 'Consejos Nacionales',
  DIRECCION_EJECUTIVA: 'Direcciones Ejecutivas',
  REGION: 'Regiones',
  DISTRITO: 'Distritos',
  GRUPO: 'Grupos',
};

/** Alcance del usuario según el tipo de nodo desde el que navega. */
const ALCANCE: Record<TipoNodoOrganizacion, string> = {
  CONSEJO_NACIONAL: 'Nacional',
  DIRECCION_EJECUTIVA: 'Nacional',
  REGION: 'Región',
  DISTRITO: 'Distrito',
  GRUPO: 'Grupo',
};

const SUBTITULO: Record<string, string> = {
  Nacional: 'Listado completo de regiones, distritos y grupos del movimiento scout.',
  Región: 'Distritos y grupos bajo tu región. Lo publicado a nivel nacional llega hacia abajo.',
  Distrito: 'Grupos de tu distrito. Los planes de región y nacional llega hacia abajo.',
  Grupo: 'Tu grupo y sus unidades. Solo consulta: la publicación corresponde a niveles superiores.',
};

const COLOR_TIPO: Record<TipoNodoOrganizacion, string> = {
  CONSEJO_NACIONAL: 'var(--color-alc-grupo)',
  DIRECCION_EJECUTIVA: 'var(--color-alc-distrito)',
  REGION: 'var(--color-alc-region)',
  DISTRITO: 'var(--color-warning)',
  GRUPO: 'var(--color-success)',
};

interface Cuentas {
  distritos: number;
  grupos: number;
  unidades: number;
  miembros: number;
}

/** Par [valor, etiqueta] de una casilla de estadística. */
type FilaStat = [string | number, string];

/** Camino desde la raíz hasta `id` (o `null` si no existe). */
const buscarCamino = (nodos: Nodo[], id: string, camino: Nodo[] = []): Nodo[] | null => {
  for (const nodo of nodos) {
    const actual = [...camino, nodo];
    if (nodo.id === id) return actual;
    const encontrado = buscarCamino(nodo.hijos ?? [], id, actual);
    if (encontrado) return encontrado;
  }
  return null;
};

/**
 * Nodo inicial de quien no tiene ámbito asignado: el Consejo Nacional no
 * se lista (arranca en su Dirección Ejecutiva), como en la maqueta.
 */
const nodoInicial = (raiz: Nodo | null): Nodo | null => {
  if (!raiz) return null;
  const hijos = raiz.hijos ?? [];
  if (raiz.tipo === 'CONSEJO_NACIONAL' && hijos.length === 1 && hijos[0].tipo === 'DIRECCION_EJECUTIVA') {
    return hijos[0];
  }
  return raiz;
};

/** Tipo de hijo que permite continuar el drill-down desde `tipo`. */
const hijoTipoDe = (tipo: TipoNodoOrganizacion): TipoNodoOrganizacion | null =>
  (
    Object.entries(HIJOS_PERMITIDOS) as Array<[TipoNodoOrganizacion, TipoNodoOrganizacion | null]>
  ).find(([, padre]) => padre === tipo)?.[0] ?? null;

/** Contadores del subárbol: distritos, grupos, unidades y miembros. */
const contarSubarbol = (nodo: Nodo, porUnidad: Map<string, number>): Cuentas => {
  const cuentas: Cuentas = { distritos: 0, grupos: 0, unidades: 0, miembros: 0 };
  const recorrer = (n: Nodo) => {
    if (n.tipo === 'DISTRITO') cuentas.distritos += 1;
    if (n.tipo === 'GRUPO') cuentas.grupos += 1;
    for (const unidad of n.Unidades ?? []) {
      cuentas.unidades += 1;
      cuentas.miembros += porUnidad.get(unidad.id) ?? 0;
    }
    for (const hijo of n.hijos ?? []) recorrer(hijo);
  };
  recorrer(nodo);
  return cuentas;
};

/** Casillas de la tarjeta según el tipo de nodo (como en la maqueta). */
const statsDeNodo = (tipo: TipoNodoOrganizacion, c: Cuentas, miembrosOk: boolean): FilaStat[] => {
  const miembros: string | number = miembrosOk ? c.miembros : '—';
  if (tipo === 'REGION') return [[c.distritos, 'Distritos'], [c.grupos, 'Grupos'], [miembros, 'Miembros']];
  if (tipo === 'DISTRITO') return [[c.grupos, 'Grupos'], [c.unidades, 'Unidades'], [miembros, 'Miembros']];
  // "Sub-grupos" = descendientes: el propio grupo no cuenta (a diferencia
  // de la maqueta, que lo incluía y mostraba 1 en una hoja sin sub-grupos).
  return [[c.unidades, 'Unidades'], [miembros, 'Miembros'], [Math.max(0, c.grupos - 1), 'Sub-grupos']];
};

/**
 * Organización del Movimiento — drill-down jerárquico por rol (Fase 2).
 *
 * Cada usuario parte desde su nodo (`Usuario.nodoId`, via JWT) o desde la
 * raíz si no tiene ámbito asignado, y solo puede descender dentro de su
 * subárbol: las migas por encima de su alcance quedan inactivas. Es una
 * vista de consulta; la edición vive en Estructura Organizacional.
 */
export const OrganizacionPage = () => {
  const puedeVer = usePermission('organizacion:view');
  const { user } = useAuth();

  const [arbol, setArbol] = useState<Nodo[]>([]);
  const [miembrosPorUnidad, setMiembrosPorUnidad] = useState<Map<string, number> | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [nodoActualId, setNodoActualId] = useState<string | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    const [arbolRes, jovenesRes] = await Promise.allSettled([
      organizacionApi.getArbol(),
      miembrosApi.getAll(),
    ]);

    if (arbolRes.status === 'fulfilled') {
      setArbol(Array.isArray(arbolRes.value) ? (arbolRes.value as Nodo[]) : []);
      setEstado('listo');
    } else {
      setEstado('error');
    }

    // El conteo de miembros es complementario: si el rol no tiene
    // joven:view la página sigue funcionando y muestra "—" en esa cifra.
    if (jovenesRes.status === 'fulfilled' && Array.isArray(jovenesRes.value)) {
      const mapa = new Map<string, number>();
      for (const joven of jovenesRes.value as Array<{ unidadId?: string }>) {
        if (!joven.unidadId) continue;
        mapa.set(joven.unidadId, (mapa.get(joven.unidadId) ?? 0) + 1);
      }
      setMiembrosPorUnidad(mapa);
    } else {
      setMiembrosPorUnidad(null);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Nodo desde el que arranca este usuario: su ámbito o la raíz. */
  const base = useMemo<Nodo | null>(() => {
    if (user?.nodoId) {
      const camino = buscarCamino(arbol, user.nodoId);
      if (camino?.length) return camino[camino.length - 1];
    }
    return nodoInicial(arbol[0] ?? null);
  }, [arbol, user?.nodoId]);

  const baseId = base?.id ?? null;

  // Reinicia la navegación cuando cambia el ámbito del usuario.
  useEffect(() => {
    if (!baseId) return;
    setNodoActualId(baseId);
    setSeleccionadoId(baseId);
  }, [baseId]);

  const camino = useMemo(
    () => (nodoActualId ? buscarCamino(arbol, nodoActualId) : null),
    [arbol, nodoActualId],
  );
  const nodo = camino?.[camino.length - 1] ?? base;
  const indiceBase = baseId && camino ? camino.findIndex((n) => n.id === baseId) : -1;

  const hijos = useMemo(() => {
    if (!nodo) return [];
    if (nodo.hijos?.length) return nodo.hijos;
    // Un grupo sin subnodos se listan a sí mismo (única tarjeta).
    return nodo.tipo === 'GRUPO' ? [nodo] : [];
  }, [nodo]);

  const seleccionado = useMemo(() => {
    if (!seleccionadoId) return nodo;
    return buscarCamino(arbol, seleccionadoId)?.slice(-1)[0] ?? nodo;
  }, [arbol, seleccionadoId, nodo]);

  const cuentas = useMemo(
    () => (seleccionado ? contarSubarbol(seleccionado, miembrosPorUnidad ?? new Map()) : null),
    [seleccionado, miembrosPorUnidad],
  );
  const miembrosOk = miembrosPorUnidad !== null;

  const alcance = base ? ALCANCE[base.tipo] : null;
  const tituloListado = !hijos.length
    ? 'Sin subnodos'
    : hijos.length === 1
      ? `1 ${ETIQUETA_TIPO[hijos[0].tipo]}`
      : `${hijos.length} ${PLURAL[hijos[0].tipo]}`;

  const puedeSubir = !!camino && camino.length > 1 && (indiceBase < 0 || camino.length - 1 > indiceBase);

  const navegar = (id: string) => {
    setNodoActualId(id);
    setSeleccionadoId(id);
  };

  const subir = () => {
    if (puedeSubir && camino) navegar(camino[camino.length - 2].id);
  };

  const elegir = (hijo: Nodo) => {
    setSeleccionadoId(hijo.id);
    if (hijoTipoDe(hijo.tipo)) {
      setNodoActualId(hijo.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!puedeVer) {
    return (
      <div className="animate-fade-in-up pb-10">
        <StateBlock
          estado="error"
          titulo="Sin permiso"
          mensaje="No tenés permiso para ver la organización del movimiento."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up pb-10">
      <Hero
        variante="grad"
        chips={
          <>
            <HeroChip icono={<Hub />}>Jerarquía Scout</HeroChip>
            <HeroChip tono="gold">{base?.nombre ?? 'Movimiento Scout'}</HeroChip>
          </>
        }
        titulo="Organización del Movimiento"
        subtitulo={alcance ? SUBTITULO[alcance] : undefined}
        icono={<Hub />}
        kpi={{ etiqueta: 'Nodos visibles', valor: estado === 'listo' ? hijos.length : '—' }}
      />

      <div className="flex items-center justify-between gap-3.5 flex-wrap mb-4">
        <span className="scope-badge">
          <i aria-hidden="true" />
          Alcance: {alcance ?? '—'}
        </span>
      </div>

      {estado === 'cargando' && <StateBlock estado="loading" />}

      {estado === 'error' && (
        <StateBlock
          estado="error"
          mensaje="No pudimos cargar la estructura organizacional. Intenta de nuevo en unos segundos."
          accion={
            <button type="button" className="btn btn-soft btn-sm" onClick={() => void cargar()}>
              Reintentar
            </button>
          }
        />
      )}

      {estado === 'listo' && !base && (
        <StateBlock
          estado="empty"
          titulo="Sin estructura cargada"
          mensaje="Todavía no hay nodos organizacionales. Cargá la jerarquía desde Estructura Organizacional."
        />
      )}

      {estado === 'listo' && base && nodo && (
        <>
          <nav className="crumb-bar" aria-label="Ruta jerárquica">
            {camino?.map((n, i) => {
              const dentroAlcance = indiceBase < 0 || i >= indiceBase;
              const actual = i === camino.length - 1;
              return (
                <Fragment key={n.id}>
                  {i > 0 && (
                    <span className="crumb-sep" aria-hidden="true">
                      ›
                    </span>
                  )}
                  <button
                    type="button"
                    className={`crumb${actual ? ' on' : ''}`}
                    onClick={dentroAlcance ? () => navegar(n.id) : undefined}
                    disabled={!dentroAlcance}
                    aria-current={actual ? 'page' : undefined}
                    title={dentroAlcance ? ETIQUETA_TIPO[n.tipo] : 'Fuera de tu alcance'}
                  >
                    <span className="lvl">{SIGLA[n.tipo]}</span>
                    {n.nombre}
                  </button>
                </Fragment>
              );
            })}
          </nav>

          <div className="hier-head">
            <div>
              <span className="micro">Listado · {ETIQUETA_TIPO[nodo.tipo]}</span>
              <h2>{tituloListado}</h2>
            </div>
            <div className="pg-actions">
              {puedeSubir && (
                <button type="button" className="btn btn-soft btn-sm" onClick={subir}>
                  <ArrowBack />
                  Subir un nivel
                </button>
              )}
            </div>
          </div>

          {hijos.length === 0 ? (
            <StateBlock
              estado="empty"
              titulo="Sin nodos disponibles"
              mensaje="Este nivel todavía no tiene subnodos cargados. Si esperaba verlos, revisá la estructura en Estructura Organizacional o contactá al administrador."
            />
          ) : (
            <div className="hier-grid">
              {hijos.map((hijo) => {
                const color = COLOR_TIPO[hijo.tipo];
                const siguiente = hijoTipoDe(hijo.tipo);
                const cuentasHijo = contarSubarbol(hijo, miembrosPorUnidad ?? new Map());
                const estilo = {
                  '--col': color,
                  '--bgic': `color-mix(in srgb, ${color} 14%, transparent)`,
                  '--tint': `color-mix(in srgb, ${color} 9%, transparent)`,
                } as CSSProperties;

                return (
                  <button
                    key={hijo.id}
                    type="button"
                    className={`hcard${seleccionadoId === hijo.id ? ' on' : ''}`}
                    style={estilo}
                    onClick={() => elegir(hijo)}
                    aria-pressed={seleccionadoId === hijo.id}
                  >
                    <div className="hcard-top">
                      <div className="hcard-ic" aria-hidden="true">
                        <Hub />
                      </div>
                      <div className="min-w-0">
                        <div className="hcard-cod">{hijo.codigo}</div>
                        <h4>{hijo.nombre}</h4>
                        <div className="hcard-tipo">
                          {ETIQUETA_TIPO[hijo.tipo]}
                          {hijo.activo ? '' : ' · Inactivo'}
                        </div>
                      </div>
                    </div>

                    <div className="hcard-stats">
                      {statsDeNodo(hijo.tipo, cuentasHijo, miembrosOk).map(([valor, etiqueta]) => (
                        <div key={etiqueta} className="hstat">
                          <b>{valor}</b>
                          <span>{etiqueta}</span>
                        </div>
                      ))}
                    </div>

                    <div className="hcard-foot">
                      {siguiente ? (
                        <span className="hcard-enter">
                          Ver {PLURAL[siguiente].toLowerCase()}
                          <ArrowForward />
                        </span>
                      ) : (
                        <span className="hcard-enter" style={{ color: 'var(--color-outline)' }}>
                          Nivel final
                        </span>
                      )}
                      <span className={`pill ${hijo.activo ? 'pill-green' : 'pill-red'}`}>
                        <i />
                        {hijo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {seleccionado && cuentas && (
            <div className="card card-lg mt-[18px]">
              <div className="card-head">
                <h3>Resumen del nivel</h3>
                <span className="pill pill-blue">{ETIQUETA_TIPO[seleccionado.tipo]}</span>
              </div>
              <div className="stat-grid" style={{ marginBottom: 0 }}>
                <div className="stat-mini">
                  <b>{cuentas.distritos}</b>
                  <span>Distritos</span>
                </div>
                <div className="stat-mini">
                  <b>{cuentas.grupos}</b>
                  <span>Grupos</span>
                </div>
                <div className="stat-mini">
                  <b>{cuentas.unidades}</b>
                  <span>Unidades</span>
                </div>
                <div className="stat-mini">
                  <b>{miembrosOk ? cuentas.miembros : '—'}</b>
                  <span>Miembros</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
