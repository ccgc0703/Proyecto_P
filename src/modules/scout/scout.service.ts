import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { ROLES } from '../../common/constantes';

@Injectable()
export class ScoutService extends BaseService<any> {
    constructor(prisma: PrismaService) {
        super(prisma, 'progresion');
    }

    async createProgresion(data: any, userId: string) {
        return this.prisma.progresion.create({
            data: {
                ...data,
                createdAt: new Date(),
                createdBy: userId,
            },
        });
    }

    async findAllProgresiones() {
        return this.prisma.progresion.findMany({
            where: { deletedAt: null },
            include: { Joven: true, Unidad: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findProgresionById(id: string) {
        const progresion = await this.prisma.progresion.findFirst({
            where: { id, deletedAt: null },
            include: { Joven: true, Unidad: true },
        });
        if (!progresion) {
            throw new NotFoundException('Progresión no encontrada');
        }
        return progresion;
    }

    async updateProgresion(id: string, data: any, userId: string) {
        await this.findProgresionById(id);
        return this.prisma.progresion.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
                updatedBy: userId,
            },
        });
    }

    async removeProgresion(id: string, userId: string) {
        await this.findProgresionById(id);
        return this.prisma.progresion.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }

    async createCondecoracion(data: any, userId: string) {
        return this.prisma.condecoracion.create({
            data: {
                ...data,
                createdAt: new Date(),
                createdBy: userId,
            },
        });
    }

    async findAllCondecoraciones() {
        return this.prisma.condecoracion.findMany({
            where: { deletedAt: null },
            orderBy: { nombre: 'asc' },
        });
    }

    async findCondecoracionById(id: string) {
        const condecoracion = await this.prisma.condecoracion.findFirst({
            where: { id, deletedAt: null },
        });
        if (!condecoracion) {
            throw new NotFoundException('Condecoración no encontrada');
        }
        return condecoracion;
    }

    async removeCondecoracion(id: string, userId: string) {
        await this.findCondecoracionById(id);
        return this.prisma.condecoracion.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }

    async findJovenCondecoraciones(jovenId: string) {
        return this.prisma.jovenCondecoracion.findMany({
            where: { jovenId, deletedAt: null },
            include: { Condecoracion: true },
            orderBy: { fechaOtorgada: 'desc' },
        });
    }

    async removeJovenCondecoracion(id: string, userId: string) {
        const jovenCondec = await this.prisma.jovenCondecoracion.findFirst({
            where: { id, deletedAt: null },
        });
        if (!jovenCondec) {
            throw new NotFoundException('Condecoración del joven no encontrada');
        }
        return this.prisma.jovenCondecoracion.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }

    async otorgarCondecoracion(jovenId: string, condecoracionId: string, userId: string) {
        return (this as any).prisma.jovenCondecoracion.create({
            data: {
                jovenId,
                condecoracionId,
                fechaOtorgada: new Date(),
                createdAt: new Date(),
                createdBy: userId,
            },
        });
    }
}
