import { UnitDashboard } from '../components/units/UnitDashboard';
import { AutoStories } from '@mui/icons-material';

export const ClanPage = () => (
  <UnitDashboard 
    unitType="CLAN" 
    label="Clan" 
    icon={<AutoStories sx={{ fontSize: 32 }} />} 
    description="Centro de comando para Rover Scouts. Gestión de proyectos comunitarios, servicio y liderazgo estratégico."
  />
);
