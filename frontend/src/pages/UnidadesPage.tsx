import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add, Edit, Delete, Search, CabinOutlined, Shield, FilterList } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../api';
import { usePermission } from '../hooks/usePermission';
import { Unidad } from '../types/auth';

interface UnidadData {
  id: string;
  nombre: string;
  tipo: Unidad;
  adultoAcargo?: string;
  createdAt: string;
}

const unidadSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  tipo: z.enum(['MANADA', 'TROPA', 'CAMINANTES', 'CLAN']),
});
type UnidadFormData = z.infer<typeof unidadSchema>;

const TIPO_CONFIG: Record<string, { color: string; label: string; dot: string }> = {
  MANADA: { color: 'bg-primary/10 text-primary', label: 'Manada', dot: 'bg-primary' },
  TROPA: { color: 'bg-tertiary/10 text-primary', label: 'Tropa', dot: 'bg-tertiary' },
  CAMINANTES: { color: 'bg-accent/10 text-primary', label: 'Caminantes', dot: 'bg-accent' },
  CLAN: { color: 'bg-secondary/10 text-secondary', label: 'Clan', dot: 'bg-secondary' },
};

export const UnidadesPage = () => {
  const canView = usePermission('unidad:view');
  const canCreate = usePermission('unidad:create');
  const canUpdate = usePermission('unidad:update');
  const canDelete = usePermission('unidad:delete');

  const [unidades, setUnidades] = useState<UnidadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UnidadFormData>({
    resolver: zodResolver(unidadSchema),
  });

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const response = await api.get('/unidades');
      setUnidades(response.data);
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

  const columns: GridColDef[] = [
    { 
      field: 'nombre', 
      headerName: 'Designación de Unidad', 
      flex: 1, 
      minWidth: 200,
      renderCell: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg sentinel-gradient flex items-center justify-center text-on-primary font-black text-[10px] shrink-0 shadow-sm">
            {p.row.nombre.charAt(0)}
          </div>
          <span className="font-bold text-sm text-primary">{p.row.nombre}</span>
        </div>
      )
    },
    {
      field: 'tipo', headerName: 'Tipo de Despliegue', width: 160,
      renderCell: (p: GridRenderCellParams) => {
        const u = p.value as string;
        const cfg = TIPO_CONFIG[u];
        return (
          <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${cfg?.color || 'bg-outline/10 text-outline'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot || 'bg-outline'}`} />
            {cfg?.label || u}
          </div>
        );
      },
    },
    { 
      field: 'adultoAcargo', 
      headerName: 'Oficial al Cargo', 
      flex: 1,
      renderCell: (p) => <span className="text-xs font-bold text-outline uppercase tracking-tighter">{p.value || 'Sin asignar'}</span>
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

  const filtered = unidades.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.tipo.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-tertiary/10 rounded-2xl flex items-center justify-center text-primary">
            <CabinOutlined fontSize="medium" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-primary">Unidades de Campo</h2>
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">{unidades.length} Estructuras Operativas</p>
          </div>
        </div>

        {canCreate && (
          <button 
            onClick={() => handleOpenDialog()}
            className="sentinel-gradient px-6 py-3 rounded-xl text-on-primary font-bold tracking-tight shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <Add fontSize="small" />
            <span>Crear Nueva Estructura</span>
          </button>
        )}
      </header>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs uppercase tracking-widest px-2 hover:underline">Ignorar</button>
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
            placeholder="Escanear base de datos por nombre o tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto px-2">
          <FilterList fontSize="small" className="text-outline/40" />
          <span className="text-[10px] font-black uppercase tracking-widest text-outline/40">Filtro de Despliegue</span>
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
