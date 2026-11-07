import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add, Edit, Delete, Search, Shield } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, unidadesApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import { ordenarPorUnidad } from '../hooks/useUnidad';
import { Unidad } from '../types/auth';
import { PageHeader, DataTableShell, PieTabla, StateBlock } from '../components/ui';

interface UnidadData {
  id: string;
  nombre: string;
  tipo: Unidad;
  adultoAcargo?: string;
  /** Adultos asignados a la unidad (lo que expone `GET /unidades`). */
  Usuarios?: Array<{ id: string; nombre: string; apellido?: string }>;
  createdAt: string;
}

/** Oficial al cargo: legacy `adultoAcargo` o el primer adulto de `Usuarios`. */
const oficialDe = (u: UnidadData): string => {
  if (u.adultoAcargo) return u.adultoAcargo;
  const a = u.Usuarios?.[0];
  return a ? `${a.nombre}${a.apellido ? ' ' + a.apellido : ''}` : '';
};

const unidadSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  tipo: z.enum(['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN']),
});
type UnidadFormData = z.infer<typeof unidadSchema>;

/** Color de acento por tipo — espejo de `UNIDAD_DOT` de la maqueta. */
const COLOR_TIPO: Record<string, string> = {
  MANADA: 'var(--color-primary)',
  TROPA: 'var(--color-secondary)',
  COMUNIDAD: 'var(--color-accent)',
  CLAN: 'var(--color-outline)',
};

export const UnidadesPage = () => {
  const canView = usePermission('unidad:view');
  const canCreate = usePermission('unidad:create');
  const canUpdate = usePermission('unidad:update');
  const canDelete = usePermission('unidad:delete');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UnidadFormData>({
    resolver: zodResolver(unidadSchema),
  });

  const [unidades, setUnidades] = useState<UnidadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(15);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      // `unidadesApi.getAll()` ya desenvuelve el envoltorio `{ success, data }`.
      setUnidades((await unidadesApi.getAll()) as UnidadData[]);
    } catch {
      setError('Error al cargar unidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canView) fetchUnidades(); }, [canView]);

  const handleOpenDialog = (u?: UnidadData) => {
    if (u) {
      setEditingId(u.id);
      reset({ nombre: u.nombre, tipo: u.tipo });
    } else {
      setEditingId(null);
      reset({ nombre: '', tipo: 'MANADA' });
    }
    setOpenDialog(true);
  };

  const onSubmit = async (data: UnidadFormData) => {
    try {
      if (editingId) {
        await api.patch(`/unidades/${editingId}`, data);
      } else {
        await api.post('/unidades', data);
      }
      setOpenDialog(false);
      setEditingId(null);
      reset();
      fetchUnidades();
    } catch {
      setError('Error al guardar unidad');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/unidades/${id}`);
      setDeleteConfirm(null);
      fetchUnidades();
    } catch {
      setError('Error al eliminar');
    }
  };

  const filtrados = ordenarPorUnidad(
    unidades.filter(
      (u) =>
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        String(u.tipo ?? '').toLowerCase().includes(search.toLowerCase()),
    ),
  );

  // Reinicia la paginación al buscar.
  useEffect(() => {
    setPagina(1);
  }, [search]);

  const desde = (pagina - 1) * porPagina;
  const visibles = filtrados.slice(desde, desde + porPagina);

  if (!canView) {
    return (
      <div className="p-8 glass-panel border border-error/20 rounded-2xl flex flex-col items-center gap-4 text-center">
        <Shield className="text-error text-5xl opacity-20" fontSize="large" />
        <div>
          <h3 className="text-xl font-black text-error">Acceso Restringido</h3>
          <p className="text-sm font-medium text-outline">Se requiere autorización nivel 2 para visualizar el despliegue de unidades.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Page Header */}
      <PageHeader
        micro="Administración / Unidades"
        titulo="Unidades de Campo"
        subtitulo={`${unidades.length} Estructuras Operativas`}
        acciones={
          canCreate && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => handleOpenDialog()}>
              <Add />
              <span>Crear Nueva Estructura</span>
            </button>
          )
        }
      />

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center animate-fade-in" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs uppercase tracking-widest px-2 hover:underline">Ignorar</button>
        </div>
      )}

      {/* Tabla principal */}
      <DataTableShell
        herramientas={
          <div className="tbl-tools-l justify-end">
            <label className="tbl-search">
              <Search />
              <input
                type="search"
                placeholder="Buscar por nombre o tipo..."
                aria-label="Buscar unidad"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
        }
        pie={
          <PieTabla
            total={filtrados.length}
            pagina={pagina}
            porPagina={porPagina}
            onPagina={setPagina}
            onPorPagina={(n) => {
              setPorPagina(n);
              setPagina(1);
            }}
            coleccion="unidades"
            sinSelector
          />
        }
      >
        {loading ? (
          <div className="p-4">
            <StateBlock estado="loading" filas={5} />
          </div>
        ) : filtrados.length === 0 ? (
          <StateBlock
            estado="empty"
            titulo="Sin unidades registradas"
            mensaje="No hay unidades registradas. ¡Sé el primero en crear una!"
            accion={
              canCreate && (
                <button type="button" className="btn btn-primary btn-sm mt-1" onClick={() => handleOpenDialog()}>
                  <Add />
                  <span>Crear Primera Unidad</span>
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="dt">
              <caption>Listado de unidades de campo</caption>
              <thead>
                <tr>
                  <th scope="col">Designación de Unidad</th>
                  <th scope="col">Tipo de Despliegue</th>
                  <th scope="col">Oficial al Cargo</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((u) => {
                  const color = COLOR_TIPO[u.tipo] ?? 'var(--color-outline)';
                  const oficial = oficialDe(u);
                  return (
                    <tr key={u.id}>
                      <td data-l="Unidad">
                        <div className="cell-id">
                          <span
                            className="av-sq"
                            aria-hidden="true"
                            style={{
                              background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 75%, transparent))`,
                            }}
                          >
                            {u.nombre.charAt(0)}
                          </span>
                          <span className="nm">{u.nombre}</span>
                        </div>
                      </td>
                      <td data-l="Tipo">
                        <span
                          className="chip"
                          style={{ boxShadow: `inset 3px 0 0 ${color}`, paddingLeft: 11 }}
                        >
                          <i
                            aria-hidden="true"
                            style={{ width: 6, height: 6, borderRadius: '50%', background: color }}
                          />
                          {u.tipo}
                        </span>
                      </td>
                      <td data-l="Oficial">
                        {oficial ? (
                          <div className="cell-id">
                            <span
                              className="av-sq alt"
                              aria-hidden="true"
                              style={{ width: 30, height: 30, fontSize: 10, borderRadius: 9 }}
                            >
                              {oficial
                                .split(' ')
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join('')}
                            </span>
                            <span className="nm" style={{ fontSize: 13 }}>
                              {oficial}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-outline)', fontStyle: 'italic' }}>
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td data-l="Acciones">
                        <div className="row-acts">
                          {canUpdate && (
                            <button
                              type="button"
                              className="act-btn"
                              aria-label={`Editar ${u.nombre}`}
                              title="Editar"
                              onClick={() => handleOpenDialog(u)}
                            >
                              <Edit />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="act-btn danger"
                              aria-label={`Eliminar ${u.nombre}`}
                              title="Eliminar"
                              onClick={() => setDeleteConfirm(u.id)}
                            >
                              <Delete />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataTableShell>

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); reset(); }} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle className="text-xl font-black text-primary px-8 pt-8">
            {editingId ? 'Modificar Estructura' : 'Asignar Nueva Unidad'}
          </DialogTitle>
          <DialogContent className="px-8 space-y-4">
            <div className="space-y-2 mt-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Nombre de la Unidad</label>
              <input {...register('nombre')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" placeholder="Ej: Manada Seeonee" />
              {errors.nombre && <p className="text-[10px] text-error font-bold px-1">{errors.nombre.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Nivel Táctico (Tipo)</label>
              <select {...register('tipo')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none">
                <option value="MANADA">🟢 Manada</option>
                <option value="TROPA">🟡 Tropa</option>
                <option value="COMUNIDAD">🟠 Comunidad</option>
                <option value="CLAN">🟣 Clan</option>
              </select>
              {errors.tipo && <p className="text-[10px] text-error font-bold px-1">{errors.tipo.message}</p>}
            </div>
          </DialogContent>
          <DialogActions className="p-8 gap-4">
            <button type="button" onClick={() => { setOpenDialog(false); reset(); }} className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">
              Cancelar
            </button>
            <button type="submit" className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
              {editingId ? 'Confirmar Cambios' : 'Desplegar Unidad'}
            </button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ className: 'rounded-2xl !bg-surface-container-lowest shadow-2xl' }}>
          <DialogTitle className="text-error font-black">Confirmar Eliminación</DialogTitle>
          <DialogContent>¿Estás seguro de que deseas eliminar permanentemente esta unidad?</DialogContent>
          <DialogActions className="p-4">
             <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-outline">Abortar</button>
             <button onClick={() => handleDelete(deleteConfirm)} className="bg-error text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-error/20">Confirmar</button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};