import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add, Edit, Delete, Search, Shield } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usuariosApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import { User } from '../types/auth';
import { PageHeader, DataTableShell, PieTabla, StateBlock, Pill } from '../components/ui';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres'),
});
type UserFormData = z.infer<typeof userSchema>;

export const UsuariosPage = () => {
  const canView = usePermission('user:view');
  const canCreate = usePermission('user:create');
  const canUpdate = usePermission('user:update');
  const canDelete = usePermission('user:delete');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(15);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosApi.getAll();
      setUsuarios(data);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canView) fetchUsuarios(); }, [canView]);

  const handleOpenDialog = (usuario?: User) => {
    if (usuario) {
      setEditingId(usuario.id);
      reset({ email: usuario.email, nombre: usuario.nombre, apellido: usuario.apellido || '', password: '' });
    } else {
      setEditingId(null);
      reset({ email: '', password: '', nombre: '', apellido: '' });
    }
    setOpenDialog(true);
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingId) {
        const payload = data.password ? data : { email: data.email, nombre: data.nombre, apellido: data.apellido };
        await usuariosApi.update(editingId, payload);
      } else {
        await usuariosApi.create(data);
      }
      setOpenDialog(false);
      setEditingId(null);
      reset();
      fetchUsuarios();
    } catch {
      setError('Error al guardar usuario');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await usuariosApi.delete(id);
      setDeleteConfirm(null);
      fetchUsuarios();
    } catch {
      setError('Error al eliminar');
    }
  };

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.apellido?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Reinicia la paginación al buscar.
  useEffect(() => {
    setPagina(1);
  }, [search]);

  const desde = (pagina - 1) * porPagina;
  const visibles = filtrados.slice(desde, desde + porPagina);

  const sinUsuarios = usuarios.length === 0 && !loading;

  if (!canView) {
    return (
      <div className="p-8 glass-panel border border-error/20 rounded-2xl flex flex-col items-center gap-4 text-center">
        <Shield className="text-error text-5xl opacity-20" fontSize="large" />
        <div>
          <h3 className="text-xl font-black text-error">Acceso Denegado</h3>
          <p className="text-sm font-medium text-outline">Se requiere autorización jerárquica para ver el directorio de agentes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Page Header */}
      <PageHeader
        micro="Administración / Usuarios"
        titulo="Directorio de Agentes"
        subtitulo={`${usuarios.length} Entidades Registradas`}
        acciones={
          canCreate && (
            <button type="button" className="btn btn-primary" onClick={() => handleOpenDialog()}>
              <Add />
              <span>Asignar Nuevo Agente</span>
            </button>
          )
        }
      />

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center animate-fade-in" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs uppercase tracking-widest px-2 hover:underline">Cerrar</button>
        </div>
      )}

      {/* Tabla principal */}
      <DataTableShell
        herramientas={
          <>
            <div className="tbl-titles">
              <span className="micro">Listado Maestro</span>
              <h3>Base de Datos — Agentes</h3>
            </div>
            <div className="tbl-tools-l flex-none justify-end">
              <label className="tbl-search">
                <Search />
                <input
                  type="search"
                  placeholder="Buscar usuario..."
                  aria-label="Buscar usuario"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
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
            coleccion="entidades"
          />
        }
      >
        {loading ? (
          <div className="p-4">
            <StateBlock estado="loading" filas={6} />
          </div>
        ) : sinUsuarios ? (
          <StateBlock
            estado="empty"
            titulo="Sin usuarios registrados"
            mensaje="No hay usuarios registrados. ¡Sé el primero en inscribir un agente!"
            accion={
              canCreate && (
                <button type="button" className="btn btn-primary btn-sm mt-1" onClick={() => handleOpenDialog()}>
                  <Add />
                  <span>Inscribir Primer Agente</span>
                </button>
              )
            }
          />
        ) : filtrados.length === 0 ? (
          <StateBlock estado="empty" titulo="Sin resultados" mensaje="Ningún agente coincide con la búsqueda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="dt">
              <caption>Listado de usuarios del sistema</caption>
              <thead>
                <tr>
                  <th scope="col">Identidad del Agente</th>
                  <th scope="col">Privilegios / Roles</th>
                  <th scope="col">Estado</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((u) => {
                  const roles = u.roles ?? [];
                  const visibles2 = roles.slice(0, 2);
                  const extra = roles.length - visibles2.length;
                  return (
                    <tr key={u.id}>
                      <td data-l="Identidad">
                        <div className="cell-id">
                          <span className="av-sq alt" aria-hidden="true">
                            {u.nombre.charAt(0)}
                            {u.apellido?.charAt(0) || ''}
                          </span>
                          <span>
                            <span className="nm">{u.nombre} {u.apellido}</span>
                            <span className="sub">{u.email}</span>
                          </span>
                        </div>
                      </td>
                      <td data-l="Roles">
                        <div className="chip-row">
                          {visibles2.map((r) => (
                            <span key={r} className="chip chip-mono">{r.replace(/_/g, ' ')}</span>
                          ))}
                          {extra > 0 && <span className="chip-more">+{extra}</span>}
                        </div>
                      </td>
                      <td data-l="Estado">
                        <Pill variante={u.activo ? 'green' : 'grey'} dot>
                          {u.activo ? 'Operativo' : 'Inactivo'}
                        </Pill>
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
            {editingId ? 'Modificar Credenciales' : 'Inscribir Nuevo Agente'}
          </DialogTitle>
          <DialogContent className="px-8 space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Nombre</label>
                <input {...register('nombre')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" />
                {errors.nombre && <p className="text-[10px] text-error font-bold px-1">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Apellido</label>
                <input {...register('apellido')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" />
                {errors.apellido && <p className="text-[10px] text-error font-bold px-1">{errors.apellido.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Correo de Enlace</label>
              <input {...register('email')} type="email" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" />
              {errors.email && <p className="text-[10px] text-error font-bold px-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">
                {editingId ? 'Clave de Seguridad (Dejar vacío para mantener)' : 'Clave de Seguridad Inicial'}
              </label>
              <input {...register('password')} type="password" placeholder="••••••••" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" />
              {errors.password && <p className="text-[10px] text-error font-bold px-1">{errors.password.message}</p>}
            </div>
          </DialogContent>
          <DialogActions className="p-8 gap-4">
            <button type="button" onClick={() => { setOpenDialog(false); reset(); }} className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">
              Cancelar
            </button>
            <button type="submit" className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
              {editingId ? 'Actualizar Agente' : 'Confirmar Enlace'}
            </button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ className: 'rounded-2xl !bg-surface-container-lowest shadow-2xl' }}>
          <DialogTitle className="text-error font-black">Confirmar Eliminación</DialogTitle>
          <DialogContent>¿Estás seguro de que deseas eliminar permanentemente este registro de agente?</DialogContent>
          <DialogActions className="p-4">
             <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-outline">Abortar</button>
             <button onClick={() => handleDelete(deleteConfirm)} className="bg-error text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-error/20">Confirmar</button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};