export type Unidad = 'MANADA' | 'TROPA' | 'CLAN';

export type Role =
  | 'SYSTEM_ADMIN'
  | 'GROUP_LEADER'
  | 'GROUP_SUBLEADER'
  | 'ADULTO_MANADA'
  | 'ADULTO_TROPA'
  | 'ADULTO_CLAN'
  | 'SECRETARIO'
  | 'ADULTO_COLABORADOR'
  | 'CONSULTOR';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  roles: Role[];
  permissions: string[];
  unidad?: Unidad;
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
} as const;

export const ROL_HIERARCHY: Record<Role, number> = {
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
