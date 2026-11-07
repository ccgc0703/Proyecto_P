import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add, Search, Groups2, Edit, Delete } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { miembrosApi, unidadesApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import { useUnidad, useCanViewAllUnidades, ordenarPorUnidad } from '../hooks/useUnidad';
import { Unidad } from '../types/auth';
import { UnidadEntity } from '../types/member';
import { PageHeader, DataTableShell, PieTabla, StateBlock } from '../components/ui';

interface Joven {
  id: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  cedula: string;
  genero: string;
  unidad: Unidad;
  activo: boolean;
  createdAt: string;
}

const jovenSchema = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  fechaNacimiento: z.string().min(1, 'Fecha requerida'),
  cedula: z.string().min(5, 'Cédula requerida'),
  genero: z.enum(['MASCULINO', 'FEMENINO']),
  unidad: z.enum(['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN']),
});
type JovenFormData = z.infer<typeof jovenSchema>;

export const MiembrosPage = () => {
  const canView = usePermission('joven:view');
  const canCreate = usePermission('joven:create');
  const canUpdate = usePermission('joven:update');
  const canDelete = usePermission('joven:delete');
  const unidadAsignada = useUnidad();
  const canViewAll = useCanViewAllUnidades();
  const navigate = useNavigate();

  const [jovenes, setJovenes] = useState<Joven[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState<string>('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(15);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unidades, setUnidades] = useState<UnidadEntity[]>([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<JovenFormData>({
    resolver: zodResolver(jovenSchema),
  });

  useEffect(() => {
    unidadesApi
      .getAll()
      .then((data) => setUnidades(ordenarPorUnidad(data as UnidadEntity[])))
      .catch(() => setUnidades([]));
  }, []);

  const fetchJovenes = useCallback(async () => {
    try {
      setLoading(true);
      const params = canViewAll ? undefined : (unidadAsignada || undefined);
      const data = await miembrosApi.getAll(params);
      const filas = (data as Array<Joven & { Unidad?: { nombre?: string } }>).map((j) => ({
        ...j,
        unidad: ((j.Unidad?.nombre ?? j.unidad ?? '') as string).toUpperCase() as Unidad,
      }));
      setJovenes(filas);
    } catch {
      setError('Error al cargar miembros');
    } finally {
      setLoading(false);
    }
  }, [canViewAll, unidadAsignada]);

  useEffect(() => {
    if (canView) fetchJovenes();
  }, [canView, fetchJovenes]);

  const handleOpenDialog = (joven?: Joven) => {
    if (joven) {
      setEditingId(joven.id);
      reset({ 
        nombres: joven.nombres, 
        apellidos: joven.apellidos, 
        fechaNacimiento: joven.fechaNacimiento, 
        cedula: joven.cedula,
        genero: joven.genero as 'MASCULINO' | 'FEMENINO',
        unidad: joven.unidad 
      });
    } else {
      setEditingId(null);
      reset({ 
        nombres: '', 
        apellidos: '', 
        fechaNacimiento: '', 
        cedula: '',
        genero: 'MASCULINO',
        unidad: unidadAsignada || 'MANADA' 
      });
    }
    setOpenDialog(true);
  };

  const construirPayload = (data: JovenFormData) => {
    const { unidad, ...resto } = data;
    const unidadId = unidades.find(
      (u) => (u.nombre ?? '').toUpperCase() === unidad,
    )?.id;
    return unidadId ? { ...resto, unidadId } : resto;
  };

  const rutaAltaUnidad = (unidad: string) => `/app/${unidad.toLowerCase()}/nuevo`;

  const iniciarAlta = () => {
    if (!canViewAll && unidadAsignada) {
      navigate({ to: rutaAltaUnidad(unidadAsignada) });
      return;
    }
    handleOpenDialog();
  };

  const continuarAlta = () => {
    const unidad = watch('unidad') || unidadAsignada;
    if (unidad) navigate({ to: rutaAltaUnidad(unidad) });
  };

  const onSubmit = async (data: JovenFormData) => {
    if (!editingId) return;
    try {
      await miembrosApi.update(editingId, construirPayload(data));
      setOpenDialog(false);
      setEditingId(null);
      reset();
      fetchJovenes();
    } catch {
      setError('Error al guardar miembro');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await miembrosApi.delete(id);
      setDeleteConfirm(null);
      fetchJovenes();
    } catch {
      setError('Error al eliminar');
    }
  };

  const filtrados = jovenes.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch =
      j.nombres.toLowerCase().includes(q) ||
      j.apellidos.toLowerCase().includes(q) ||
      j.cedula.toLowerCase().includes(q);
    const matchUnidad = !filtroUnidad || j.unidad === filtroUnidad;
    return matchSearch && matchUnidad;
  });

  // Reinicia la paginación al cambiar los filtros.
  useEffect(() => {
    setPagina(1);
  }, [search, filtroUnidad]);

  const desde = (pagina - 1) * porPagina;
  const visibles = filtrados.slice(desde, desde + porPagina);

  if (!canView) {
    return (
      <div className="p-8 glass-panel border border-error/20 rounded-2xl flex flex-col items-center gap-4 text-center">
        <Groups2 className="text-error text-5xl opacity-20" fontSize="large" />
        <div>
          <h3 className="text-xl font-black text-error border-b border-error/20 pb-2 mb-2 uppercase">Acceso Restringido</h3>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">No cuentas con las credenciales necesarias para este nodo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up pb-8">
      {/* Page Header */}
      <PageHeader
        micro="Administración / Miembros"
        titulo="Directorio de Miembros"
        subtitulo={`${jovenes.length} Registros Activos · Nodo Operativo`}
        acciones={
          canCreate && (
            <button type="button" className="btn btn-primary btn-sm" onClick={iniciarAlta}>
              <Add />
              <span>Nuevo Registro</span>
            </button>
          )
        }
      />

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs uppercase tracking-widest px-2 hover:underline">Cerrar</button>
        </div>
      )}

      {/* Tabla principal */}
      <DataTableShell
        herramientas={
          <>
            <div className="tbl-tools-l flex-none justify-end">
              <label className="tbl-search">
                <Search />
                <input
                  type="search"
                  placeholder="Nombre o cédula..."
                  aria-label="Buscar miembro"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {canViewAll && (
                <label className="rows-sel">
                  Unidad
                  <select
                    value={filtroUnidad}
                    onChange={(e) => setFiltroUnidad(e.target.value)}
                    aria-label="Filtrar por unidad"
                  >
                    <option value="">Todas</option>
                    <option value="MANADA">Manada</option>
                    <option value="TROPA">Tropa</option>
                    <option value="COMUNIDAD">Comunidad</option>
                    <option value="CLAN">Clan</option>
                  </select>
                </label>
              )}
            </div>
          </>
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
            coleccion="miembros"
          />
        }
      >
        {loading ? (
          <div className="p-4">
            <StateBlock estado="loading" filas={6} />
          </div>
        ) : filtrados.length === 0 ? (
          <StateBlock
            estado="empty"
            titulo="Sin resultados"
            mensaje="Ningún miembro coincide con la búsqueda o el filtro de unidad."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="dt">
              <caption>Listado de miembros registrados en el sistema</caption>
              <thead>
                <tr>
                  <th scope="col">Miembro / Identidad</th>
                  <th scope="col">Fecha Nacimiento</th>
                  <th scope="col">Unidad / Sección</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((j) => (
                  <tr key={j.id}>
                    <td data-l="Miembro">
                      <div className="cell-id">
                        <span className="av-sq" aria-hidden="true">
                          {j.nombres.charAt(0)}
                          {j.apellidos.charAt(0)}
                        </span>
                        <span>
                          <span className="nm">{j.nombres} {j.apellidos}</span>
                          <span className="sub">{j.cedula}</span>
                        </span>
                      </div>
                    </td>
                    <td data-l="Fec. Nacimiento">
                      {new Date(j.fechaNacimiento).toLocaleDateString('es', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td data-l="Unidad">
                      <span className="chip chip-mono">{j.unidad}</span>
                    </td>
                    <td data-l="Acciones">
                      <div className="row-acts">
                        {canUpdate && (
                          <button
                            type="button"
                            className="act-btn"
                            aria-label={`Editar ${j.nombres} ${j.apellidos}`}
                            title="Editar"
                            onClick={() => handleOpenDialog(j)}
                          >
                            <Edit />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="act-btn danger"
                            aria-label={`Eliminar ${j.nombres} ${j.apellidos}`}
                            title="Eliminar"
                            onClick={() => setDeleteConfirm(j.id)}
                          >
                            <Delete />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataTableShell>

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); reset(); }} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle className="text-xl font-black text-primary px-8 pt-8">
            {editingId ? 'Actualizar Archivo' : 'Registrar Miembro'}
          </DialogTitle>
          <DialogContent className="px-8 space-y-4">
            {!editingId && (
              <p className="mt-2 p-4 bg-surface-container-high rounded-xl text-[11px] font-bold text-outline">
                El alta completa (datos del joven y de su representante) se realiza en el formulario
                de la unidad que elijas.
              </p>
            )}
            {editingId && (
            <>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Nombre</label>
                <input {...register('nombres')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" />
                {errors.nombres && <p className="text-[10px] text-error font-bold px-1">{errors.nombres.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Apellido</label>
                <input {...register('apellidos')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" />
                {errors.apellidos && <p className="text-[10px] text-error font-bold px-1">{errors.apellidos.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Fecha de Nacimiento</label>
              <input {...register('fechaNacimiento')} type="date" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
              {errors.fechaNacimiento && <p className="text-[10px] text-error font-bold px-1">{errors.fechaNacimiento.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Cédula</label>
                <input {...register('cedula')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" />
                {errors.cedula && <p className="text-[10px] text-error font-bold px-1">{errors.cedula.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Género</label>
                <select {...register('genero')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none">
                  <option value="MASCULINO">MASCULINO</option>
                  <option value="FEMENINO">FEMENINO</option>
                </select>
                {errors.genero && <p className="text-[10px] text-error font-bold px-1">{errors.genero.message}</p>}
              </div>
            </div>
            </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Designación de Unidad</label>
              <select {...register('unidad')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none">
                {(canViewAll || unidadAsignada === 'MANADA') && <option value="MANADA">🟢 Manada</option>}
                {(canViewAll || unidadAsignada === 'TROPA') && <option value="TROPA">🟡 Tropa</option>}
                {(canViewAll || unidadAsignada === 'COMUNIDAD') && <option value="COMUNIDAD">🟠 Comunidad</option>}
                {(canViewAll || unidadAsignada === 'CLAN') && <option value="CLAN">🟣 Clan</option>}
              </select>
            </div>
          </DialogContent>
          <DialogActions className="p-8 gap-4">
            <button type="button" onClick={() => { setOpenDialog(false); reset(); }} className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">
              Abortar
            </button>
            <button
              type={editingId ? 'submit' : 'button'}
              onClick={editingId ? undefined : continuarAlta}
              className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            >
              {editingId ? 'Confirmar Cambios' : 'Continuar al alta'}
            </button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ className: 'rounded-2xl !bg-surface-container-lowest shadow-2xl' }}>
          <DialogTitle className="text-error font-black">Confirmar Eliminación</DialogTitle>
          <DialogContent>¿Estás seguro de que deseas eliminar permanentemente este registro de miembro?</DialogContent>
          <DialogActions className="p-4">
             <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-outline">Abortar</button>
             <button onClick={() => handleDelete(deleteConfirm)} className="bg-error text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-error/20">Confirmar</button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};
