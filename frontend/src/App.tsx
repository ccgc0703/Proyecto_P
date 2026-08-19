import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
  useParams,
} from '@tanstack/react-router';
import { theme } from './theme/theme';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MiembrosPage } from './pages/MiembrosPage';

import { StaffPage } from './pages/StaffPage';
import { StaffRegisterPage } from './pages/StaffRegisterPage';
import { StaffEditPage } from './pages/StaffEditPage';
import { StaffAccountPage } from './pages/StaffAccountPage';
import { PerfilPage } from './pages/PerfilPage';
import { ManadaPage } from './pages/ManadaPage';
import { TropaPage } from './pages/TropaPage';
import { ClanPage } from './pages/ClanPage';
import { MemberRegisterPage } from './pages/MemberRegisterPage';
import { MemberEditPage } from './pages/MemberEditPage';
import { useAuthStore } from './stores/authStore';

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
    staffRoute,
    staffRegisterRoute,
    staffEditRoute,
    staffAccountRoute,
    perfilRoute,
  ]),
]);

const router = createRouter({ routeTree });

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
