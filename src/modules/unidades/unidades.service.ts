import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';

const UNIT_INCLUDE = {
    Usuarios: {
        where: { deletedAt: null },
        select: { id: true, nombre: true, apellido: true },
    },
};

@Injectable()
export class UnidadesService extends BaseService<any> {
    constructor(prisma: PrismaService) {
        super(prisma, 'unidad');
    }

    async findAll(where: any = {}) {
        return this.prisma.unidad.findMany({
            where: {
                ...where,
                deletedAt: null,
            },
            include: UNIT_INCLUDE,
        });
    }

    async findOne(id: string) {
        const record = await this.prisma.unidad.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: UNIT_INCLUDE,
        });
        if (!record) {
            throw new NotFoundException(`Unidad con ID ${id} no encontrada`);
        }
        return record;
    }

    async getPatrullas(unidadId: string) {
        return this.prisma.patrulla.findMany({
            where: { unidadId, deletedAt: null },
        });
    }

    async createPatrulla(data: { nombre: string; unidadId: string; color?: string }, userId: string) {
        return this.prisma.patrulla.create({
            data: {
                nombre: data.nombre.toUpperCase(),
                unidadId: data.unidadId,
                color: data.color || null,
                createdBy: userId,
            },
        });
    }

    async removePatrulla(id: string, userId: string) {
        return this.prisma.patrulla.update({
            where: { id },
            data: { deletedAt: new Date(), createdBy: userId },
        });
    }
}
