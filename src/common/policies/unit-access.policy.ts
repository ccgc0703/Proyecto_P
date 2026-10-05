import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { NodoPolicy } from './nodo.policy';

export const ADULT_UNIT_MAP: Record<string, string> = {
    ADULTO_MANADA: 'Manada',
    ADULTO_TROPA: 'Tropa',
    ADULTO_COMUNIDAD: 'Comunidad',
    ADULTO_CLAN: 'Clan',
};

export const UNIT_BYPASS_ROLES = ['SYSTEM_ADMIN', 'GROUP_LEADER', 'GROUP_SUBLEADER'];

export interface ActorScope {
    roleNames: string[];
    nodoId: string | null;
}

/**
 * Aislamiento por unidad (ABAC) resuelto contra DB a partir del actor.
 *
 * - SYSTEM_ADMIN: acceso total.
 * - Actor con nodoId (F4.3): solo unidades dentro de su subárbol jerárquico.
 * - Roles de bypass (§7.4): acceso a todas las unidades (salvo nodoId).
 * - ADULTO_*: solo su propia unidad.
 * - Cualquier otro rol: sin restricción de unidad aquí (el RBAC por permisos
 *   es quien decide si puede actuar).
 */
@Injectable()
export class UnitAccessPolicy {
    constructor(
        private readonly prisma: PrismaService,
        private readonly nodoPolicy: NodoPolicy,
    ) { }

    /** Roles y nodoId del actor en una sola query. */
    async getActorScope(actorId: string): Promise<ActorScope> {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: actorId },
            select: {
                nodoId: true,
                UsuarioRoles: {
                    where: { deletedAt: null },
                    select: { Rol: { select: { nombre: true } } },
                },
            },
        });

        if (!usuario) return { roleNames: [], nodoId: null };

        return {
            roleNames: usuario.UsuarioRoles.map((ur) => ur.Rol.nombre),
            nodoId: usuario.nodoId,
        };
    }

    async getRoleNames(actorId: string): Promise<string[]> {
        return (await this.getActorScope(actorId)).roleNames;
    }

    async hasBypass(actorId: string): Promise<boolean> {
        const roles = await this.getRoleNames(actorId);
        return roles.some((r) => UNIT_BYPASS_ROLES.includes(r));
    }

    async assertCanAccessUnit(actorId: string, unidadId: string): Promise<void> {
        const { roleNames, nodoId } = await this.getActorScope(actorId);

        if (roleNames.some((r) => r === 'SYSTEM_ADMIN')) return;

        // F4.3: ámbito jerárquico — precede al bypass de grupo/distrito/región.
        if (nodoId) {
            const enAlcance = await this.nodoPolicy.unidadEnAlcance(nodoId, unidadId);
            if (!enAlcance) {
                throw new ForbiddenException(
                    'Aislamiento por nodo: la unidad está fuera de tu ámbito jerárquico',
                );
            }
        }

        if (!nodoId && roleNames.some((r) => UNIT_BYPASS_ROLES.includes(r))) return;

        const adultRole = roleNames.find((r) => r in ADULT_UNIT_MAP);
        if (!adultRole) {
            return;
        }

        const unidad = await this.prisma.unidad.findFirst({
            where: { id: unidadId, deletedAt: null },
            select: { nombre: true },
        });
        if (!unidad) return;

        if (unidad.nombre !== ADULT_UNIT_MAP[adultRole]) {
            throw new ForbiddenException('No tienes acceso a jóvenes de otra unidad');
        }
    }

    /** Devuelve la unidad asignada a un rol ADULTO_* del actor, si existe. */
    unidadDeAdulto(roleNames: string[]): string | undefined {
        const adultRole = roleNames.find((r) => r in ADULT_UNIT_MAP);
        return adultRole ? ADULT_UNIT_MAP[adultRole] : undefined;
    }
}
