import { UnitDashboard } from '../components/units/UnitDashboard';
import { Route } from '@mui/icons-material';

export const CaminantesPage = () => (
  <UnitDashboard
    unitType="CAMINANTES"
    label="Caminantes"
    icon={<Route sx={{ fontSize: 32 }} />}
    description="Comunidad de Caminantes. Gestión de proyectos comunitarios, servicio y desarrollo de liderazgo en la edad de la aventura."
  />
);
