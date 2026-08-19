import { useAuthStore } from '../stores/authStore';
import { PERMISSIONS } from '../types/auth';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, login, logout, checkAuth } = useAuthStore();
  return { user, token, isAuthenticated, isLoading, login, logout, checkAuth };
};

export const usePermission = (permission: string): boolean => {
  const { user } = useAuthStore();
  if (!user) return false;
  
  if (user.permissions.includes(PERMISSIONS.RBAC_MANAGE)) {
    return true;
  }
  
  return user.permissions.includes(permission);
};

export const useHasAnyPermission = (permissions: string[]): boolean => {
  const { user } = useAuthStore();
  if (!user) return false;
  
  if (user.permissions.includes(PERMISSIONS.RBAC_MANAGE)) {
    return true;
  }
  
  return permissions.some((p) => user.permissions.includes(p));
};

export const useHasAllPermissions = (permissions: string[]): boolean => {
  const { user } = useAuthStore();
  if (!user) return false;
  
  return permissions.every((p) => user.permissions.includes(p));
};

export const useCanAssignRole = (targetRole: string): boolean => {
  const { user } = useAuthStore();
  if (!user) return false;
  
  const roleHierarchy: Record<string, number> = {
    SYSTEM_ADMIN: 1,
    GROUP_LEADER: 2,
    GROUP_SUBLEADER: 3,
    ADULTO_MANADA: 4,
    ADULTO_TROPA: 5,
    ADULTO_CLAN: 6,
    SECRETARIO: 7,
    ADULTO_COLABORADOR: 8,
    CONSULTOR: 9,
  };
  
  const userMaxRole = Math.min(...user.roles.map((r) => roleHierarchy[r] || 999));
  const targetRoleLevel = roleHierarchy[targetRole] || 999;
  
  return userMaxRole < targetRoleLevel;
};
