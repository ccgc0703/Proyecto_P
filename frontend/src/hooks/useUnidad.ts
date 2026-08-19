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
  
  if (!user) return [];
  
  if (useCanViewAllUnidades()) {
    return ['MANADA', 'TROPA', 'CLAN'];
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
    CLAN: 'Clan',
  };
  
  return unidad ? labels[unidad] : 'Todas';
};
