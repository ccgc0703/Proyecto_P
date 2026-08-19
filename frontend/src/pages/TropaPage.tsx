import { UnitDashboard } from '../components/units/UnitDashboard';
import { SportsHandball } from '@mui/icons-material';

export const TropaPage = () => (
  <UnitDashboard 
    unitType="TROPA" 
    label="Tropa" 
    icon={<SportsHandball sx={{ fontSize: 32 }} />} 
    description="Sincronización táctica de patrullas. Gestión de la vida civil y el compromiso scout en la edad de la aventura."
  />
);
