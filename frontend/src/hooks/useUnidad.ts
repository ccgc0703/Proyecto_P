import { useAuthStore } from '../stores/authStore';
import { PERMISSIONS, Unidad } from '../types/auth';

export const useUnidad = (): Unidad | undefined => {
  const { user } = useAuthStore();
  return user?.unidad;
};

export const useCanViewAllUnidades = (): boolean => {
  const { user } = useAuthStore();
  if (!user) return false;
  
  return user.permissions.includes(PERMISSIONS.RBAC_MANAGE) ||
         user.roles.includes('SYSTEM_ADMIN') ||
         user.roles.includes('GROUP_LEADER') ||
         user.roles.includes('GROUP_SUBLEADER');
};

export const useUnidadesFiltradas = (): Unidad[] => {
  const { user } = useAuthStore();
  const canViewAll = useCanViewAllUnidades();

  if (!user) return [];

  if (canViewAll) {
    return ['MANADA', 'TROPA', 'CAMINANTES', 'CLAN'];
  }
  
  if (user.unidad) {
    return [user.unidad];
  }
  
  return [];
};

export const useUnidadLabel = (unidad?: Unidad): string => {
  const labels: Record<Unidad, string> = {
    MANADA: 'Manada',
    TROPA: 'Tropa',
    CAMINANTES: 'Caminantes',
    CLAN: 'Clan',
  };
  
  return unidad ? labels[unidad] : 'Todas';
};
