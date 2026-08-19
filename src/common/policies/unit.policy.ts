import { Injectable, ForbiddenException } from '@nestjs/common';
import { RBAC_ROLES } from '../constantes';

/**
 * UnitPolicy — Capa ABAC (Attribute-Based Access Control)
 *
 * Controla el aislamiento por unidad: ciertos roles solo pueden
 * gestionar datos de su propia unidad asignada.
 */
@Injectable()
export class UnitPolicy {
    /** Roles que están restringidos a su propia unidad */
    private readonly unitRestrictedRoles: string[] = [
        RBAC_ROLES.ADULTO_MANADA,
        RBAC_ROLES.ADULTO_TROPA,
        RBAC_ROLES.ADULTO_CLAN,
    ];

    /**
     * Determina si el usuario tiene algún rol que deba estar restringido a una unidad.
     */
    isRestricted(user: any): boolean {
        if (!user.roles || !Array.isArray(user.roles)) return false;
        return user.roles.some((role: string) => this.unitRestrictedRoles.includes(role));
    }

    /**
     * Devuelve true si el usuario puede operar sobre la unidad indicada.
     * - Admin y Colaborador: sin restricción de unidad.
     * - Jefe/Subjefe de Grupo: sin restricción (visión global).
     * - Adulto de Unidad: solo su unidad asignada.
     */
    canManageUnit(user: any, targetUnitId?: string): boolean {
        // Si el usuario no tiene roles restringidos, puede gestionar cualquier unidad
        if (!this.isRestricted(user)) return true;

        // Si es restringido pero no se especifica una unidad objetivo (ej: ver todo), se bloquea
        if (!targetUnitId) return false;

        // Solo puede gestionar si el ID coincide con su unidad asignada
        return user.unidadId === targetUnitId;
    }

    /**
     * Lanza ForbiddenException si el usuario no puede gestionar la unidad.
     */
    assertCanManageUnit(user: any, targetUnitId?: string): void {
        if (!this.canManageUnit(user, targetUnitId)) {
            throw new ForbiddenException(
                'Aislamiento de Unidad: Solo puedes gestionar datos de tu propia unidad asignada',
            );
        }
    }
}
