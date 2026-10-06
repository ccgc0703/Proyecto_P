import type { ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { PERMISSIONS } from '../../types/auth';
import { AccesoDenegado } from './AccesoDenegado';

interface RequierePermisoProps {
  /** Permiso único requerido */
  permiso?: string;
  /** Todos los permisos requeridos (se combinan con permiso si se indican ambos) */
  permisos?: string[];
  mensaje?: string;
  children: ReactNode;
}

/**
 * Blindaje de rutas: si el usuario no tiene los permisos requeridos pinta
 * "Acceso Denegado" en lugar de renderizar la página ni redirigir en silencio.
 * Fallo cerrado: sin permisos declarados no se muestra nada.
 */
export const RequierePermiso = ({ permiso, permisos, mensaje, children }: RequierePermisoProps) => {
  const user = useAuthStore((s) => s.user);

  const tiene = (p: string) =>
    !!user && (user.permissions.includes(PERMISSIONS.RBAC_MANAGE) || user.permissions.includes(p));

  const requeridos = [...(permisos ?? []), ...(permiso ? [permiso] : [])];
  const puede = requeridos.length > 0 && requeridos.every(tiene);

  if (!puede) return <AccesoDenegado mensaje={mensaje} />;
  return <>{children}</>;
};
