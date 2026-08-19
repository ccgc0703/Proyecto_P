import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';

@Injectable()
export class UnidadesService extends BaseService<any> {
    constructor(prisma: PrismaService) {
        super(prisma, 'unidad');
    }

    async getPatrullas(unidadId: string) {
        return this.prisma.patrulla.findMany({
            where: { unidadId, deletedAt: null },
        });
    }
}
