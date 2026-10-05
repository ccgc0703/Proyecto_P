export type Unidad = 'MANADA' | 'TROPA' | 'COMUNIDAD' | 'CLAN';

export type Role =
  | 'SYSTEM_ADMIN'
  | 'NATIONAL_BOARD'
  | 'NATIONAL_EXECUTIVE'
  | 'NATIONAL_DIR_JOVENES'
  | 'NATIONAL_DIR_ADULTOS'
  | 'NATIONAL_DIR_DESARROLLO'
  | 'NATIONAL_COLABORADOR'
  | 'REGION_COMMISSIONER'
  | 'REGION_ASSISTANT'
  | 'REGION_COLABORADOR'
  | 'DISTRICT_COMMISSIONER'
  | 'DISTRICT_ASSISTANT'
  | 'DISTRICT_COLABORADOR'
  | 'GROUP_LEADER'
  | 'GROUP_SUBLEADER'
  | 'ADULTO_MANADA'
  | 'ADULTO_TROPA'
  | 'ADULTO_CLAN'
  | 'ADULTO_COMUNIDAD'
  | 'REPRESENTANTE_UNIDAD'
  | 'ADULTO_COLABORADOR'
  | 'CONSULTOR'
  | 'JOVEN';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  roles: Role[];
  permissions: string[];
  unidad?: Unidad;
  miembroId?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const PERMISSIONS = {
  USER_CREATE: 'user:create',
  USER_VIEW: 'user:view',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  JOVEN_CREATE: 'joven:create',
  JOVEN_VIEW: 'joven:view',
  JOVEN_UPDATE: 'joven:update',
  JOVEN_DELETE: 'joven:delete',
  UNIDAD_CREATE: 'unidad:create',
  UNIDAD_VIEW: 'unidad:view',
  UNIDAD_UPDATE: 'unidad:update',
  UNIDAD_DELETE: 'unidad:delete',
  REPRESENTANTE_CREATE: 'representante:create',
  REPRESENTANTE_VIEW: 'representante:view',
  REPRESENTANTE_UPDATE: 'representante:update',
  REPRESENTANTE_DELETE: 'representante:delete',
  PROGRESION_CREATE: 'progresion:create',
  PROGRESION_VIEW: 'progresion:view',
  PROGRESION_UPDATE: 'progresion:update',
  PROGRESION_DELETE: 'progresion:delete',
  PROGRESION_APROBAR: 'progresion:aprobar',
  CATALOGO_VIEW: 'catalogo:view',
  CATALOGO_MANAGE: 'catalogo:manage',
  CONDECORACION_CREATE: 'condecoracion:create',
  CONDECORACION_VIEW: 'condecoracion:view',
  CONDECORACION_UPDATE: 'condecoracion:update',
  CONDECORACION_DELETE: 'condecoracion:delete',
  CONDECORACION_OTORGAR: 'condecoracion:otorgar',
  MEDICO_VIEW: 'medico:view',
  MEDICO_EDIT: 'medico:edit',
  MEDICO_UPDATE: 'medico:update',
  RBAC_VIEW: 'rbac:view',
  RBAC_MANAGE: 'rbac:manage',
  RBAC_ASSIGN_ROLE: 'rbac:assign-role',
  SELF_VIEW: 'self:view',
  SELF_UPDATE: 'self:update',
  ORGANIZACION_VIEW: 'organizacion:view',
  ORGANIZACION_CREATE: 'organizacion:create',
  ORGANIZACION_UPDATE: 'organizacion:update',
  ORGANIZACION_DELETE: 'organizacion:delete',
} as const;

/** Jerarquía de roles: 1 = más privilegio. Un usuario solo asigna roles de nivel MAYOR. */
export const ROL_HIERARCHY: Record<Role, number> = {
  SYSTEM_ADMIN: 1,
  NATIONAL_BOARD: 2,
  NATIONAL_EXECUTIVE: 3,
  NATIONAL_DIR_JOVENES: 4,
  NATIONAL_DIR_ADULTOS: 4,
  NATIONAL_DIR_DESARROLLO: 4,
  NATIONAL_COLABORADOR: 5,
  REGION_COMMISSIONER: 6,
  REGION_ASSISTANT: 7,
  REGION_COLABORADOR: 8,
  DISTRICT_COMMISSIONER: 9,
  DISTRICT_ASSISTANT: 10,
  DISTRICT_COLABORADOR: 11,
  GROUP_LEADER: 12,
  GROUP_SUBLEADER: 13,
  REPRESENTANTE_UNIDAD: 14,
  ADULTO_MANADA: 15,
  ADULTO_TROPA: 15,
  ADULTO_COMUNIDAD: 15,
  ADULTO_CLAN: 15,
  ADULTO_COLABORADOR: 16,
  CONSULTOR: 17,
  JOVEN: 18,
};

/**
 * ¿Puede `userRoles` asignar `targetRole`? (rol objetivo de nivel estrictamente
 * mayor = menor privilegio). Refleja la validación del backend.
 */
export const puedeAsignarRol = (userRoles: readonly string[], targetRole: string): boolean => {
  if (userRoles.length === 0) return false;
  const jerarquia = ROL_HIERARCHY as Record<string, number>;
  const userMaxRole = Math.min(...userRoles.map((r) => jerarquia[r] ?? 999));
  const targetLevel = jerarquia[targetRole] ?? 999;
  return userMaxRole < targetLevel;
};
