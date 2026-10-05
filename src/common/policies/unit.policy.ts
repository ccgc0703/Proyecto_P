import { Injectable, ForbiddenException } from '@nestjs/common';
import { RBAC_ROLES } from '../constantes';
import { NodoPolicy } from './nodo.policy';

/**
 * UnitPolicy — Capa ABAC (Attribute-Based Access Control)
 *
 * Controla el aislamiento por unidad: ciertos roles solo pueden
 * gestionar datos de su propia unidad asignada.
 *
 * F4.3 — Ámbito jerárquico (`Usuario.nodoId`):
 * - Si el usuario tiene nodoId, su visión se restringe al subárbol de ese nodo
 *   (unidades cuyo grupoId caiga dentro del subárbol), salvo SYSTEM_ADMIN.
 * - Sin nodoId, el comportamiento es idéntico al anterior (retro-compatible).
 */
@Injectable()
export class UnitPolicy {
    /** Roles que están restringidos a su propia unidad */
    private readonly unitRestrictedRoles: string[] = [
        RBAC_ROLES.ADULTO_MANADA,
        RBAC_ROLES.ADULTO_TROPA,
        RBAC_ROLES.ADULTO_COMUNIDAD,
        RBAC_ROLES.ADULTO_CLAN,
    ];

    constructor(private readonly nodoPolicy: NodoPolicy) { }

    /**
     * Determina si el usuario tiene algún rol que deba estar restringido a una unidad.
     */
    isRestricted(user: any): boolean {
        if (!user?.roles || !Array.isArray(user.roles)) return false;
        return user.roles.some((role: string) => this.unitRestrictedRoles.includes(role));
    }

    /** El rol SYSTEM_ADMIN ignora el aislamiento por nodo. */
    private esSistema(user: any): boolean {
        return Array.isArray(user?.roles) && user.roles.includes(RBAC_ROLES.SYSTEM_ADMIN);
    }

    /**
     * Devuelve true si el usuario puede operar sobre la unidad indicada.
     * - Admin: sin restricción de unidad ni de nodo.
     * - Sin nodoId: sin restricción (salvo los roles restringidos a su unidad).
     * - Con nodoId: solo unidades dentro de su subárbol jerárquico.
     * - Jefe/Subjefe de Grupo: visión global salvo que tengan nodoId.
     * - Adulto de Unidad: su unidad asignada (y dentro del subárbol si tiene nodoId).
     */
    async canManageUnit(user: any, targetUnitId?: string): Promise<boolean> {
        if (this.isRestricted(user)) {
            if (!targetUnitId || user?.unidadId !== targetUnitId) return false;
            if (user?.nodoId) return this.nodoPolicy.unidadEnAlcance(user.nodoId, targetUnitId);
            return true;
        }

        if (this.esSistema(user)) return true;

        if (user?.nodoId) {
            if (!targetUnitId) return false;
            return this.nodoPolicy.unidadEnAlcance(user.nodoId, targetUnitId);
        }

        return true;
    }

    /**
     * Lanza ForbiddenException si el usuario no puede gestionar la unidad.
     */
    async assertCanManageUnit(user: any, targetUnitId?: string): Promise<void> {
        if (await this.canManageUnit(user, targetUnitId)) return;

        const falloPorNodo =
            !!user?.nodoId &&
            !!targetUnitId &&
            !this.esSistema(user) &&
            (!this.isRestricted(user) || user.unidadId === targetUnitId);

        if (falloPorNodo) {
            throw new ForbiddenException(
                'Aislamiento por nodo: la unidad está fuera de tu ámbito jerárquico',
            );
        }

        throw new ForbiddenException(
            'Aislamiento de Unidad: Solo puedes gestionar datos de tu propia unidad asignada',
        );
    }

    /**
     * Unidades que el usuario puede listar.
     * - null → visión global (sin filtro de unidad).
     * - string[] → solo esas unidades (vacío = no puede ver ninguna).
     */
    async unidadesAlcance(user: any): Promise<string[] | null> {
        if (this.isRestricted(user)) {
            if (!user?.unidadId) return [];
            if (user?.nodoId) {
                const alcance = await this.nodoPolicy.unidadesEnAlcance(user.nodoId);
                return alcance.filter((id) => id === user.unidadId);
            }
            return [user.unidadId];
        }

        if (this.esSistema(user)) return null;

        if (user?.nodoId) return this.nodoPolicy.unidadesEnAlcance(user.nodoId);

        return null;
    }
}
