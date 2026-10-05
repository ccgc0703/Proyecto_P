import { UnitDashboard } from '../components/units/UnitDashboard';
import { Route } from '@mui/icons-material';

export const ComunidadPage = () => (
  <UnitDashboard
    unitType="COMUNIDAD"
    label="Comunidad"
    icon={<Route sx={{ fontSize: 32 }} />}
    description="Comunidad. Gestión de proyectos comunitarios, servicio y desarrollo de liderazgo en la edad de la aventura."
  />
);
