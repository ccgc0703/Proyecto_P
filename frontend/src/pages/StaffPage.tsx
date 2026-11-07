import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { rbacApi, adultosApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import {
  Shield,
  Add,
  Search,
  Edit,
  VpnKey,
  Groups2,
  Lock,
  Security,
} from '@mui/icons-material';
import { Hero, HeroChip, DataTableShell, StateBlock, Pill } from '../components/ui';

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
  roles?: string[];
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

const TABS = [
  { id: 0, label: 'Agentes', icono: <Groups2 /> },
  { id: 1, label: 'Roles', icono: <Shield /> },
  { id: 2, label: 'Permisos', icono: <Security /> },
] as const;

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

  const filtrados = staffList.filter(
    (u) =>
      `${u.nombres} ${u.apellidos || ''}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.cedula?.toLowerCase().includes(search.toLowerCase())
  );

  if (!canView) {
    return (
      <div className="state state-error" role="alert">
        <div className="ic" aria-hidden="true">
          <Shield sx={{ fontSize: 29 }} />
        </div>
        <h3>Acceso Denegado</h3>
        <p>Se requiere autorización jerárquica para ver el directorio de agentes.</p>
      </div>
    );
  }

  const permsByEntity = groupByEntity(permisos?.map((p) => p.accion) || []);
  const entities = Object.keys(permsByEntity);

  return (
    <div className="space-y-5 animate-fade-in-up pb-10">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <Hero
        chips={
          <>
            <HeroChip icono={<Shield />}>Staff</HeroChip>
            <HeroChip tono="gold" icono={<Groups2 />}>
              {staffList.length} Agentes
            </HeroChip>
          </>
        }
        titulo="Administración del Equipo"
        subtitulo="Catálogo general de adultos, asignaciones a unidades y accesos al sistema."
        icono={<Security />}
      />

      {/* ── Pestañas ───────────────────────────────────────────────── */}
      <div className="tabs" role="tablist" aria-label="Secciones de staff">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab${tab === t.id ? ' on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icono}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Panel: Agentes ─────────────────────────────────────────── */}
      {tab === 0 && (
        <DataTableShell
          herramientas={
            <>
              <div className="tbl-titles">
                <span className="micro">Directorio de Personal</span>
                <h3>Escalafón de Agentes Activos</h3>
              </div>
              <div className="tbl-tools-l flex-none justify-end">
                <label className="tbl-search">
                  <Search />
                  <input
                    type="search"
                    placeholder="Buscar agente..."
                    aria-label="Buscar agente"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button type="button" className="btn btn-primary btn-sm" onClick={goToCreate}>
                  <Add />
                  <span>Nuevo Registro</span>
                </button>
              </div>
            </>
          }
          pie={<span className="rows-sel">{filtrados.length} agentes en el escalafón</span>}
        >
          {loading ? (
            <div className="p-4">
              <StateBlock estado="loading" filas={6} />
            </div>
          ) : filtrados.length === 0 ? (
            <StateBlock estado="empty" titulo="Sin resultados" mensaje="Ningún agente coincide con la búsqueda." />
          ) : (
            <div className="overflow-x-auto">
              <table className="dt">
                <caption>Listado de agentes del staff</caption>
                <thead>
                  <tr>
                    <th scope="col">Agente / Credencial</th>
                    <th scope="col">Nodo de Enlace</th>
                    <th scope="col">Asignación</th>
                    <th scope="col">Rango / Roles</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Protocolos</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((s) => (
                    <tr key={s.id}>
                      <td data-l="Agente">
                        <div className="cell-id">
                          <span className="av-sq" aria-hidden="true">
                            {s.nombres?.[0]}
                            {s.apellidos?.[0] || ''}
                          </span>
                          <span>
                            <span className="nm">{s.nombres} {s.apellidos || ''}</span>
                            <span className="sub">{s.cedula}</span>
                          </span>
                        </div>
                      </td>
                      <td data-l="Enlace">
                        {s.email ? (
                          <>
                            <span className="chip chip-mono">{s.email}</span>
                            <div className="sub" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-outline)', marginTop: 4 }}>
                              Protocolo Encriptado
                            </div>
                          </>
                        ) : (
                          <span style={{ color: 'var(--color-outline)', fontStyle: 'italic' }}>Sin Sistema Vinculado</span>
                        )}
                      </td>
                      <td data-l="Asignación">
                        {s.Unidad ? (
                          <span className="chip" style={{ boxShadow: 'inset 3px 0 0 var(--color-primary)', paddingLeft: 11 }}>
                            {s.Unidad.nombre}
                          </span>
                        ) : (
                          <Pill variante="blue" dot>
                            Operativo General
                          </Pill>
                        )}
                      </td>
                      <td data-l="Roles">
                        {s.roles && s.roles.length > 0 ? (
                          <div className="chip-row">
                            {s.roles.map((r) => (
                              <span key={r} className="chip chip-mono">{r.replace(/_/g, ' ')}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--color-error)', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Acceso Base
                          </span>
                        )}
                      </td>
                      <td data-l="Protocolos">
                        <div className="row-acts">
                          <button
                            type="button"
                            className="act-btn"
                            aria-label={`Editar protocolo de ${s.nombres}`}
                            title="Editar"
                            onClick={() => goToEdit(s.id)}
                          >
                            <Edit />
                          </button>
                          {!s.email && (
                            <button
                              type="button"
                              className="act-btn"
                              aria-label={`Generar acceso para ${s.nombres}`}
                              title="Generar acceso"
                              onClick={() => goToAccount(s.id)}
                            >
                              <VpnKey />
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
      )}

      {/* ── Panel: Roles ───────────────────────────────────────────── */}
      {tab === 1 && (
        <div className="card-grid cg-3">
          {roles.map((role) => (
            <div key={role.id} className="rcard">
              <div className="rcard-top">
                <div className="rcard-ic" aria-hidden="true">
                  {role.nombre?.[0] || 'R'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4>{role.nombre?.replace(/_/g, ' ') || 'Sin nombre'}</h4>
                  <div className="k">{role.permissions.length} permisos</div>
                </div>
              </div>
              <p>{role.description || 'Sin descripción'}</p>
              <div className="perm-list">
                {role.permissions.map((p) => (
                  <span key={p} className={`perm${p === '*' ? ' ent' : ''}`}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Panel: Permisos ────────────────────────────────────────── */}
      {tab === 2 && (
        <div className="card-grid cg-4">
          {entities.map((entity) => (
            <div key={entity} className="rcard">
              <div className="rcard-top">
                <div className="rcard-ic" aria-hidden="true">
                  <Lock />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4>{entity}</h4>
                  <div className="k">{permsByEntity[entity].length} permisos</div>
                </div>
              </div>
              <div className="perm-list">
                {permsByEntity[entity].map((perm) => (
                  <span key={perm} className="perm">{perm}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
