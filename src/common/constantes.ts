export const ROLES = {
    ADMIN: 'ADMINISTRADOR DEL SISTEMA',
    JEFE_GRUPO: 'JEFE DE GRUPO',
    SUBJEFE_GRUPO: 'SUBJEFE DE GRUPO',
    ADULTO_MANADA: 'ADULTO MANADA',
    ADULTO_TROPA: 'ADULTO TROPA',
    ADULTO_CLAN: 'ADULTO CLAN',
    ADULTO_COLABORADOR: 'ADULTO COLABORADOR',
};

// ─── RBAC: Nombres canónicos de roles en nueva tabla ───────────────────────
export const RBAC_ROLES = {
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    GROUP_LEADER: 'GROUP_LEADER',
    GROUP_SUBLEADER: 'GROUP_SUBLEADER',
    ADULTO_MANADA: 'ADULTO_MANADA',
    ADULTO_TROPA: 'ADULTO_TROPA',
    ADULTO_CLAN: 'ADULTO_CLAN',
    SECRETARIO: 'SECRETARIO',
    ADULTO_COLABORADOR: 'ADULTO_COLABORADOR',
    CONSULTOR: 'CONSULTOR',
} as const;

// Mapeo de rol legacy → nombre RBAC
export const LEGACY_TO_RBAC_ROLE: Record<string, string> = {
    [ROLES.ADMIN]: RBAC_ROLES.SYSTEM_ADMIN,
    [ROLES.JEFE_GRUPO]: RBAC_ROLES.GROUP_LEADER,
    [ROLES.SUBJEFE_GRUPO]: RBAC_ROLES.GROUP_SUBLEADER,
    [ROLES.ADULTO_MANADA]: RBAC_ROLES.ADULTO_MANADA,
    [ROLES.ADULTO_TROPA]: RBAC_ROLES.ADULTO_TROPA,
    [ROLES.ADULTO_CLAN]: RBAC_ROLES.ADULTO_CLAN,
    [ROLES.ADULTO_COLABORADOR]: RBAC_ROLES.ADULTO_COLABORADOR,
};

// ─── RBAC: Permisos atómicos por módulo ───────────────────────────────────
export const PERMISSIONS = {
    // Usuarios
    USER_CREATE: 'user:create',
    USER_VIEW: 'user:view',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',

    // Jóvenes
    JOVEN_CREATE: 'joven:create',
    JOVEN_VIEW: 'joven:view',
    JOVEN_UPDATE: 'joven:update',
    JOVEN_DELETE: 'joven:delete',

    // Unidades
    UNIDAD_CREATE: 'unidad:create',
    UNIDAD_VIEW: 'unidad:view',
    UNIDAD_UPDATE: 'unidad:update',
    UNIDAD_DELETE: 'unidad:delete',

    // Administrativo (representantes)
    REPRESENTANTE_CREATE: 'representante:create',
    REPRESENTANTE_VIEW: 'representante:view',
    REPRESENTANTE_UPDATE: 'representante:update',
    REPRESENTANTE_DELETE: 'representante:delete',

    // Scout (progresión, condecoraciones)
    PROGRESION_CREATE: 'progresion:create',
    PROGRESION_VIEW: 'progresion:view',
    PROGRESION_UPDATE: 'progresion:update',
    PROGRESION_DELETE: 'progresion:delete',
    CONDECORACION_CREATE: 'condecoracion:create',
    CONDECORACION_VIEW: 'condecoracion:view',
    CONDECORACION_UPDATE: 'condecoracion:update',
    CONDECORACION_DELETE: 'condecoracion:delete',
    CONDECORACION_OTORGAR: 'condecoracion:otorgar',

    // Médico
    MEDICO_VIEW: 'medico:view',
    MEDICO_EDIT: 'medico:edit',       // Legacy — mantener para compatibilidad
    MEDICO_UPDATE: 'medico:update',

    // RBAC administration
    RBAC_VIEW: 'rbac:view',
    RBAC_MANAGE: 'rbac:manage',
    RBAC_ASSIGN_ROLE: 'rbac:assign-role',
} as const;

// ─── JWT ─────────────────────────────────────────────────────────────────
export const JWT_SECRET = process.env.JWT_SECRET || 'poseidon-secret-key-2024';
export const JWT_EXPIRES_IN = '8h';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';
