import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
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
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { Dialog } from '@mui/material';
import { miembrosApi, unidadesApi } from '../../api';
import { usePermission } from '../../hooks/usePermission';
import { Unidad } from '../../types/auth';
import { Member, UnidadEntity } from '../../types/member';
import { MemberProfile } from './MemberProfile';
import { UnidadProgresionPanel } from '../../features/progresion/UnidadProgresionPanel';
import { Hero, HeroChip, DataTableShell, StateBlock, Pill } from '../ui';

interface UnitDashboardProps {
  unitType: Unidad;
  label: string;
  icon: ReactNode;
  description: string;
}

export const UnitDashboard = ({ unitType, label, icon, description }: UnitDashboardProps) => {
  const navigate = useNavigate();
  const puedeVerProgresion = usePermission('progresion:view');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adultoDeUnidad, setAdultoDeUnidad] = useState('Cargando...');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [unidadId, setUnidadId] = useState<string | null>(null);
  const [pestana, setPestana] = useState(0);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const unidades = await unidadesApi.getAll();
        const unidad = (unidades as UnidadEntity[]).find((u) =>
          u.nombre?.toLowerCase() === unitType.toLowerCase()
        );
        setUnidadId(unidad?.id ?? null);
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

  /** Edad promedio y rango del contingente (formato de la maqueta). */
  const { promedioEdad, rangoEdad } = useMemo(() => {
    if (members.length === 0) return { promedioEdad: '—', rangoEdad: '' };
    const edades = members.map((m) => calculateAge(m.fechaNacimiento));
    const suma = edades.reduce((sum, e) => sum + e, 0);
    return {
      promedioEdad: (suma / edades.length).toFixed(1),
      rangoEdad: `${Math.min(...edades)}–${Math.max(...edades)}`,
    };
  }, [members, calculateAge]);

  return (
    <div className="space-y-5 animate-fade-in-up pb-10">
      {/* Hero de unidad */}
      <Hero
        chips={
          <>
            <HeroChip icono={<Groups2 />}>Dashboard de Unidad</HeroChip>
            <HeroChip tono="gold" icono={<VerifiedUser />}>Protocolo Activo</HeroChip>
          </>
        }
        titulo={label}
        subtitulo={description}
        icono={icon}
        kpi={{ etiqueta: 'Censo Actual', valor: stats.total }}
      />

      {/* Métricas rápidas */}
      <div className="kpi-row">
        <div className="kpi-s">
          <div className="lbl">
            <Groups2 />
            <span className="micro">Total miembros</span>
          </div>
          <div className="val">{stats.total}</div>
        </div>
        <div className="kpi-s blue">
          <div className="lbl">
            <Face />
            <span className="micro">Masculino</span>
          </div>
          <div className="val">
            {stats.masculino}<small>· {stats.masPercent}%</small>
          </div>
        </div>
        <div className="kpi-s red">
          <div className="lbl">
            <Face3 />
            <span className="micro">Femenino</span>
          </div>
          <div className="val">
            {stats.femenino}<small>· {stats.femPercent}%</small>
          </div>
        </div>
        <div className="kpi-s gold">
          <div className="lbl">
            <Schedule />
            <span className="micro">Promedio de edad</span>
          </div>
          <div className="val">
            {promedioEdad}<small>años</small>
          </div>
        </div>
      </div>

      {/* Tabs Miembros / Progresión */}
      {puedeVerProgresion && (
        <div className="tabs tabs-line" role="tablist" aria-label="Secciones de unidad" style={{ marginBottom: 20 }}>
          <button
            type="button"
            role="tab"
            aria-selected={pestana === 0}
            className={`tab${pestana === 0 ? ' on' : ''}`}
            onClick={() => setPestana(0)}
          >
            <Groups2 />
            <span>Miembros</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestana === 1}
            className={`tab${pestana === 1 ? ' on' : ''}`}
            onClick={() => setPestana(1)}
          >
            <TrendingUp />
            <span>Progresión</span>
          </button>
        </div>
      )}

      {puedeVerProgresion && pestana === 1 ? (
        unidadId ? (
          <UnidadProgresionPanel unidadId={unidadId} titulo={label} />
        ) : (
          <div className="card">
            <p className="text-xs font-bold text-outline uppercase tracking-widest text-center py-6">
              Unidad no encontrada
            </p>
          </div>
        )
      ) : (
        <DataTableShell
          herramientas={
            <>
              <div className="tbl-titles">
                <span className="micro">Listado Maestro</span>
                <h3>Base de Datos — {label}</h3>
              </div>
              <div className="tbl-tools-l flex-none justify-end">
                <label className="tbl-search">
                  <Search />
                  <input
                    type="search"
                    placeholder="Buscar miembro..."
                    aria-label="Buscar miembro en la unidad"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate({ to: `/app/${label.toLowerCase()}/nuevo` })}
                >
                  <Add />
                  <span>Nuevo Registro</span>
                </button>
              </div>
            </>
          }
        >
          {loading ? (
            <div className="p-4">
              <StateBlock estado="loading" filas={6} />
            </div>
          ) : filteredMembers.length === 0 ? (
            <StateBlock
              estado="empty"
              titulo="Sin miembros que coincidan."
              mensaje="Aún no hay miembros en esta unidad o ninguno coincide con la búsqueda."
              accion={
                <button
                  type="button"
                  className="btn btn-primary btn-sm mt-1"
                  onClick={() => navigate({ to: `/app/${label.toLowerCase()}/nuevo` })}
                >
                  <Add />
                  <span>Nuevo Registro</span>
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="dt">
                <caption>Listado de miembros de la unidad seleccionada</caption>
                <thead>
                  <tr>
                    <th scope="col">Miembro</th>
                    <th scope="col">Género</th>
                    <th scope="col">Edad</th>
                    <th scope="col">Fec. Nacimiento</th>
                    <th scope="col">C.I. Joven</th>
                    <th scope="col">Estado</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => {
                    const estado = m.estado || 'ACTIVO';
                    const femenino = m.genero === 'FEMENINO';
                    const pillEstado =
                      estado === 'INACTIVO' ? 'red' : estado === 'EGRESADO' ? 'gold' : 'green';
                    return (
                      <tr key={m.id}>
                        <td data-l="Miembro">
                          <div className="cell-id">
                            <span className="av-sq" aria-hidden="true">
                              {m.nombres?.[0]}
                              {m.apellidos?.[0]}
                            </span>
                            <span>
                              <span className="nm">{m.nombres} {m.apellidos}</span>
                              <span className="sub">{m.Unidad?.nombre || label}</span>
                            </span>
                          </div>
                        </td>
                        <td data-l="Género">
                          <span
                            className="chip"
                            style={
                              femenino
                                ? { background: 'rgba(163,35,28,.1)', color: 'var(--color-error)' }
                                : { background: 'rgba(72,95,132,.14)', color: 'var(--color-secondary)' }
                            }
                          >
                            {femenino ? 'Femenino' : 'Masculino'}
                          </span>
                        </td>
                        <td data-l="Edad">
                          <b style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
                            {calculateAge(m.fechaNacimiento)}
                          </b>
                        </td>
                        <td data-l="Fec. Nacimiento">
                          <span className="chip chip-mono">
                            {m.fechaNacimiento
                              ? new Date(m.fechaNacimiento).toLocaleDateString('es', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </td>
                        <td data-l="C.I. Joven">
                          <span className="chip chip-mono">{m.cedula || 'N/A'}</span>
                        </td>
                        <td data-l="Estado">
                          <Pill variante={pillEstado}>{estado}</Pill>
                        </td>
                        <td data-l="Acciones">
                          <div className="row-acts">
                            <button
                              type="button"
                              className="act-btn"
                              aria-label={`Ver perfil de ${m.nombres} ${m.apellidos}`}
                              title="Ver perfil"
                              onClick={() => {
                                setSelectedMember(m);
                                setIsProfileOpen(true);
                              }}
                            >
                              <Visibility />
                            </button>
                            <button
                              type="button"
                              className="act-btn"
                              aria-label={`Editar ${m.nombres} ${m.apellidos}`}
                              title="Editar"
                              onClick={() =>
                                navigate({ to: `/app/${label.toLowerCase()}/editar/${m.id}` })
                              }
                            >
                              <Edit />
                            </button>
                            <button
                              type="button"
                              className="act-btn danger"
                              aria-label={`Desactivar ${m.nombres} ${m.apellidos}`}
                              title="Desactivar"
                              onClick={() => setDeleteConfirmId(m.id)}
                            >
                              <Delete />
                            </button>
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
      )}

      {/* Información de la unidad */}
      <div className="card-grid cg-3">
        <div className="rcard">
          <div className="rcard-top">
            <div className="rcard-ic" aria-hidden="true">
              <VerifiedUser />
            </div>
            <div style={{ minWidth: 0 }}>
              <h4>Adulto de Unidad</h4>
              <div className="k">Responsable asignado</div>
            </div>
          </div>
          <p>{adultoDeUnidad}</p>
        </div>

        <div className="rcard">
          <div className="rcard-top">
            <div className="rcard-ic" aria-hidden="true">
              <Radar />
            </div>
            <div style={{ minWidth: 0 }}>
              <h4>Estado Operativo</h4>
              <div className="k">Sincronización</div>
            </div>
          </div>
          <p>
            <Pill variante="green" dot>Sincronizado</Pill>
          </p>
        </div>

        <div className="rcard">
          <div className="rcard-top">
            <div className="rcard-ic" aria-hidden="true">
              <Schedule />
            </div>
            <div style={{ minWidth: 0 }}>
              <h4>Promedio de Edad</h4>
              <div className="k">Contingente</div>
            </div>
          </div>
          <p>
            {promedioEdad} años{rangoEdad ? ` · rango ${rangoEdad}` : ''}
          </p>
        </div>
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
