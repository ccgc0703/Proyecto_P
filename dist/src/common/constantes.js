"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_EXPIRES_IN = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = exports.PERMISSIONS = exports.LEGACY_TO_RBAC_ROLE = exports.RBAC_ROLES = exports.ROLES = void 0;
exports.ROLES = {
    ADMIN: 'ADMINISTRADOR DEL SISTEMA',
    JEFE_GRUPO: 'JEFE DE GRUPO',
    SUBJEFE_GRUPO: 'SUBJEFE DE GRUPO',
    ADULTO_MANADA: 'ADULTO MANADA',
    ADULTO_TROPA: 'ADULTO TROPA',
    ADULTO_CLAN: 'ADULTO CLAN',
    ADULTO_COLABORADOR: 'ADULTO COLABORADOR',
};
exports.RBAC_ROLES = {
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    GROUP_LEADER: 'GROUP_LEADER',
    GROUP_SUBLEADER: 'GROUP_SUBLEADER',
    ADULTO_MANADA: 'ADULTO_MANADA',
    ADULTO_TROPA: 'ADULTO_TROPA',
    ADULTO_CLAN: 'ADULTO_CLAN',
    SECRETARIO: 'SECRETARIO',
    ADULTO_COLABORADOR: 'ADULTO_COLABORADOR',
    CONSULTOR: 'CONSULTOR',
};
exports.LEGACY_TO_RBAC_ROLE = {
    [exports.ROLES.ADMIN]: exports.RBAC_ROLES.SYSTEM_ADMIN,
    [exports.ROLES.JEFE_GRUPO]: exports.RBAC_ROLES.GROUP_LEADER,
    [exports.ROLES.SUBJEFE_GRUPO]: exports.RBAC_ROLES.GROUP_SUBLEADER,
    [exports.ROLES.ADULTO_MANADA]: exports.RBAC_ROLES.ADULTO_MANADA,
    [exports.ROLES.ADULTO_TROPA]: exports.RBAC_ROLES.ADULTO_TROPA,
    [exports.ROLES.ADULTO_CLAN]: exports.RBAC_ROLES.ADULTO_CLAN,
    [exports.ROLES.ADULTO_COLABORADOR]: exports.RBAC_ROLES.ADULTO_COLABORADOR,
};
exports.PERMISSIONS = {
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
};
exports.JWT_SECRET = process.env.JWT_SECRET || 'poseidon-secret-key-2024';
exports.JWT_EXPIRES_IN = '8h';
exports.REFRESH_TOKEN_EXPIRES_IN = '7d';
//# sourceMappingURL=constantes.js.map