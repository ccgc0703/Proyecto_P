import { Injectable, ForbiddenException } from '@nestjs/common';
import { ROLES } from '../constantes';

/**
 * UnitPolicy — Capa ABAC (Attribute-Based Access Control)
 *
 * Controla el aislamiento por unidad: ciertos roles solo pueden
 * gestionar datos de su propia unidad asignada.
 *
 * Esta capa es SEPARADA del guard RBAC (PermissionsGuard).
 * RBAC responde: "¿tiene el permiso para hacer esto?" (ej: joven:create)
 * ABAC responde: "¿puede hacerlo sobre ESTOS datos?" (ej: ¿su unidad?)
 *
 * Uso en controladores:
 *   this.unitPolicy.assertCanManageUnit(req.user, dto.unidadId);
 */
@Injectable()
export class UnitPolicy {
    /** Roles que están restringidos a su propia unidad */
    private readonly unitRestrictedRoles = [
        ROLES.JEFE_GRUPO,
        ROLES.SUBJEFE_GRUPO,
        ROLES.ADULTO_MANADA,
        ROLES.ADULTO_TROPA,
        ROLES.ADULTO_CLAN,
    ];

    /**
     * Devuelve true si el usuario puede operar sobre la unidad indicada.
     * - Admin y Colaborador: sin restricción de unidad.
     * - Resto de roles: solo su unidad asignada.
     */
    canManageUnit(user: any, targetUnitId?: string): boolean {
        if (!targetUnitId) return true; // Sin unidad objetivo, no aplica restricción
        if (!this.unitRestrictedRoles.includes(user.rol)) return true;
        return user.unidadId === targetUnitId;
    }

    /**
     * Lanza ForbiddenException si el usuario no puede gestionar la unidad.
     * Usar en controladores que necesitan validación ABAC.
     */
    assertCanManageUnit(user: any, targetUnitId?: string): void {
        if (!this.canManageUnit(user, targetUnitId)) {
            throw new ForbiddenException(
                'Aislamiento de Unidad: Solo puedes gestionar datos de tu propia unidad asignada',
            );
        }
    }
}
