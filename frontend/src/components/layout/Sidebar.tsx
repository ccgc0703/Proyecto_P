import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import {
  Dashboard,
  Person,
  Groups2,
  ChevronLeft,
  Logout,
  Shield,
  ManageAccounts,
  ChildCare,
  SportsHandball,
  AutoStories,
  Route,
  MenuOpen
} from '@mui/icons-material';

export const DRAWER_WIDTH_EXPANDED = 260;
export const DRAWER_WIDTH_COLLAPSED = 80;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  permission: boolean;
}

export const Sidebar = ({ open, onToggle }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const canViewJovenes = usePermission('joven:view');
  const canViewRBAC = usePermission('rbac:view');
  const canViewUnidades = usePermission('unidad:view');

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const mainItems: NavItem[] = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/app', permission: true },
    { text: 'Mi Perfil', icon: <Person />, path: '/app/perfil', permission: true },
  ];

  const isRestricted = (role: string) =>
    ['ADULTO_MANADA', 'ADULTO_TROPA', 'ADULTO_CAMINANTES', 'ADULTO_CLAN'].includes(role);

  const managementItems: NavItem[] = [
    { text: 'Miembros', icon: <Groups2 />, path: '/app/miembros', permission: canViewJovenes },
    {
      text: 'Manada',
      icon: <ChildCare />,
      path: '/app/manada',
      permission: canViewUnidades && (!user?.roles.some(isRestricted) || user?.roles.includes('ADULTO_MANADA'))
    },
    {
      text: 'Tropa',
      icon: <SportsHandball />,
      path: '/app/tropa',
      permission: canViewUnidades && (!user?.roles.some(isRestricted) || user?.roles.includes('ADULTO_TROPA'))
    },
    {
      text: 'Clan',
      icon: <AutoStories />,
      path: '/app/clan',
      permission: canViewUnidades && (!user?.roles.some(isRestricted) || user?.roles.includes('ADULTO_CLAN'))
    },
    {
      text: 'Caminantes',
      icon: <Route />,
      path: '/app/caminantes',
      permission: canViewUnidades && (!user?.roles.some(isRestricted) || user?.roles.includes('ADULTO_CAMINANTES'))
    },
    { text: 'Staff', icon: <ManageAccounts />, path: '/app/staff', permission: canViewRBAC },
  ].filter((i) => i.permission);

  const initials = user?.nombre
    ? user.nombre.charAt(0).toUpperCase() + (user.apellido?.charAt(0).toUpperCase() || '')
    : '?';

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 flex flex-col bg-surface-container-low/80 backdrop-blur-xl shadow-2xl ${open ? 'w-[260px]' : 'w-[80px]'
        }`}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4">
        <div className={`flex items-center gap-3 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
          <div className="w-8 h-8 sentinel-gradient rounded-lg flex items-center justify-center shadow-md">
            <Shield className="text-on-primary !text-[18px]" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tighter leading-none text-primary">Grupo Scout</h2>
            <p className="text-[9px] uppercase tracking-[0.1em] text-outline font-bold">Sentinel Protocol</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-surface-container-high text-outline transition-colors"
        >
          {open ? <ChevronLeft /> : <MenuOpen />}
        </button>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
        {/* Main Section */}
        <nav className="space-y-1">
          {mainItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate({ to: item.path })}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${active
                    ? 'sentinel-gradient text-on-primary shadow-lg shadow-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                  }`}
              >
                <div className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'text-accent' : ''}`}>
                  {item.icon}
                </div>
                {open && <span className="text-sm font-bold tracking-tight">{item.text}</span>}
              </button>
            );
          })}
        </nav>

        {/* Admin Section */}
        {managementItems.length > 0 && (
          <div className="space-y-2">
            {open ? (
              <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-outline/60">
                Administración
              </h3>
            ) : (
              <div className="mx-2 border-t border-outline-variant/20" />
            )}
            <nav className="space-y-1">
              {managementItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate({ to: item.path })}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${active
                        ? 'sentinel-gradient text-on-primary shadow-lg shadow-primary/20'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                      }`}
                  >
                    <div className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'text-accent' : ''}`}>
                      {item.icon}
                    </div>
                    {open && <span className="text-sm font-bold tracking-tight">{item.text}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 space-y-3">
        {user && (
          <div className={`bg-surface-container-high rounded-2xl transition-all ${open ? 'p-3' : 'p-1'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl sentinel-gradient flex items-center justify-center text-on-primary font-black text-xs shadow-md shrink-0">
                {initials}
              </div>
              {open && (
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-primary truncate leading-tight">{user.nombre}</h4>
                  <p className="text-[10px] text-outline font-bold truncate uppercase tracking-tighter">
                    {user.roles[0]?.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-4 p-3 rounded-xl text-error bg-error/5 hover:bg-error/10 transition-all group ${!open && 'justify-center'
            }`}
        >
          <Logout className="group-hover:-translate-x-1 transition-transform" />
          {open && <span className="text-sm font-bold tracking-tight">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
