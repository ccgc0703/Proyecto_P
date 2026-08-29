import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add, Search, Groups2, FilterList } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { miembrosApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import { useUnidad, useCanViewAllUnidades } from '../hooks/useUnidad';
import { Unidad } from '../types/auth';

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
  unidad: z.enum(['MANADA', 'TROPA', 'CAMINANTES', 'CLAN']),
});
type JovenFormData = z.infer<typeof jovenSchema>;

export const MiembrosPage = () => {
  const canView = usePermission('joven:view');
  const canCreate = usePermission('joven:create');
  const unidadAsignada = useUnidad();
  const canViewAll = useCanViewAllUnidades();

  const [jovenes, setJovenes] = useState<Joven[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JovenFormData>({
    resolver: zodResolver(jovenSchema),
  });

  const fetchJovenes = useCallback(async () => {
    try {
      setLoading(true);
      const params = canViewAll ? undefined : (unidadAsignada || undefined);
      const data = await miembrosApi.getAll(params);
      setJovenes(data);
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

  const onSubmit = async (data: JovenFormData) => {
    try {
      if (editingId) {
        await miembrosApi.update(editingId, data);
      } else {
        await miembrosApi.create(data);
      }
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

  const columns: GridColDef[] = [
    { 
      field: 'nombre', 
      headerName: 'Miembro / Identidad', 
      flex: 1.5, 
      minWidth: 250,
      renderCell: (p) => (
        <div className="flex items-center gap-4 h-full">
          <div className="w-10 h-10 rounded-2xl sentinel-gradient flex items-center justify-center text-on-primary font-black text-xs shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-all shrink-0">
            {p.row.nombres.charAt(0)}{p.row.apellidos.charAt(0)}
          </div>
          <div className="flex flex-col justify-center overflow-hidden">
            <span className="block font-black text-sm text-primary uppercase tracking-tight leading-none mb-1 truncate">{p.row.nombres} {p.row.apellidos}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-high text-outline font-black rounded uppercase tracking-widest border border-outline/5">{p.row.cedula}</span>
          </div>
        </div>
      )
    },
    {
      field: 'fechaNacimiento', 
      headerName: 'Fecha Nacimiento', 
      width: 180,
      renderCell: (p) => (
        <div className="flex flex-col justify-center h-full">
          <span className="text-[11px] font-black text-outline uppercase tracking-widest">
            {new Date(p.value).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-[9px] font-bold text-primary opacity-50 uppercase tracking-tighter">Registro Civil</span>
        </div>
      ),
    },
    {
      field: 'unidadStore', 
      headerName: 'Unidad / Sección', 
      width: 180,
      renderCell: (p: GridRenderCellParams) => {
        const u = p.row.unidad as string;
        return (
          <div className="flex items-center h-full">
            <span className="text-[11px] font-black uppercase tracking-widest text-primary border-l-4 border-accent pl-3">
              {u}
            </span>
          </div>
        );
      },
    },
  ];

  const filtered = jovenes.filter((j) => {
    const matchSearch = j.nombres.toLowerCase().includes(search.toLowerCase()) ||
      j.apellidos.toLowerCase().includes(search.toLowerCase());
    const matchUnidad = !filtroUnidad || j.unidad === filtroUnidad;
    return matchSearch && matchUnidad;
  });

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
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center text-primary rotate-1 shadow-sm">
            <Groups2 sx={{ fontSize: 24 }} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-primary uppercase italic leading-none mb-1">Directorio de Miembros</h2>
            <p className="text-[9px] font-bold text-outline uppercase tracking-[0.2em] opacity-40">{jovenes.length} Registros Activos • Nodo Operativo</p>
          </div>
        </div>

        {canCreate && (
          <button 
            onClick={() => handleOpenDialog()}
            className="sentinel-gradient px-4 py-2.5 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Add sx={{ fontSize: 16 }} />
            <span>Nuevo Registro</span>
          </button>
        )}
      </header>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs uppercase tracking-widest px-2 hover:underline">Cerrar</button>
        </div>
      )}

      {/* Control Bar */}
      <section className="bg-surface-container-low p-3 rounded-[1.5rem] shadow-inner flex flex-col md:flex-row gap-4 items-center border border-outline-variant/10">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
            <Search sx={{ fontSize: 18 }} />
          </div>
          <input
            type="text"
            placeholder="INTERROGAR MIEMBRO POR NOMBRE O CREDENCIAL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border-none rounded-xl text-[10px] text-on-surface font-black uppercase tracking-widest shadow-sm focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="hidden sm:flex items-center gap-2 text-outline px-3">
            <FilterList fontSize="small" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Filtros</span>
          </div>
          {canViewAll && (
            <select 
              value={filtroUnidad}
              onChange={(e) => setFiltroUnidad(e.target.value)}
              className="px-4 py-3 bg-surface-container-high border-none rounded-xl text-sm text-on-surface font-bold focus:ring-2 focus:ring-primary min-w-[140px] appearance-none"
            >
              <option value="">Todas las Unidades</option>
              <option value="MANADA">🟢 Manada</option>
              <option value="TROPA">🟡 Tropa</option>
              <option value="CLAN">🟣 Clan</option>
            </select>
          )}
        </div>
      </section>

      {/* Main Table Container */}
      <div className="rounded-[2rem] shadow-sm overflow-hidden bg-surface-container-lowest border border-outline-variant/10">
        <div className="px-2 pb-4">
          <DataGrid
            rows={filtered}
            columns={columns}
            loading={loading}
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[10, 15, 25, 50]}
            autoHeight
            rowHeight={72}
            disableRowSelectionOnClick
            disableColumnMenu
            sx={{ 
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'var(--color-surface-container-low)',
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                fontSize: '11px',
                letterSpacing: '0.15em',
                fontWeight: '950',
                borderRadius: '1rem',
                border: 'none',
                minHeight: '48px !important',
              },
              '& .MuiDataGrid-cell': {
                display: 'flex !important',
                alignItems: 'center !important',
                padding: '10px 16px !important',
                borderBottom: '1px solid var(--color-surface-container-low)',
                lineHeight: 'normal !important',
                '&:focus, &:focus-within': { outline: 'none' },
                '& > div': {
                  display: 'flex !important',
                  alignItems: 'center !important',
                  height: '100% !important',
                  width: '100%',
                },
                '& *': {
                  lineHeight: 'normal !important',
                }
              },
              '& .MuiDataGrid-row': {
                margin: '2px 0',
                transition: 'background-color 0.2s',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'var(--color-surface-container-low) !important',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: 'none',
                marginTop: '1rem',
                color: 'var(--color-outline)',
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              },
              '& .MuiTablePagination-root': {
                color: 'inherit',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '10px',
                fontWeight: '900',
              },
            }}
          />
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); reset(); }} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle className="text-xl font-black text-primary px-8 pt-8">
            {editingId ? 'Actualizar Archivo' : 'Crear Registro de Campo'}
          </DialogTitle>
          <DialogContent className="px-8 space-y-4">
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

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Designación de Unidad</label>
              <select {...register('unidad')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none">
                {(canViewAll || unidadAsignada === 'MANADA') && <option value="MANADA">🟢 Manada</option>}
                {(canViewAll || unidadAsignada === 'TROPA') && <option value="TROPA">🟡 Tropa</option>}
                {(canViewAll || unidadAsignada === 'CLAN') && <option value="CLAN">🟣 Clan</option>}
              </select>
            </div>
          </DialogContent>
          <DialogActions className="p-8 gap-4">
            <button type="button" onClick={() => { setOpenDialog(false); reset(); }} className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors">
              Abortar
            </button>
            <button type="submit" className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
              {editingId ? 'Confirmar Cambios' : 'Desplegar Registro'}
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
