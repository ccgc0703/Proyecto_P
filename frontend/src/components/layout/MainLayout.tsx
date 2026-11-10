import { Outlet, Navigate, useRouterState, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { Sidebar } from './Sidebar';
import { RequierePermiso } from '../common/RequierePermiso';
import { permisosDeRuta } from '../common/rutaPermisos';
import {
  KeyboardArrowDown,
  Logout,
  Person,
  NotificationsNone,
  Search,
  Menu as MenuIcon,
} from '@mui/icons-material';

const PAGE_TITLES: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/miembros': 'Miembros',
  '/app/manada': 'Manada',
  '/app/tropa': 'Tropa',
  '/app/comunidad': 'Comunidad',
  '/app/clan': 'Clan',
  '/app/unidades': 'Unidades',
  '/app/usuarios': 'Usuarios',
  '/app/estructura': 'Estructura',
  '/app/staff': 'Staff',
  '/app/perfil': 'Mi perfil',
  '/app/progresion': 'Progresión',
  '/app/mi-progresion': 'Mi progresión',
  '/app/eventos': 'Eventos',
  '/app/documentos': 'Documentos',
  '/app/formacion': 'Formación',
};

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const {
    items: notificaciones,
    noLeidas,
    marcarLeida,
    marcarTodas,
  } = useNotificaciones();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const getPageTitle = () => {
    if (PAGE_TITLES[currentPath]) return PAGE_TITLES[currentPath];

    // Subrutas dinámicas: /app/staff/editar/$id → "Staff — Editar"
    const rutaBase = currentPath
      .replace(/\/(editar|cuenta)\/[^/]+$/, '')
      .replace(/\/nuevo$/, '');
    const titulo = PAGE_TITLES[rutaBase];
    if (titulo) {
      if (currentPath.endsWith('/nuevo')) return `Nuevo — ${titulo}`;
      if (currentPath.includes('/editar/')) return `Editar — ${titulo}`;
      if (currentPath.includes('/cuenta/')) return `Cuenta — ${titulo}`;
      return titulo;
    }
    return 'Sistema Scout';
  };
  const pageTitle = getPageTitle();
  const permisosRuta = permisosDeRuta(currentPath);

  // Al cambiar de ruta se cierra el drawer móvil y los menús desplegables.
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [currentPath]);

  // Escape cierra el drawer móvil.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

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
      <div className="flex justify-center items-center h-screen bg-surface" role="status" aria-live="polite">
        <span className="sr-only">Cargando</span>
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-surface flex selection:bg-accent/30 font-body">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={['main', !sidebarOpen && 'main-min'].filter(Boolean).join(' ')}>
        {/* ── Topbar ─────────────────────────────────────────────────── */}
        <header className="topbar">
          <div className="tb-left">
            <button
              type="button"
              className="tb-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={mobileOpen}
              aria-controls="sidebar"
            >
              <MenuIcon />
            </button>
            <h1 className="tb-title">{pageTitle}</h1>

            {/* Sustituido por la paleta Ctrl+K en Fase 4.2 — hoy es decorativo. */}
            <div className="search" aria-hidden="true">
              <Search fontSize="small" />
              <span>Buscar miembros, unidades, planes…</span>
              <kbd>Ctrl K</kbd>
            </div>
          </div>

          <div className="tb-right">
            <div className="relative">
              <button
                type="button"
                className="icon-btn"
                aria-label={noLeidas > 0 ? `Notificaciones (${noLeidas} sin leer)` : 'Notificaciones'}
                aria-haspopup="menu"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((v) => !v)}
              >
                <NotificationsNone />
                {noLeidas > 0 && (
                  <span className="badge" data-testid="notif-badge">
                    {noLeidas > 99 ? '99+' : noLeidas}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="notif-menu animate-fade-in-up" role="menu">
                    <div className="notif-head">
                      <b>Notificaciones</b>
                      {noLeidas > 0 && (
                        <button type="button" onClick={() => void marcarTodas()}>
                          Marcar todas
                        </button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notificaciones.length === 0 ? (
                        <p className="notif-empty">No tienes notificaciones.</p>
                      ) : (
                        notificaciones.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            role="menuitem"
                            className={`notif-item${n.leidaEn ? '' : ' unread'}`}
                            onClick={() => {
                              if (!n.leidaEn) void marcarLeida(n.id);
                              setNotifOpen(false);
                              if (n.link) navigate({ to: n.link });
                            }}
                          >
                            <b>{n.titulo}</b>
                            <span>{n.cuerpo}</span>
                            <time>{new Date(n.createdAt).toLocaleString('es-ES')}</time>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className={`user-btn${userMenuOpen ? ' open' : ''}`}
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="av" aria-hidden="true">
                  {initials}
                </span>
                <span className="meta">
                  <b>{user?.nombre}</b>
                  <span>{user?.roles[0]?.replace(/_/g, ' ')}</span>
                </span>
                <KeyboardArrowDown />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="user-menu animate-fade-in-up" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate({ to: '/app/perfil' });
                      }}
                    >
                      <Person /> Mi perfil
                    </button>
                    <div className="sep" />
                    <button type="button" role="menuitem" className="danger" onClick={handleLogout}>
                      <Logout /> Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Contenido ──────────────────────────────────────────────── */}
        <section className="content animate-fade-in">
          {permisosRuta ? (
            <RequierePermiso permisos={permisosRuta}>
              <Outlet />
            </RequierePermiso>
          ) : (
            <Outlet />
          )}
        </section>

        <footer className="px-[22px] py-5 bg-surface-container-low/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-outline/50">
            <div className="flex flex-wrap justify-center gap-6">
              <span>Sentinel Node: ACTIVE</span>
              <span>Regional: LATAM-01</span>
            </div>
            <span>© 2026 Sentinel Protocol · Scout System</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
