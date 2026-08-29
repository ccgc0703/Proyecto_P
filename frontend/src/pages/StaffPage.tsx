import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { rbacApi, adultosApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import {
  Shield,
  Radar,
  Add,
  Search,
  Edit,
  PeopleAlt,
  VpnKey
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Tooltip } from '@mui/material';

interface Role {
  id: string;
  nombre: string;
  description?: string;
  permissions: string[];
}

interface Permission {
  id: string;
  accion: string;
  description?: string;
}

interface StaffRow {
  id: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  cedula?: string;
  Unidad?: { nombre?: string };
}

const groupByEntity = (perms: string[]) => {
  const groups: Record<string, string[]> = {};
  perms.forEach((p) => {
    if (!p || typeof p !== 'string') return;
    const entity = p.split(':')[0];
    if (!groups[entity]) groups[entity] = [];
    groups[entity].push(p);
  });
  return groups;
};

export const StaffPage = () => {
  const navigate = useNavigate();
  const canView = usePermission('rbac:view');
  const [tab, setTab] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permisos, setPermisos] = useState<Permission[]>([]);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permisosData, staffData] = await Promise.all([
        rbacApi.getRoles(),
        rbacApi.getPermisos(),
        adultosApi.getAll(),
      ]);
      setRoles(rolesData);
      setPermisos(permisosData);
      setStaffList(staffData as StaffRow[]);
    } catch {
      console.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) fetchData();
  }, [canView]);

  const goToCreate = () => navigate({ to: '/app/staff/nuevo' });
  const goToEdit = (id: string) => navigate({ to: `/app/staff/editar/${id}` });
  const goToAccount = (id: string) => navigate({ to: `/app/staff/cuenta/${id}` });

  const filteredStaff = staffList.filter(u =>
    `${u.nombres} ${u.apellidos || ''}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.cedula?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: 'nombres',
      headerName: 'Agente / Credencial',
      flex: 1.5,
      minWidth: 250,
      renderCell: (p) => (
        <div className="flex items-center gap-4 h-full">
          <div className="w-10 h-10 rounded-2xl sentinel-gradient flex items-center justify-center text-on-primary font-black text-xs shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform shrink-0">
            {p.row.nombres?.[0]}{p.row.apellidos?.[0] || ''}
          </div>
          <div className="flex flex-col justify-center overflow-hidden">
            <p className="font-black text-sm text-primary leading-none mb-1 uppercase tracking-tight truncate">
              {p.row.nombres} {p.row.apellidos || ''}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-high text-outline font-black rounded uppercase tracking-widest border border-outline/5">
                {p.row.cedula}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      field: 'email',
      headerName: 'Nodo de Enlace (Email)',
      width: 220,
      renderCell: (p) => (
        <div className="flex flex-col justify-center h-full">
          <span className={`text-[11px] font-black uppercase tracking-tight ${p.row.email ? 'text-primary' : 'text-error opacity-70 italic'}`}>
            {p.row.email || 'Sin Sistema Vinculado'}
          </span>
          {p.row.email && (
            <span className="text-[9px] text-outline font-black opacity-40 uppercase tracking-widest mt-0.5">
              Protocolo Encriptado
            </span>
          )}
        </div>
      )
    },
    {
      field: 'unidad',
      headerName: 'Asignación',
      width: 150,
      renderCell: (p) => {
        const hasUnidad = !!p.row.Unidad;
        return (
          <div className="flex items-center h-full">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border transition-all ${
              hasUnidad 
                ? 'bg-primary/5 text-primary border-primary/20' 
                : 'bg-surface-container-high text-outline border-outline/10'
            }`}>
              {p.row.Unidad?.nombre || 'Operativo General'}
            </span>
          </div>
        );
      }
    },
    {
      field: 'roles',
      headerName: 'Rango / Roles',
      flex: 1,
      minWidth: 200,
      renderCell: (p) => (
        <div className="flex gap-1.5 flex-wrap items-center h-full">
          {(p.value as string[])?.map(r => (
            <span key={r} className="px-2.5 py-1 bg-accent/10 text-primary border border-accent/20 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm">
              {r.replace(/_/g, ' ')}
            </span>
          ))}
          {(!p.value || (p.value as string[]).length === 0) && (
            <span className="text-[10px] text-error/60 font-black uppercase tracking-widest">Acceso Base</span>
          )}
        </div>
      )
    },
    {
      field: 'actions',
      headerName: 'Protocolos',
      width: 140,
      sortable: false,
      headerAlign: 'right',
      align: 'right',
      renderCell: (p) => (
        <div className="flex items-center justify-end gap-2 h-full">
          <Tooltip title="Editar Protocolo">
            <button
              onClick={() => goToEdit(p.row.id)}
              className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-xl text-primary transition-all active:scale-90 border border-transparent hover:border-primary/20"
            >
              <Edit sx={{ fontSize: 20 }} />
            </button>
          </Tooltip>
          {!p.row.email && (
            <Tooltip title="Generar Acceso">
              <button
                onClick={() => goToAccount(p.row.id)}
                className="w-10 h-10 flex items-center justify-center hover:bg-emerald-500/10 rounded-xl text-emerald-600 transition-all active:scale-90 border border-transparent hover:border-emerald-500/20"
              >
                <VpnKey sx={{ fontSize: 20 }} />
              </button>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

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

  const permsByEntity = groupByEntity(permisos?.map((p) => p.accion) || []);
  const entities = Object.keys(permsByEntity);

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <header className="relative overflow-hidden bg-primary p-8 rounded-[2rem] text-on-primary shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-primary shadow-lg rotate-2">
              <PeopleAlt sx={{ fontSize: 32 }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/10">
                  Staff
                </span>
                <span className="flex items-center gap-1.5 text-[8px] font-bold opacity-70 uppercase tracking-widest">
                  <Radar sx={{ fontSize: 12 }} /> {staffList.length} Agentes
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter mb-1">Administración del Equipo</h1>
              <p className="text-sm font-medium opacity-70 max-w-md">Catálogo general de adultos, asignaciones a unidades y accesos al sistema.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
            <button onClick={() => setTab(0)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 0 ? 'bg-accent text-primary shadow-lg' : 'text-white/60 hover:text-white'}`}>Agentes</button>
            <button onClick={() => setTab(1)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 1 ? 'bg-accent text-primary shadow-lg' : 'text-white/60 hover:text-white'}`}>Roles</button>
            <button onClick={() => setTab(2)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 2 ? 'bg-accent text-primary shadow-lg' : 'text-white/60 hover:text-white'}`}>Permisos</button>
          </div>
        </div>
      </header>

      {tab === 0 && (
        <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="p-6 border-b border-surface-container-low flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-black tracking-tight text-primary uppercase italic">Directorio de Personal</h3>
              <p className="text-[9px] font-bold text-outline uppercase tracking-[0.2em] opacity-50">Escalafón de Agentes Activos</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" fontSize="small" />
                <input
                  type="text"
                  placeholder="BUSCAR AGENTE..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all shadow-inner"
                />
              </div>
              <button
                onClick={goToCreate}
                className="whitespace-nowrap px-4 py-2.5 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Add sx={{ fontSize: 16 }} /> Nuevo Registro
              </button>
            </div>
          </div>
          <div className="px-2 pb-4">
            <DataGrid
              rows={filteredStaff}
              columns={columns}
              loading={loading}
              autoHeight
              rowHeight={72}
              disableRowSelectionOnClick
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
                  justifyContent: 'center',
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
                  marginTop: '1.5rem',
                  color: 'var(--color-outline)',
                  fontSize: '11px',
                  fontWeight: '950',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                },
                '& .MuiTablePagination-root': {
                  color: 'inherit',
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '11px',
                  fontWeight: '950',
                },
              }}
            />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black">
                  {role.nombre?.[0] || 'R'}
                </div>
                <h4 className="font-black text-primary uppercase tracking-tight">
                  {role.nombre?.replace(/_/g, ' ') || 'Sin nombre'}
                </h4>
              </div>
              <p className="text-[10px] text-outline font-bold mb-4">{role.description || 'Sin descripción'}</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map(p => (
                  <span key={p} className="px-1.5 py-0.5 bg-surface-container-high rounded text-[8px] font-black text-primary uppercase">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {entities.map((entity) => (
            <div key={entity} className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <Shield sx={{ fontSize: 14 }} /> {entity}
              </h4>
              <div className="space-y-1">
                {permsByEntity[entity].map((perm) => (
                  <p key={perm} className="text-[10px] font-bold text-outline font-mono">{perm}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
