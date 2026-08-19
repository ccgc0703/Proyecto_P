import { UnitDashboard } from '../components/units/UnitDashboard';
import { ChildCare } from '@mui/icons-material';

export const ManadaPage = () => (
  <UnitDashboard 
    unitType="MANADA" 
    label="Manada" 
    icon={<ChildCare sx={{ fontSize: 32 }} />} 
    description="Centro de comando para la formación de lobatos y lobeznas. Supervisión estratégica de seisenas y progresión inicial."
  />
);
