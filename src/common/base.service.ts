/**
 * Servicio base genérico que centraliza las operaciones CRUD estándar.
 * Incluye soporte para soft delete (borrado lógico) y auditoría.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';

@Injectable()
export abstract class BaseService<T> {
    constructor(
        protected readonly prisma: PrismaService,
        protected readonly model: string,
    ) { }

    /** Recupera todos los registros no eliminados */
    async findAll(where: any = {}) {
        return this.prisma[this.model].findMany({
            where: {
                ...where,
                deletedAt: null,
            },
        });
    }

    /** Recupera un registro por ID, asegurando que no esté eliminado */
    async findOne(id: string) {
        const record = await this.prisma[this.model].findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
        if (!record) {
            throw new NotFoundException(`Record with ID ${id} not found or already deleted.`);
        }
        return record;
    }

    /** Crea un registro asignando el autor de la acción */
    async create(data: any, userId?: string) {
        return this.prisma[this.model].create({
            data: {
                ...data,
                createdAt: new Date(),
                createdBy: userId || 'SYSTEM',
            },
        });
    }

    /** Actualiza un registro por ID, asignando el autor de la acción */
    async update(id: string, data: any, userId?: string) {
        return this.prisma[this.model].update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
                updatedBy: userId || 'SYSTEM',
            },
        });
    }

    /** Realiza un borrado lógico estableciendo la fecha en deletedAt */
    async remove(id: string, userId?: string) {
        return this.prisma[this.model].update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId || 'SYSTEM',
            },
        });
    }
}
