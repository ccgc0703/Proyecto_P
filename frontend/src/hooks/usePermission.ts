import { useAuthStore } from '../stores/authStore';
import { PERMISSIONS, puedeAsignarRol } from '../types/auth';

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
  return puedeAsignarRol(user.roles, targetRole);
};
