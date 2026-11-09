import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowRight,
  Badge,
  CheckCircle,
  CreateNewFolder,
  Delete,
  DriveFileRenameOutline,
  Error as ErrorIcon,
  FolderOff,
  Groups,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { organizacionApi, unidadesApi, usuariosApi } from '../api';
import { PageHeader, StateBlock } from '../components/ui';
import {
  CargoAsignacion,
  ETIQUETA_TIPO,
  HIJOS_PERMITIDOS,
  NodoOrganizacion,
  TipoNodoOrganizacion,
  UnidadDelNodo,
  etiquetaCargo,
} from '../types/organizacion';
import { Role } from '../types/auth';

/** Roles que pueden editar la estructura y los cargos (además del permiso) */
const ROLES_EDITORES: Role[] = ['SYSTEM_ADMIN', 'NATIONAL_BOARD', 'NATIONAL_EXECUTIVE'];

/** Tipo de hijo que permite crear cada tipo de nodo */
const hijoPermitidoDe = (tipo: TipoNodoOrganizacion): TipoNodoOrganizacion | null => {
  const entrada = (Object.entries(HIJOS_PERMITIDOS) as Array<[TipoNodoOrganizacion, TipoNodoOrganizacion | null]>)
    .find(([, padre]) => padre === tipo);
  return entrada ? entrada[0] : null;
};

/** Clase de color del código de nodo — espejo de `.tn-c-*` de la maqueta */
const CLASE_TIPO: Record<TipoNodoOrganizacion, string> = {
  CONSEJO_NACIONAL: 'tn-c-consejo',
  DIRECCION_EJECUTIVA: 'tn-c-direccion',
  REGION: 'tn-c-region',
  DISTRITO: 'tn-c-distrito',
  GRUPO: 'tn-c-grupo',
};

interface Snack {
  tipo: 'success' | 'error';
  texto: string;
}

export const EstructuraPage = () => {
  const { user } = useAuth();
  const puedeVer = usePermission('organizacion:view');
  // Escritura: SYSTEM_ADMIN, NATIONAL_BOARD o NATIONAL_EXECUTIVE (además del permiso)
  const esEditor = (user?.roles ?? []).some((r) => ROLES_EDITORES.includes(r));
  const puedeEscribir = puedeVer && esEditor;

  const [arbol, setArbol] = useState<NodoOrganizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [seleccionado, setSeleccionado] = useState<NodoOrganizacion | null>(null);
  const [snack, setSnack] = useState<Snack | null>(null);

  const [dialogoCrear, setDialogoCrear] = useState(false);
  const [dialogoRenombrar, setDialogoRenombrar] = useState(false);
  const [dialogoEliminar, setDialogoEliminar] = useState(false);
  const [dialogoUnidades, setDialogoUnidades] = useState(false);
  const [dialogoCargo, setDialogoCargo] = useState(false);

  const [nombreNuevo, setNombreNuevo] = useState('');
  const [nombreEdit, setNombreEdit] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [unidades, setUnidades] = useState<UnidadDelNodo[]>([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(false);

  // ── Cargos del nodo seleccionado ───────────────────────────────────────
  const [cargos, setCargos] = useState<CargoAsignacion[]>([]);
  const [cargandoCargos, setCargandoCargos] = useState(false);
  const [opcionesCargo, setOpcionesCargo] = useState<string[]>([]);
  const [usuariosOpciones, setUsuariosOpciones] = useState<
    { id: string; nombre: string; apellido?: string | null; email: string }[]
  >([]);
  const [cargoSel, setCargoSel] = useState('');
  const [usuarioSel, setUsuarioSel] = useState('');
  const [cargandoDialogoCargo, setCargandoDialogoCargo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setError(null);
      const data = (await organizacionApi.getArbol()) as NodoOrganizacion[];
      setArbol(data);
    } catch {
      setError('No se pudo cargar la estructura organizacional.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (puedeVer) cargar();
    else setCargando(false);
  }, [puedeVer, cargar]);

  const notificar = (tipo: Snack['tipo'], texto: string) => setSnack({ tipo, texto });

  const toggleExpandir = (id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const raiz = useMemo(() => arbol[0] ?? null, [arbol]);

  /** Total de nodos del árbol — se muestra en la píldora de la cabecera. */
  const totalNodos = useMemo(() => {
    let total = 0;
    const contar = (lista: NodoOrganizacion[]) => {
      lista.forEach((n) => {
        total += 1;
        contar(n.hijos ?? []);
      });
    };
    contar(arbol);
    return total;
  }, [arbol]);

  // ── Crear ────────────────────────────────────────────────────────────────
  const abrirCrear = () => {
    setNombreNuevo('');
    setDialogoCrear(true);
  };

  const tipoACrear: TipoNodoOrganizacion | null = raiz
    ? seleccionado
      ? hijoPermitidoDe(seleccionado.tipo)
      : null
    : 'CONSEJO_NACIONAL';

  const padreParaCrear: string | undefined = raiz ? seleccionado?.id : undefined;

  const crear = async () => {
    if (!tipoACrear || !nombreNuevo.trim()) return;
    setEnviando(true);
    try {
      const nodo = await organizacionApi.createNodo({
        tipo: tipoACrear,
        nombre: nombreNuevo.trim(),
        ...(padreParaCrear ? { padreId: padreParaCrear } : {}),
      });
      setDialogoCrear(false);
      notificar('success', `Nodo creado: ${nodo.codigo} ${nodo.nombre}`);
      if (padreParaCrear) setExpandidos((prev) => new Set(prev).add(padreParaCrear));
      await cargar();
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      notificar(
        'error',
        Array.isArray(mensaje) ? mensaje.join(' · ') : mensaje || 'No se pudo crear el nodo.',
      );
    } finally {
      setEnviando(false);
    }
  };

  // ── Renombrar ───────────────────────────────────────────────────────────
  const abrirRenombrar = () => {
    if (!seleccionado) return;
    setNombreEdit(seleccionado.nombre);
    setDialogoRenombrar(true);
  };

  const renombrar = async () => {
    if (!seleccionado || !nombreEdit.trim()) return;
    setEnviando(true);
    try {
      await organizacionApi.updateNodo(seleccionado.id, { nombre: nombreEdit.trim() });
      setDialogoRenombrar(false);
      notificar('success', 'Nodo actualizado.');
      await cargar();
    } catch {
      notificar('error', 'No se pudo actualizar el nodo.');
    } finally {
      setEnviando(false);
    }
  };

  const alternarActivo = async () => {
    if (!seleccionado) return;
    try {
      await organizacionApi.updateNodo(seleccionado.id, { activo: !seleccionado.activo });
      notificar(
        'success',
        seleccionado.activo ? 'Nodo desactivado.' : 'Nodo reactivado.',
      );
      await cargar();
    } catch {
      notificar('error', 'No se pudo cambiar el estado del nodo.');
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────────────
  const eliminar = async () => {
    if (!seleccionado) return;
    setEnviando(true);
    try {
      await organizacionApi.deleteNodo(seleccionado.id);
      setDialogoEliminar(false);
      setSeleccionado(null);
      notificar('success', 'Nodo eliminado.');
      await cargar();
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDialogoEliminar(false);
      notificar('error', mensaje || 'No se pudo eliminar el nodo.');
    } finally {
      setEnviando(false);
    }
  };

  // ── Unidades del grupo ──────────────────────────────────────────────────
  const abrirUnidades = async () => {
    if (!seleccionado || seleccionado.tipo !== 'GRUPO') return;
    setDialogoUnidades(true);
    setCargandoUnidades(true);
    try {
      const lista = (await unidadesApi.getAll()) as UnidadDelNodo[];
      setUnidades(lista);
    } catch {
      notificar('error', 'No se pudieron cargar las unidades.');
      setDialogoUnidades(false);
    } finally {
      setCargandoUnidades(false);
    }
  };

  const asignarUnidad = async (unidadId: string) => {
    if (!seleccionado) return;
    try {
      await organizacionApi.asignarUnidad(unidadId, seleccionado.id);
      notificar('success', 'Unidad asignada al grupo.');
      const lista = (await unidadesApi.getAll()) as UnidadDelNodo[];
      setUnidades(lista);
      await cargar();
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notificar('error', mensaje || 'No se pudo asignar la unidad.');
    }
  };

  // ── Cargos ─────────────────────────────────────────────────────────────
  const seleccionadoId = seleccionado?.id ?? null;

  const recargarCargos = useCallback(async () => {
    if (!seleccionadoId) return;
    try {
      const lista = (await organizacionApi.getCargos(seleccionadoId)) as CargoAsignacion[];
      setCargos(lista);
    } catch {
      setCargos([]);
    }
  }, [seleccionadoId]);

  useEffect(() => {
    if (!seleccionadoId) {
      setCargos([]);
      return;
    }
    let vivo = true;
    setCargandoCargos(true);
    organizacionApi
      .getCargos(seleccionadoId)
      .then((lista) => vivo && setCargos(lista as CargoAsignacion[]))
      .catch(() => vivo && setCargos([]))
      .finally(() => vivo && setCargandoCargos(false));
    return () => {
      vivo = false;
    };
  }, [seleccionadoId]);

  const abrirDialogoCargo = async () => {
    if (!seleccionado) return;
    setDialogoCargo(true);
    setCargandoDialogoCargo(true);
    setCargoSel('');
    setUsuarioSel('');
    try {
      const [disponibles, usuarios] = await Promise.all([
        organizacionApi.getCargosPermitidos(seleccionado.tipo),
        usuariosApi.getAll(),
      ]);
      setOpcionesCargo(disponibles as string[]);
      setUsuariosOpciones(
        usuarios as { id: string; nombre: string; apellido?: string | null; email: string }[],
      );
    } catch {
      notificar('error', 'No se pudieron cargar los datos para asignar el cargo.');
      setDialogoCargo(false);
    } finally {
      setCargandoDialogoCargo(false);
    }
  };

  const asignarCargo = async () => {
    if (!seleccionado || !cargoSel || !usuarioSel) return;
    setEnviando(true);
    try {
      await organizacionApi.createCargo(seleccionado.id, {
        usuarioId: usuarioSel,
        cargo: cargoSel,
      });
      setDialogoCargo(false);
      notificar('success', 'Cargo asignado.');
      await recargarCargos();
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      notificar(
        'error',
        Array.isArray(mensaje) ? mensaje.join(' · ') : mensaje || 'No se pudo asignar el cargo.',
      );
    } finally {
      setEnviando(false);
    }
  };

  const cerrarCargo = async (id: string) => {
    try {
      await organizacionApi.updateCargo(id, { hasta: new Date().toISOString(), activo: false });
      notificar('success', 'Cargo cerrado.');
      await recargarCargos();
    } catch {
      notificar('error', 'No se pudo cerrar el cargo.');
    }
  };

  const eliminarCargo = async (id: string) => {
    try {
      await organizacionApi.deleteCargo(id);
      notificar('success', 'Cargo eliminado.');
      await recargarCargos();
    } catch {
      notificar('error', 'No se pudo eliminar el cargo.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const renderNodo = (nodo: NodoOrganizacion, profundidad: number) => {
    const expandido = expandidos.has(nodo.id);
    const activo = seleccionado?.id === nodo.id;
    const tieneHijos = (nodo.hijos?.length ?? 0) > 0;
    const tieneUnidades = (nodo.Unidades?.length ?? 0) > 0;
    const desplegable = tieneHijos || (tieneUnidades && profundidad >= 4);

    const alternar = () => {
      setSeleccionado(nodo);
      if (desplegable) toggleExpandir(nodo.id);
    };

    return (
      <div key={nodo.id} className="tnode">
        <button
          type="button"
          className={`tnode-btn${activo ? ' on' : ''}`}
          aria-expanded={expandido}
          onClick={alternar}
        >
          <span
            className={`tw${expandido ? ' open' : ''}${desplegable ? '' : ' leaf'}`}
            aria-hidden="true"
          >
            {desplegable && <ArrowRight />}
          </span>

          <span className={`tnode-cod ${CLASE_TIPO[nodo.tipo]}`}>{nodo.codigo}</span>

          <span className={`tnode-nm${nodo.activo ? '' : ' off'}`}>{nodo.nombre}</span>

          <span className="tnode-tipo">{ETIQUETA_TIPO[nodo.tipo]}</span>

          {nodo.tipo === 'GRUPO' && tieneUnidades && (
            <span className="tnode-tipo" style={{ color: 'var(--color-primary)' }}>
              {nodo.Unidades!.length} und.
            </span>
          )}

          {!nodo.activo && (
            <span className="pill pill-red">
              <i aria-hidden="true" />
              Inactivo
            </span>
          )}
        </button>

        {expandido && tieneHijos && (
          <div className="tnode-hijos">
            {nodo.hijos!.map((hijo) => renderNodo(hijo, profundidad + 1))}
          </div>
        )}

        {expandido && profundidad >= 4 && tieneUnidades && (
          <div className="tnode-hijos">
            {nodo.Unidades!.map((u) => (
              <div key={u.id} className="np-li">
                <span className="dot" style={{ background: 'var(--color-success)' }} aria-hidden="true" />
                <span className="nm">{u.nombre}</span>
                <span className="mt">{u.tipo ?? ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!puedeVer) {
    return (
      <div className="animate-fade-in-up pb-10">
        <StateBlock
          estado="error"
          titulo="Sin permiso"
          mensaje="No tenés permiso para ver la estructura organizacional."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up pb-10">
      <PageHeader
        micro={
          <span className="tb-crumb">
            <span className="micro">Administración</span>
            <span className="micro">/</span>
            <span className="micro">Estructura</span>
          </span>
        }
        titulo="Estructura Organizacional"
        subtitulo="Consejo Nacional → Dirección Ejecutiva → Regiones → Distritos → Grupos"
        acciones={
          puedeEscribir && (
            <button
              type="button"
              onClick={abrirCrear}
              disabled={!tipoACrear}
              className="btn btn-primary btn-sm"
              title={tipoACrear ? `Crear ${ETIQUETA_TIPO[tipoACrear]}` : 'Seleccioná un nodo para crear su siguiente nivel'}
            >
              <CreateNewFolder />
              {raiz
                ? seleccionado && tipoACrear
                  ? `Nuevo ${ETIQUETA_TIPO[tipoACrear]}`
                  : 'Nuevo nodo'
                : 'Crear Consejo Nacional'}
            </button>
          )
        }
      />

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="dash-grid">
        {/* Árbol */}
        <div className="card card-lg">
          <div className="card-head">
            <h3>Árbol jerárquico</h3>
            <span className="pill pill-grey">{totalNodos} nodos</span>
          </div>

          {cargando ? (
            <StateBlock estado="loading" filas={5} />
          ) : arbol.length === 0 ? (
            <StateBlock
              estado="empty"
              titulo="Sin estructura"
              mensaje="Creá el Consejo Nacional para comenzar."
              accion={
                puedeEscribir && (
                  <button type="button" className="btn btn-primary btn-sm mt-4" onClick={abrirCrear}>
                    <CreateNewFolder />
                    Crear Consejo Nacional
                  </button>
                )
              }
            />
          ) : (
            <div className="tree">{arbol.map((n) => renderNodo(n, 0))}</div>
          )}
        </div>

        {/* Detalle del nodo seleccionado */}
        <div className="node-panel">
          <div className="card card-lg">
            <div className="card-head">
              <h3>Nodo seleccionado</h3>
            </div>

            {!seleccionado ? (
              <StateBlock
                estado="empty"
                titulo="Sin selección"
                mensaje="Seleccioná un nodo del árbol para ver sus detalles."
              />
            ) : (
              <>
                <div className="np-head">
                  <span className="micro">{seleccionado.codigo}</span>
                  <h4>{seleccionado.nombre}</h4>
                  <div className="np-meta">
                    <span>{ETIQUETA_TIPO[seleccionado.tipo]}</span>
                    <span>Nivel {seleccionado.nivel}</span>
                    <span>{seleccionado.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>

                {(seleccionado.Unidades?.length ?? 0) > 0 && (
                  <div className="np-sec">
                    <span className="micro">Unidades ({seleccionado.Unidades!.length})</span>
                    {seleccionado.Unidades!.map((u) => (
                      <div key={u.id} className="np-li">
                        <span
                          className="dot"
                          style={{ background: 'var(--color-success)' }}
                          aria-hidden="true"
                        />
                        <span className="nm">{u.nombre}</span>
                        <span className="mt">{u.tipo ?? ''}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cargos del nodo */}
                <div className="np-sec">
                  <span className="micro">Cargos</span>
                  {cargandoCargos ? (
                    <p className="text-xs font-bold text-outline">Cargando cargos…</p>
                  ) : cargos.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-outline)' }}>
                      Sin cargos asignados.
                    </p>
                  ) : (
                    cargos.map((c) => (
                      <div key={c.id} className="np-cargo">
                        <div className="r">{etiquetaCargo(c.cargo)}</div>
                        <div className="p">
                          <span>
                            {c.Usuario.nombre} {c.Usuario.apellido ?? ''}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <em className={c.activo ? undefined : 'line-through opacity-60'}>
                              {c.activo ? 'Vigente' : 'Cerrado'}
                            </em>
                            {puedeEscribir && c.activo && (
                              <button
                                type="button"
                                onClick={() => cerrarCargo(c.id)}
                                className="px-2 py-1 rounded-lg bg-surface-container-highest text-[8px] font-black uppercase tracking-widest text-secondary"
                                title="Cerrar cargo (hoy)"
                              >
                                Cerrar
                              </button>
                            )}
                            {puedeEscribir && (
                              <button
                                type="button"
                                onClick={() => eliminarCargo(c.id)}
                                className="px-2 py-1 rounded-lg bg-error/10 text-[8px] font-black uppercase tracking-widest text-error"
                                title="Eliminar asignación"
                              >
                                Quitar
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {puedeEscribir && (
                  <div className="form-actions">
                    <button type="button" onClick={abrirRenombrar} className="btn btn-ghost btn-sm">
                      <DriveFileRenameOutline />
                      Renombrar
                    </button>
                    <button type="button" onClick={alternarActivo} className="btn btn-soft btn-sm">
                      {seleccionado.activo ? <FolderOff /> : <CheckCircle />}
                      {seleccionado.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                    <button type="button" onClick={abrirDialogoCargo} className="btn btn-soft btn-sm">
                      <Badge />
                      Asignar cargo
                    </button>
                    {seleccionado.tipo === 'GRUPO' && (
                      <button type="button" onClick={abrirUnidades} className="btn btn-soft btn-sm">
                        <Groups />
                        Unidades
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDialogoEliminar(true)}
                      className="btn btn-danger btn-sm"
                    >
                      <Delete />
                      Eliminar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo: crear nodo */}
      <Dialog open={dialogoCrear} onClose={() => !enviando && setDialogoCrear(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-primary">
          {tipoACrear ? `Crear ${ETIQUETA_TIPO[tipoACrear]}` : 'Crear nodo'}
        </DialogTitle>
        <DialogContent dividers>
          <div className="space-y-4 pt-2">
            {seleccionado && (
              <Typography className="text-[10px] font-bold text-outline uppercase tracking-widest">
                Bajo: {seleccionado.codigo} — {seleccionado.nombre}
              </Typography>
            )}
            <TextField
              label="Nombre del nodo"
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoCrear(false)} disabled={enviando}>Cancelar</Button>
          <Button onClick={crear} disabled={enviando || !nombreNuevo.trim()} variant="contained">
            {enviando ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: renombrar */}
      <Dialog open={dialogoRenombrar} onClose={() => !enviando && setDialogoRenombrar(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-primary">
          Renombrar nodo
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Nombre"
            value={nombreEdit}
            onChange={(e) => setNombreEdit(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            className="pt-2"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoRenombrar(false)} disabled={enviando}>Cancelar</Button>
          <Button onClick={renombrar} disabled={enviando || !nombreEdit.trim()} variant="contained">
            {enviando ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: eliminar */}
      <Dialog open={dialogoEliminar} onClose={() => !enviando && setDialogoEliminar(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-error flex items-center gap-2">
          <Delete sx={{ fontSize: 16 }} /> Eliminar nodo
        </DialogTitle>
        <DialogContent dividers>
          <Typography className="text-sm">
            Se eliminará <strong>{seleccionado?.codigo} — {seleccionado?.nombre}</strong>.
            No se puede eliminar si tiene nodos hijos o unidades asignadas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoEliminar(false)} disabled={enviando}>Cancelar</Button>
          <Button onClick={eliminar} disabled={enviando} color="error" variant="contained">
            {enviando ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: unidades del grupo */}
      <Dialog open={dialogoUnidades} onClose={() => setDialogoUnidades(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-primary flex items-center gap-2">
          <Groups sx={{ fontSize: 16 }} /> Unidades — {seleccionado?.nombre}
        </DialogTitle>
        <DialogContent dividers>
          {cargandoUnidades ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {unidades.map((u) => {
                const enEsteGrupo = u.grupoId === seleccionado?.id;
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-high"
                  >
                    <div>
                      <p className="text-sm font-bold text-on-surface">{u.nombre}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-outline">{u.tipo ?? '—'}</p>
                    </div>
                    <button
                      onClick={() => asignarUnidad(u.id)}
                      disabled={enEsteGrupo}
                      className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        enEsteGrupo
                          ? 'bg-success/15 text-success'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {enEsteGrupo ? 'Asignada' : 'Asignar'}
                    </button>
                  </div>
                );
              })}
              {unidades.length === 0 && (
                <p className="text-xs font-bold text-outline text-center py-4">Sin unidades registradas.</p>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoUnidades(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: asignar cargo */}
      <Dialog open={dialogoCargo} onClose={() => !enviando && setDialogoCargo(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-black uppercase tracking-widest text-[12px] text-primary flex items-center gap-2">
          <Badge sx={{ fontSize: 16 }} /> Asignar cargo — {seleccionado?.codigo}
        </DialogTitle>
        <DialogContent dividers>
          {cargandoDialogoCargo ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <TextField
                label="Cargo"
                value={cargoSel}
                onChange={(e) => setCargoSel(e.target.value)}
                select
                fullWidth
                size="small"
                helperText={`Cargos válidos para ${seleccionado ? ETIQUETA_TIPO[seleccionado.tipo] : ''}`}
              >
                {opcionesCargo.map((c) => (
                  <MenuItem key={c} value={c}>
                    {etiquetaCargo(c)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Persona"
                value={usuarioSel}
                onChange={(e) => setUsuarioSel(e.target.value)}
                select
                fullWidth
                size="small"
                helperText="Usuarios con cuenta en el sistema"
              >
                {usuariosOpciones.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.nombre} {u.apellido ?? ''} — {u.email}
                  </MenuItem>
                ))}
              </TextField>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoCargo(false)} disabled={enviando}>Cancelar</Button>
          <Button
            onClick={asignarCargo}
            disabled={enviando || cargandoDialogoCargo || !cargoSel || !usuarioSel}
            variant="contained"
          >
            {enviando ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold ${
            snack?.tipo === 'success' ? 'bg-success text-on-primary' : 'bg-error text-on-error'
          }`}
        >
          {snack?.tipo === 'success' ? <CheckCircle sx={{ fontSize: 16 }} /> : <ErrorIcon sx={{ fontSize: 16 }} />}
          {snack?.texto}
        </div>
      </Snackbar>
    </div>
  );
};
