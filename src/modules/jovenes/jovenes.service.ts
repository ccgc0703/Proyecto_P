import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { CreateJovenDto } from './dto/create-joven.dto';
import { UpdateJovenDto } from './dto/update-joven.dto';
import { AuditService } from '../audit/audit.service';

/** Mapeo: rol RBAC de adulto → nombre canónico de la unidad */
const ADULT_UNIT_MAP: Record<string, string> = {
    ADULTO_MANADA: 'Manada',
    ADULTO_TROPA: 'Tropa',
    ADULTO_CLAN: 'Clan',
};

/** Roles que no tienen restricción por unidad */
const UNIT_BYPASS_ROLES = ['SYSTEM_ADMIN', 'GROUP_LEADER'];

@Injectable()
export class JovenesService extends BaseService<any> {
    constructor(
        prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {
        super(prisma, 'joven');
    }

    /**
     * Valida que el actor tenga acceso a la unidad del joven.
     * - SYSTEM_ADMIN y GROUP_LEADER → bypass (sin restricción)
     * - ADULTO_MANADA/TROPA/CLAN → solo su unidad asignada
     * - Otros roles → sin restricción de unidad (se controlan por permisos RBAC)
     */
    private async validateUnitAccess(actorId: string, unidadId: string): Promise<void> {
        const actorRoles = await this.prisma.usuarioRol.findMany({
            where: { usuarioId: actorId, deletedAt: null },
            include: { Rol: true },
        });

        const roleNames = actorRoles.map(ur => ur.Rol.nombre);

        if (roleNames.some(r => UNIT_BYPASS_ROLES.includes(r))) {
            return;
        }

        const adultRole = roleNames.find(r => r in ADULT_UNIT_MAP);
        if (!adultRole) {
            return;
        }

        const unidad = await this.prisma.unidad.findFirst({
            where: { id: unidadId, deletedAt: null },
            select: { nombre: true },
        });

        if (!unidad) return;

        const allowedUnit = ADULT_UNIT_MAP[adultRole];
        if (unidad.nombre !== allowedUnit) {
            throw new ForbiddenException('No tienes acceso a jóvenes de otra unidad');
        }
    }

    async findAllByUnit(unidadId: string) {
        return this.prisma.joven.findMany({
            where: {
                unidadId,
                deletedAt: null,
            },
            include: {
                Unidad: true,
                Representante: true,
            },
        });
    }

    async createJoven(createJovenDto: CreateJovenDto, userId: string, userRol: string, userUnidadId?: string) {
        await this.validateUnitAccess(userId, createJovenDto.unidadId);

        const joven = await super.create(
            {
                ...createJovenDto,
                fechaNacimiento: new Date(createJovenDto.fechaNacimiento),
            },
            userId,
        );

        await this.auditService.logAction({
            actorId: userId,
            action: 'JOVEN_CREATED',
            module: 'jovenes',
            targetId: joven.id,
            description: 'Joven registrado',
        });

        return joven;
    }

    async updateJoven(id: string, dto: UpdateJovenDto, actorId: string) {
        const joven = await this.findOne(id);

        // Validar acceso a la unidad actual del joven
        await this.validateUnitAccess(actorId, joven.unidadId);

        // Si cambia de unidad, validar también acceso a la nueva unidad
        if (dto.unidadId && dto.unidadId !== joven.unidadId) {
            await this.validateUnitAccess(actorId, dto.unidadId);
        }

        const updateData: any = {};
        if (dto.nombres !== undefined) updateData.nombres = dto.nombres;
        if (dto.apellidos !== undefined) updateData.apellidos = dto.apellidos;
        if (dto.fechaNacimiento !== undefined) updateData.fechaNacimiento = new Date(dto.fechaNacimiento);
        if (dto.unidadId !== undefined) updateData.unidadId = dto.unidadId;
        updateData.updatedBy = actorId;

        const updated = await this.prisma.joven.update({
            where: { id },
            data: updateData,
        });

        await this.auditService.logAction({
            actorId,
            action: 'JOVEN_UPDATED',
            module: 'jovenes',
            targetId: updated.id,
            description: 'Joven actualizado',
        });

        return updated;
    }

    /**
     * Elimina un joven (soft delete) con validación de acceso por unidad.
     */
    async removeJoven(id: string, actorId: string) {
        const joven = await this.findOne(id);
        await this.validateUnitAccess(actorId, joven.unidadId);
        const result = await super.remove(id, actorId);

        await this.auditService.logAction({
            actorId,
            action: 'JOVEN_DELETED',
            module: 'jovenes',
            targetId: id,
            description: 'Joven eliminado (soft delete)',
        });

        return result;
    }
}



