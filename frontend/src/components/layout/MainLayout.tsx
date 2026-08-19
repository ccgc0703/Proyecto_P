import { Outlet, Navigate, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { Sidebar, DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED } from './Sidebar';
import { 
  KeyboardArrowDown, 
  Logout, 
  Person, 
  NotificationsNone,
  Search,
  Explore
} from '@mui/icons-material';

const PAGE_TITLES: Record<string, string> = {
  '/app': 'Dashboard Sentinel',
  '/app/miembros': 'Gestión de Miembros',
  '/app/unidades': 'Despliegue de Unidades',
  '/app/staff': 'Staff',
  '/app/perfil': 'Mi Perfil de Agente',
  '/app/manada/nuevo': 'Nuevo Registro — Manada',
  '/app/tropa/nuevo': 'Nuevo Registro — Tropa',
  '/app/clan/nuevo': 'Nuevo Registro — Clan',
};

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const getPageTitle = () => {
    if (PAGE_TITLES[currentPath]) return PAGE_TITLES[currentPath];
    if (currentPath.includes('/editar/')) {
      if (currentPath.includes('/manada/')) return 'Editar Miembro — Manada';
      if (currentPath.includes('/tropa/')) return 'Editar Miembro — Tropa';
      if (currentPath.includes('/clan/')) return 'Editar Miembro — Clan';
    }
    return 'Sistema Scout';
  };
  const pageTitle = getPageTitle();

  const drawerWidth = sidebarOpen ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED;

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate({ to: '/login' });
  };

  const initials = user?.nombre
    ? user.nombre.charAt(0).toUpperCase() + (user.apellido?.charAt(0).toUpperCase() || '')
    : '?';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-surface">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-surface flex selection:bg-accent/30 font-body">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.4]">
        <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02]">
          <Explore sx={{ fontSize: '800px' }} />
        </div>
      </div>

      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main 
        className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 relative z-10"
        style={{ marginLeft: drawerWidth }}
      >
        {/* Header / TopNav */}
        <header className="sticky top-0 z-30 h-16 bg-surface-container-low/60 backdrop-blur-xl px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-black tracking-tight text-primary uppercase">
              {pageTitle}
            </h1>
            
            {/* Search bar simulation */}
            <div className="hidden lg:flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg text-outline hover:text-primary transition-all cursor-text min-w-[300px]">
              <Search fontSize="small" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Buscar recursos...</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl text-outline hover:bg-surface-container-high hover:text-primary transition-all relative group">
              <NotificationsNone />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface group-hover:scale-125 transition-transform" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 bg-surface-container-high rounded-2xl hover:bg-surface-container-highest transition-all group"
              >
                <div className="w-8 h-8 rounded-xl sentinel-gradient flex items-center justify-center text-on-primary font-black text-xs shadow-md shadow-primary/10 transition-transform group-active:scale-95">
                  {initials}
                </div>
                <div className="text-left hidden sm:block min-w-[100px]">
                  <p className="text-[10px] font-black leading-tight text-primary truncate">{user?.nombre}</p>
                  <p className="text-[8px] font-bold text-outline uppercase tracking-widest truncate">{user?.roles[0]?.replace(/_/g, ' ')}</p>
                </div>
                <KeyboardArrowDown className={`text-outline transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fontSize="small" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-2xl shadow-2xl p-2 z-50 animate-fade-in-up">
                    <button 
                      onClick={() => { setUserMenuOpen(false); navigate({ to: '/app/perfil' }); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-all group"
                    >
                      <Person className="text-outline group-hover:text-primary" />
                      <span className="text-sm font-bold tracking-tight">Mi Perfil Agente</span>
                    </button>
                    <div className="h-2" /> {/* Spacing instead of divider */}
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-error/5 text-error transition-all group"
                    >
                      <Logout className="group-hover:-translate-x-1 transition-transform" />
                      <span className="text-sm font-bold tracking-tight">Cerrar Protocolo</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 p-6 overflow-y-auto animate-fade-in">
          <Outlet />
        </section>

        {/* Footer Meta */}
        <footer className="p-6 bg-surface-container-low/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-outline/50">
            <div className="flex items-center gap-6">
              <span>Sentinel Node: ACTIVE</span>
              <span>Regional: LATAM-01</span>
            </div>
            <span>© 2024 Modern Sentinel Interface • Scout System</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
