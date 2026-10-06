import { Shield } from '@mui/icons-material';

interface AccesoDenegadoProps {
  mensaje?: string;
}

export const AccesoDenegado = ({
  mensaje = 'No tienes permisos para acceder a esta sección.',
}: AccesoDenegadoProps) => (
  <div className="p-8 glass-panel border border-error/20 rounded-2xl flex flex-col items-center gap-4 text-center">
    <Shield className="text-error text-5xl opacity-20" />
    <div>
      <h3 className="text-xl font-black text-error">Acceso Denegado</h3>
      <p className="text-sm font-medium text-outline">{mensaje}</p>
    </div>
  </div>
);
