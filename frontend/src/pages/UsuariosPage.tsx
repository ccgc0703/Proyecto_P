import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, PeopleAlt, Shield, FilterList } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usuariosApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import { User } from '../types/auth';

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

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

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

  const columns: GridColDef[] = [
    { 
      field: 'nombre', 
      headerName: 'Identidad del Agente', 
      flex: 1, 
      minWidth: 220,
      renderCell: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg sentinel-gradient flex items-center justify-center text-on-primary font-black text-[10px] shrink-0 shadow-sm">
            {p.row.nombre.charAt(0)}{p.row.apellido?.charAt(0) || ''}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-primary leading-tight">{p.row.nombre} {p.row.apellido}</span>
            <span className="text-[10px] font-medium text-outline truncate max-w-[140px]">{p.row.email}</span>
          </div>
        </div>
      )
    },
    {
      field: 'roles', headerName: 'Privilegios / Roles', width: 220,
      renderCell: (p: GridRenderCellParams) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {(p.value as string[])?.slice(0, 2).map((r: string) => (
            <span key={r} className="bg-primary/5 text-primary px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">
              {r.replace(/_/g, ' ')}
            </span>
          ))}
          {(p.value as string[])?.length > 2 && (
            <span className="text-[9px] font-bold text-outline">+{ (p.value as string[]).length - 2 }</span>
          )}
        </div>
      ),
    },
    {
      field: 'activo', headerName: 'Estado', width: 120,
      renderCell: (p) => (
        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${p.value ? 'bg-success/10 text-success' : 'bg-outline/10 text-outline'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.value ? 'bg-success' : 'bg-outline'}`} />
          {p.value ? 'Operativo' : 'Inactivo'}
        </div>
      ),
    },
    {
      field: 'actions', headerName: 'Acciones', width: 110, sortable: false,
      renderCell: (p) => (
        <div className="flex items-center gap-1">
          {canUpdate && (
            <button 
              onClick={() => handleOpenDialog(p.row)}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all"
            >
              <Edit fontSize="small" />
            </button>
          )}
          {canDelete && (
            <button 
              onClick={() => setDeleteConfirm(p.row.id)}
              className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-all"
            >
              <Delete fontSize="small" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filtered = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.apellido?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
            <PeopleAlt fontSize="medium" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-primary">Directorio de Agentes</h2>
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">{usuarios.length} Entidades Registradas</p>
          </div>
        </div>

        {canCreate && (
          <button 
            onClick={() => handleOpenDialog()}
            className="sentinel-gradient px-6 py-3 rounded-xl text-on-primary font-bold tracking-tight shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <Add fontSize="small" />
            <span>Asignar Nuevo Agente</span>
          </button>
        )}
      </header>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs uppercase tracking-widest px-2 hover:underline">Saber más</button>
        </div>
      )}

      {/* Control Bar */}
      <section className="bg-surface-container-low p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
            <Search fontSize="small" />
          </div>
          <input
            type="text"
            placeholder="Interrogando directorio de usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto px-2">
          <FilterList fontSize="small" className="text-outline/40" />
          <span className="text-[10px] font-black uppercase tracking-widest text-outline/40">Filtro Inteligente</span>
        </div>
      </section>

      {/* Table Container */}
      <div className="rounded-[2rem] shadow-sm overflow-hidden bg-surface-container-lowest">
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
          pageSizeOptions={[10, 15, 25, 50]}
          autoHeight
          disableRowSelectionOnClick
          disableColumnMenu
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'var(--color-surface-container-highest)',
              color: 'var(--color-outline)',
              textTransform: 'uppercase',
              fontSize: '10px',
              letterSpacing: '0.15em',
              fontWeight: '900',
              borderBottom: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: 'none',
              padding: '16px',
            },
            '& .MuiDataGrid-row:nth-of-type(odd)': {
              backgroundColor: 'var(--color-surface-container-low)',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'var(--color-surface-container-high) !important',
            }
          }}
        />
      </div>

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
