import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';

@Injectable()
export class ScoutService extends BaseService<any> {
    constructor(prisma: PrismaService) {
        super(prisma, 'condecoracion');
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

    async findJovenCondecoraciones(miembroId: string) {
        return this.prisma.miembroCondecoracion.findMany({
            where: { miembroId, deletedAt: null },
            include: { Condecoracion: true },
            orderBy: { fechaOtorgada: 'desc' },
        });
    }

    async removeJovenCondecoracion(id: string, userId: string) {
        const miembroCondec = await this.prisma.miembroCondecoracion.findFirst({
            where: { id, deletedAt: null },
        });
        if (!miembroCondec) {
            throw new NotFoundException('Condecoración del miembro no encontrada');
        }
        return this.prisma.miembroCondecoracion.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }

    async otorgarCondecoracion(miembroId: string, condecoracionId: string, userId: string) {
        return (this as any).prisma.miembroCondecoracion.create({
            data: {
                miembroId,
                condecoracionId,
                fechaOtorgada: new Date(),
                createdAt: new Date(),
                createdBy: userId,
            },
        });
    }
}
