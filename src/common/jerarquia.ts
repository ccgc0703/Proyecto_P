import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../modules/prisma/prisma.service';

/**
 * Jerarquía de roles — nivel más alto = más privilegios.
 * Fuente única de verdad backend: usada por RbacService (asignación de roles)
 * y por AdultosService (alta de staff con rol inicial).
 */
export const ROLE_HIERARCHY: Record<string, number> = {
    SYSTEM_ADMIN: 100,
    NATIONAL_BOARD: 95,
    NATIONAL_EXECUTIVE: 93,
    NATIONAL_DIR_JOVENES: 91,
    NATIONAL_DIR_ADULTOS: 91,
    NATIONAL_DIR_DESARROLLO: 91,
    NATIONAL_COLABORADOR: 90,
    REGION_COMMISSIONER: 85,
    REGION_ASSISTANT: 83,
    REGION_COLABORADOR: 82,
    DISTRICT_COMMISSIONER: 75,
    DISTRICT_ASSISTANT: 73,
    DISTRICT_COLABORADOR: 72,
    GROUP_LEADER: 70,
    GROUP_SUBLEADER: 65,
    REPRESENTANTE_UNIDAD: 45,
    ADULTO_MANADA: 40,
    ADULTO_TROPA: 40,
    ADULTO_CLAN: 40,
    ADULTO_COMUNIDAD: 40,
    ADULTO_COLABORADOR: 35,
    CONSULTOR: 10,
    JOVEN: 5,
};

/**
 * Valida que `actorId` pueda asignar `rolNombre`: el nivel del rol objetivo
 * debe ser estrictamente menor al nivel máximo del actor (previene autoascensión
 * y escalada de privilegios). Lanza ForbiddenException (403) si no corresponde.
 */
export async function verificarJerarquiaAsignacion(
    prisma: PrismaService,
    rolNombre: string,
    actorId: string,
): Promise<void> {
    const targetLevel = ROLE_HIERARCHY[rolNombre] ?? 0;

    const actorRoles = await prisma.usuarioRol.findMany({
        where: { usuarioId: actorId, deletedAt: null },
        include: { Rol: true },
    });
    const actorMaxLevel = actorRoles.reduce(
        (max, ur) => Math.max(max, ROLE_HIERARCHY[ur.Rol.nombre] ?? 0),
        0,
    );

    if (targetLevel >= actorMaxLevel) {
        throw new ForbiddenException('No puedes asignar un rol igual o superior al tuyo');
    }
}
