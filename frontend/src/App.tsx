import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  lazyRouteComponent,
  Outlet,
  redirect,
  useParams,
} from '@tanstack/react-router';
import { theme } from './theme/theme';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { useAuthStore } from './stores/authStore';

// ── F4.4 · Code-splitting ──────────────────────────────────────────────────
// Cada página de /app se importa bajo demanda: genera un chunk por ruta y
// mantiene en el bundle inicial solo el shell (layout), el login y los
// vendors compartidos (MUI, router, React).
const DashboardPage = lazyRouteComponent(() => import('./pages/DashboardPage'), 'DashboardPage');
const MiembrosPage = lazyRouteComponent(() => import('./pages/MiembrosPage'), 'MiembrosPage');
const StaffPage = lazyRouteComponent(() => import('./pages/StaffPage'), 'StaffPage');
const StaffRegisterPage = lazyRouteComponent(() => import('./pages/StaffRegisterPage'), 'StaffRegisterPage');
const StaffEditPage = lazyRouteComponent(() => import('./pages/StaffEditPage'), 'StaffEditPage');
const StaffAccountPage = lazyRouteComponent(() => import('./pages/StaffAccountPage'), 'StaffAccountPage');
const PerfilPage = lazyRouteComponent(() => import('./pages/PerfilPage'), 'PerfilPage');
const ManadaPage = lazyRouteComponent(() => import('./pages/ManadaPage'), 'ManadaPage');
const TropaPage = lazyRouteComponent(() => import('./pages/TropaPage'), 'TropaPage');
const ClanPage = lazyRouteComponent(() => import('./pages/ClanPage'), 'ClanPage');
const ComunidadPage = lazyRouteComponent(() => import('./pages/ComunidadPage'), 'ComunidadPage');
const MemberRegisterPage = lazyRouteComponent(() => import('./pages/MemberRegisterPage'), 'MemberRegisterPage');
const MemberEditPage = lazyRouteComponent(() => import('./pages/MemberEditPage'), 'MemberEditPage');
const ProgresionPage = lazyRouteComponent(() => import('./pages/ProgresionPage'), 'ProgresionPage');
const ProgresionFichaPage = lazyRouteComponent(() => import('./pages/ProgresionFichaPage'), 'ProgresionFichaPage');
const MiProgresionPage = lazyRouteComponent(() => import('./pages/MiProgresionPage'), 'MiProgresionPage');
const EstructuraPage = lazyRouteComponent(() => import('./pages/EstructuraPage'), 'EstructuraPage');

const exigirProgresion = () => {
  const { user } = useAuthStore.getState();
  // Los jóvenes solo ven su propia progresión (portal del joven).
  // La falta de permisos ya no redirige en silencio: MainLayout pinta
  // "Acceso Denegado" vía RequierePermiso.
  if (user?.roles?.includes('JOVEN')) {
    throw redirect({ to: '/app/mi-progresion' });
  }
};

const exigirMiProgresion = () => {
  const { user } = useAuthStore.getState();
  if (!user?.roles?.includes('JOVEN')) {
    throw redirect({ to: '/app' });
  }
};

// Root
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: '/app' });
    }
  },
});

// Protected layout
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: MainLayout,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: DashboardPage,
});

const miembrosRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/miembros',
  component: MiembrosPage,
});



const manadaRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/manada',
  component: ManadaPage,
});

const manadaRegisterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/manada/nuevo',
  component: () => <MemberRegisterPage unitType="Manada" unitLabel="Manada" />,
});

const ManadaEditWrapper = () => {
  const { id } = useParams({ strict: false }) as { id: string };
  return <MemberEditPage memberId={id} unitType="Manada" unitLabel="Manada" />;
};

const manadaEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/manada/editar/$id',
  component: ManadaEditWrapper,
});

const tropaRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/tropa',
  component: TropaPage,
});

const tropaRegisterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/tropa/nuevo',
  component: () => <MemberRegisterPage unitType="Tropa" unitLabel="Tropa" />,
});

const TropaEditWrapper = () => {
  const { id } = useParams({ strict: false }) as { id: string };
  return <MemberEditPage memberId={id} unitType="Tropa" unitLabel="Tropa" />;
};

const tropaEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/tropa/editar/$id',
  component: TropaEditWrapper,
});

const clanRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/clan',
  component: ClanPage,
});

const clanRegisterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/clan/nuevo',
  component: () => <MemberRegisterPage unitType="Clan" unitLabel="Clan" />,
});

const ClanEditWrapper = () => {
  const { id } = useParams({ strict: false }) as { id: string };
  return <MemberEditPage memberId={id} unitType="Clan" unitLabel="Clan" />;
};

const clanEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/clan/editar/$id',
  component: ClanEditWrapper,
});

const comunidadRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/comunidad',
  component: ComunidadPage,
});

const comunidadRegisterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/comunidad/nuevo',
  component: () => <MemberRegisterPage unitType="Comunidad" unitLabel="Comunidad" />,
});

const ComunidadEditWrapper = () => {
  const { id } = useParams({ strict: false }) as { id: string };
  return <MemberEditPage memberId={id} unitType="Comunidad" unitLabel="Comunidad" />;
};

const comunidadEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/comunidad/editar/$id',
  component: ComunidadEditWrapper,
});

const staffRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff',
  component: StaffPage,
});

const staffRegisterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff/nuevo',
  component: StaffRegisterPage,
});

const StaffEditWrapper = () => {
  return <StaffEditPage />;
};

const staffEditRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff/editar/$id',
  component: StaffEditWrapper,
});

const StaffAccountWrapper = () => {
  return <StaffAccountPage />;
};

const staffAccountRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/staff/cuenta/$id',
  component: StaffAccountWrapper,
});

const perfilRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/perfil',
  component: PerfilPage,
});

const progresionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/progresion',
  beforeLoad: exigirProgresion,
  component: ProgresionPage,
});

const progresionFichaRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/progresion/$miembroId',
  beforeLoad: exigirProgresion,
  component: ProgresionFichaPage,
});

const miProgresionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mi-progresion',
  beforeLoad: exigirMiProgresion,
  component: MiProgresionPage,
});

const estructuraRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/estructura',
  component: EstructuraPage,
});

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    throw redirect({ to: isAuthenticated ? '/app' : '/login' });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    miembrosRoute,
    manadaRoute,
    manadaRegisterRoute,
    manadaEditRoute,
    tropaRoute,
    tropaRegisterRoute,
    tropaEditRoute,
    clanRoute,
    clanRegisterRoute,
    clanEditRoute,
    comunidadRoute,
    comunidadRegisterRoute,
    comunidadEditRoute,
    staffRoute,
    staffRegisterRoute,
    staffEditRoute,
    staffAccountRoute,
    perfilRoute,
    progresionRoute,
    progresionFichaRoute,
    miProgresionRoute,
    estructuraRoute,
  ]),
]);

// Fallback mientras se descarga el chunk de la ruta (F4.4)
const PendingPage = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
      bgcolor: 'background.default',
    }}
  >
    <CircularProgress />
  </Box>
);

const router = createRouter({ routeTree, defaultPendingComponent: PendingPage });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Componente que espera que Zustand rehidrate el estado desde localStorage
// antes de montar el router, evitando que `isAuthenticated` sea false
// momentáneamente y cause redirecciones incorrectas al /login
const AppWithHydration = () => {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  if (!hasHydrated) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <RouterProvider router={router} />;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppWithHydration />
    </ThemeProvider>
  );
};

export default App;
