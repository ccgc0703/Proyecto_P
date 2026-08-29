import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Search,
  Add,
  Radar,
  VerifiedUser,
  Groups2,
  Face,
  Face3,
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';
import { Dialog } from '@mui/material';
import { miembrosApi, unidadesApi } from '../../api';
import { Unidad } from '../../types/auth';
import { Member, UnidadEntity } from '../../types/member';
import { MemberProfile } from './MemberProfile';

interface UnitDashboardProps {
  unitType: Unidad;
  label: string;
  icon: ReactNode;
  description: string;
}

export const UnitDashboard = ({ unitType, label, icon, description }: UnitDashboardProps) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adultoDeUnidad, setAdultoDeUnidad] = useState('Cargando...');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const unidades = await unidadesApi.getAll();
        const unidad = (unidades as UnidadEntity[]).find((u) =>
          u.nombre?.toLowerCase() === unitType.toLowerCase()
        );
        const data = await miembrosApi.getAll(unidad?.id);
        setMembers(data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [unitType]);

  useEffect(() => {
    const fetchAdulto = async () => {
      try {
        const unidades = await unidadesApi.getAll();
        const unidadLabel = label.toLowerCase();
        const unidad = (unidades as UnidadEntity[]).find((u) =>
          u.nombre?.toLowerCase() === unidadLabel
        );
        const adulto = unidad?.Usuarios?.[0];
        if (adulto) {
          setAdultoDeUnidad(`${adulto.nombre}${adulto.apellido ? ' ' + adulto.apellido : ''}`);
        } else {
          setAdultoDeUnidad('Sin asignar');
        }
      } catch {
        setAdultoDeUnidad('Sin asignar');
      }
    };
    fetchAdulto();
  }, [label]);

  // Stats reales basados en campo genero
  const stats = useMemo(() => {
    const total = members.length;
    const masculino = members.filter((m) => m.genero === 'MASCULINO').length;
    const femenino = members.filter((m) => m.genero === 'FEMENINO').length;
    return {
      total,
      masculino,
      femenino,
      masPercent: total > 0 ? Math.round((masculino / total) * 100) : 0,
      femPercent: total > 0 ? Math.round((femenino / total) * 100) : 0,
    };
  }, [members]);

  const calculateAge = useCallback((birthDate?: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }, []);

  const filteredMembers = members.filter(m =>
    `${m.nombres} ${m.apellidos}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await miembrosApi.delete(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const columns: GridColDef<Member>[] = [
    {
      field: 'nombre',
      headerName: 'Miembro',
      flex: 1.5,
      renderCell: (p) => (
        <div className="flex items-center gap-3 h-full">
          <div className="w-9 h-9 rounded-xl sentinel-gradient flex items-center justify-center text-on-primary font-black text-[10px] shadow-md shrink-0">
            {p.row.nombres?.[0]}{p.row.apellidos?.[0]}
          </div>
          <div className="flex flex-col justify-center overflow-hidden">
            <p className="font-black text-sm text-primary leading-none mb-1 uppercase tracking-tight truncate">{p.row.nombres} {p.row.apellidos}</p>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-60">{p.row.Unidad?.nombre || label}</p>
          </div>
        </div>
      )
    },
    {
      field: 'genero',
      headerName: 'Género',
      width: 100,
      renderCell: (p) => (
        <div className="flex items-center h-full">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
            p.row.genero === 'MASCULINO'
              ? 'bg-blue-500/5 text-blue-600 border-blue-500/20'
              : 'bg-pink-500/5 text-pink-600 border-pink-500/20'
          }`}>
            {p.row.genero === 'MASCULINO' ? 'Masculino' : 'Femenino'}
          </span>
        </div>
      )
    },
    {
      field: 'edad',
      headerName: 'Edad',
      width: 80,
      renderCell: (p) => (
        <div className="flex items-center h-full">
          <span className="text-sm font-black text-primary">{calculateAge(p.row.fechaNacimiento)} <span className="text-[10px] opacity-40">años</span></span>
        </div>
      )
    },
    {
      field: 'fechaNacimiento',
      headerName: 'Fec. Nacimiento',
      width: 130,
      renderCell: (p) => (
        <div className="flex items-center h-full">
          <span className="text-[11px] font-black text-outline uppercase tracking-widest">
            {p.row.fechaNacimiento ? new Date(p.row.fechaNacimiento).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </span>
        </div>
      )
    },
    {
      field: 'ci',
      headerName: 'C.I. Joven',
      width: 120,
      renderCell: (p) => (
        <div className="flex items-center h-full">
          <span className="text-[11px] font-black text-primary/70 bg-surface-container-high px-2 py-1 rounded-lg border border-outline/5">{p.row.cedula || 'N/A'}</span>
        </div>
      )
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120,
      renderCell: (p) => {
        const estado = p.row.estado || 'ACTIVO';
        const colors: Record<string, string> = {
          ACTIVO: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20',
          INACTIVO: 'bg-red-500/5 text-red-500 border-red-500/20',
          EGRESADO: 'bg-amber-500/5 text-amber-600 border-amber-500/20',
        };
        return (
          <div className="flex items-center h-full">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${colors[estado] || colors.ACTIVO}`}>
              {estado}
            </span>
          </div>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (p) => (
        <div className="flex items-center justify-end gap-1 h-full">
          <button
            onClick={() => { setSelectedMember(p.row); setIsProfileOpen(true); }}
            className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-xl text-primary transition-all active:scale-95"
            title="Ver perfil"
          >
            <Visibility sx={{ fontSize: 20 }} />
          </button>
          <button
            onClick={() => navigate({ to: `/app/${label.toLowerCase()}/editar/${p.row.id}` })}
            className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-xl text-primary transition-all active:scale-95"
            title="Editar"
          >
            <Edit sx={{ fontSize: 20 }} />
          </button>
          <button
            onClick={() => setDeleteConfirmId(p.row.id)}
            className="w-10 h-10 flex items-center justify-center hover:bg-error/10 rounded-xl text-error transition-all active:scale-95"
            title="Desactivar"
          >
            <Delete sx={{ fontSize: 20 }} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      {/* Header Banner */}
      <header className="relative overflow-hidden sentinel-gradient p-8 rounded-[2rem] text-on-primary shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-primary shadow-lg rotate-2">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/10">
                  Dashboard de Unidad
                </span>
                <span className="flex items-center gap-1.5 text-[8px] font-bold opacity-70 uppercase tracking-widest">
                  <Radar sx={{ fontSize: 12 }} /> Protocolo Activo
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter mb-1">{label}</h1>
              <p className="text-sm font-medium opacity-70 max-w-md">{description}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Censo Actual</p>
              <p className="text-3xl font-black">{stats.total}</p>
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <p className="text-[10px] font-bold opacity-70">Adulto: {adultoDeUnidad}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid — Real M/F */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
              <Groups2 />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-0.5">Total Miembros</p>
              <h3 className="text-2xl font-black text-primary">{stats.total}</h3>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/5 rounded-2xl flex items-center justify-center text-blue-600">
              <Face />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-0.5">Masculino</p>
              <h3 className="text-2xl font-black text-primary">
                {stats.masculino} <span className="text-sm text-outline font-bold">({stats.masPercent}%)</span>
              </h3>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-500/5 rounded-2xl flex items-center justify-center text-pink-600">
              <Face3 />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-0.5">Femenino</p>
              <h3 className="text-2xl font-black text-primary">
                {stats.femenino} <span className="text-sm text-outline font-bold">({stats.femPercent}%)</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-surface-container-low flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-black tracking-tight text-primary uppercase italic">Listado Maestro</h3>
            <p className="text-[9px] font-bold text-outline uppercase tracking-[0.2em] opacity-50">Base de Datos — {label}</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" fontSize="small" />
              <input
                type="text"
                placeholder="BUSCAR MIEMBRO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all shadow-inner"
              />
            </div>
            <button
              onClick={() => navigate({ to: `/app/${label.toLowerCase()}/nuevo` })}
              className="whitespace-nowrap px-4 py-2.5 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Add sx={{ fontSize: 16 }} /> Nuevo Registro
            </button>
          </div>
        </div>

        <div className="p-2">
          <DataGrid
            rows={filteredMembers}
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
                backgroundColor: 'var(--color-surface-container-low) !important'
              }
            }}
          />
        </div>
      </div>

      {/* Unit Info Footer (moved from sidebar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
            <VerifiedUser fontSize="small" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-0.5">Adulto de Unidad</p>
            <p className="text-sm font-bold text-primary">{adultoDeUnidad}</p>
          </div>
        </section>
        <section className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/5 rounded-xl flex items-center justify-center text-emerald-600">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-0.5">Estado Operativo</p>
            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Sincronizado</p>
          </div>
        </section>
        <section className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
            <Groups2 fontSize="small" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-0.5">Promedio Edad</p>
            <p className="text-sm font-bold text-primary">
              {members.length > 0
                ? (members.reduce((sum, m) => sum + calculateAge(m.fechaNacimiento), 0) / members.length).toFixed(1)
                : '—'} años
            </p>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        PaperProps={{ sx: { borderRadius: '1.5rem', padding: '1rem' } }}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center text-error mx-auto mb-4">
            <Delete sx={{ fontSize: 32 }} />
          </div>
          <h3 className="text-lg font-black text-primary mb-2">¿Desactivar miembro?</h3>
          <p className="text-sm text-outline mb-6">El miembro será marcado como inactivo. Este proceso es reversible.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-6 py-2.5 bg-surface-container-high text-primary rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-6 py-2.5 bg-error text-on-error rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Dialog>

      {/* Member Profile Dialog */}
      <Dialog
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '2.5rem', overflow: 'hidden', maxHeight: '90vh' },
        }}
      >
        {selectedMember && (
          <MemberProfile
            member={selectedMember}
            onClose={() => setIsProfileOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
};
