import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import {
  Dashboard,
  Person,
  Groups2,
  ChevronLeft,
  Logout,
  ManageAccounts,
  ChildCare,
  SportsHandball,
  AutoStories,
  Route,
  MenuOpen,
  TrendingUp,
  AccountTree,
  PeopleAlt,
  CalendarMonth,
} from '@mui/icons-material';

/** Anchos en px — solo para quien necesite el valor numérico.
 *  El layout real los lee de `--sb-w` / `--sb-w-min` en `index.css`. */
export const DRAWER_WIDTH_EXPANDED = 260;
export const DRAWER_WIDTH_COLLAPSED = 80;

interface SidebarProps {
  /** `true` = expandido; `false` = colapsado a iconos. */
  open: boolean;
  onToggle: () => void;
  /** Drawer en móvil (≤860px). `true` = visible. */
  mobileOpen?: boolean;
  /** Cierra el drawer móvil (al navegar o pulsar el backdrop). */
  onCloseMobile?: () => void;
}

interface NavItem {
  text: string;
  icon: ReactNode;
  path: string;
  permission: boolean;
}

export const Sidebar = ({ open, onToggle, mobileOpen = false, onCloseMobile }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const canViewJovenes = usePermission('joven:view');
  const canViewRBAC = usePermission('rbac:view');
  const canViewUnidades = usePermission('unidad:view');
  const canViewUsuarios = usePermission('user:view');
  const canViewProgresion = usePermission('progresion:view');
  const canViewOrganizacion = usePermission('organizacion:view');
  const canViewEventos = usePermission('evento:view');
  const esJoven = user?.roles?.includes('JOVEN') ?? false;

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  // "/" solo marca activo en el dashboard: sin esto, `/app/xxx`
  // también activaba Dashboard por el prefijo.
  const isActive = (path: string) =>
    path === '/app'
      ? currentPath === '/app'
      : currentPath === path || currentPath.startsWith(path + '/');

  const mainItems: NavItem[] = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/app', permission: true },
    { text: 'Mi Perfil', icon: <Person />, path: '/app/perfil', permission: true },
  ];

  const isRestricted = (role: string) =>
    ['ADULTO_MANADA', 'ADULTO_TROPA', 'ADULTO_COMUNIDAD', 'ADULTO_CLAN'].includes(role);

  const managementItems: NavItem[] = [
    { text: 'Miembros', icon: <Groups2 />, path: '/app/miembros', permission: canViewJovenes },
    {
      text: 'Manada',
      icon: <ChildCare />,
      path: '/app/manada',
      permission:
        canViewUnidades &&
        !esJoven &&
        (!user?.roles.some(isRestricted) || user?.roles.includes('ADULTO_MANADA')),
    },
    {
      text: 'Tropa',
      icon: <SportsHandball />,
      path: '/app/tropa',
      permission:
        canViewUnidades &&
        !esJoven &&
        (!user?.roles.some(isRestricted) || user?.roles.includes('ADULTO_TROPA')),
    },
    {
      text: 'Comunidad',
      icon: <Route />,
      path: '/app/comunidad',
      permission:
        canViewUnidades &&
        !esJoven &&
        (!user?.roles.some(isRestricted) || user?.roles.includes('ADULTO_COMUNIDAD')),
    },
    {
      text: 'Clan',
      icon: <AutoStories />,
      path: '/app/clan',
      permission:
        canViewUnidades &&
        !esJoven &&
        (!user?.roles.some(isRestricted) || user?.roles.includes('ADULTO_CLAN')),
    },
    {
      text: esJoven ? 'Mi Progresión' : 'Progresión',
      icon: <TrendingUp />,
      path: esJoven ? '/app/mi-progresion' : '/app/progresion',
      permission: canViewProgresion,
    },
    { text: 'Unidades', icon: <ChildCare />, path: '/app/unidades', permission: canViewUnidades },
    { text: 'Eventos', icon: <CalendarMonth />, path: '/app/eventos', permission: canViewEventos },
    { text: 'Usuarios', icon: <PeopleAlt />, path: '/app/usuarios', permission: canViewUsuarios },
    {
      text: 'Estructura',
      icon: <AccountTree />,
      path: '/app/estructura',
      permission: canViewOrganizacion && !esJoven,
    },
    { text: 'Staff', icon: <ManageAccounts />, path: '/app/staff', permission: canViewRBAC },
  ].filter((i) => i.permission);

  const initials = user?.nombre
    ? user.nombre.charAt(0).toUpperCase() + (user.apellido?.charAt(0).toUpperCase() || '')
    : '?';

  const goTo = (path: string) => {
    navigate({ to: path });
    onCloseMobile?.();
  };

  /** Botón de un ítem de navegación. Se llama como función (no como
   *  componente) para que React no remonte el árbol en cada render. */
  const renderNav = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <button
        key={item.path}
        type="button"
        onClick={() => goTo(item.path)}
        aria-current={active ? 'page' : undefined}
        className={`sb-item${active ? ' on' : ''}`}
        title={!open ? item.text : undefined}
      >
        {item.icon}
        <span className="lbl">{item.text}</span>
      </button>
    );
  };

  return (
    <>
      <aside
        id="sidebar"
        aria-label="Navegación principal"
        className={['sb', !open && 'sb-min', mobileOpen && 'sb-open'].filter(Boolean).join(' ')}
      >
        <div className="sb-head">
          <div className="sb-brand">
            <div className="sb-logo" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2>Grupo Scout</h2>
              <p>Sentinel Protocol</p>
            </div>
          </div>
          <button
            type="button"
            className="sb-toggle"
            onClick={onToggle}
            aria-label={open ? 'Contraer menú' : 'Expandir menú'}
            aria-expanded={open}
          >
            {open ? <ChevronLeft /> : <MenuOpen />}
          </button>
        </div>

        <div className="sb-scroll">
          <div className="sb-sect">
            <h3 className="lbl">Principal</h3>
            {mainItems.map(renderNav)}
          </div>

          {managementItems.length > 0 && (
            <div className="sb-sect">
              <h3 className="lbl">Administración</h3>
              {managementItems.map(renderNav)}
            </div>
          )}
        </div>

        <div className="sb-foot">
          {user && (
            <div className="sb-user">
              <div className="av" aria-hidden="true">
                {initials}
              </div>
              <div className="sb-user-meta">
                <h4>{user.nombre}</h4>
                <p>{user.roles[0]?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          )}

          <button type="button" className="sb-out" onClick={handleLogout}>
            <Logout />
            <span className="lbl">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Backdrop del drawer en móvil */}
      <button
        type="button"
        aria-label="Cerrar menú"
        tabIndex={mobileOpen ? 0 : -1}
        className={`sb-backdrop${mobileOpen ? ' on' : ''}`}
        onClick={onCloseMobile}
      />
    </>
  );
};
