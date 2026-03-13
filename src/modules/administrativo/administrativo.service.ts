import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { CreateRepresentanteDto } from './dto/create-representante.dto';
import { UpdateRepresentanteDto } from './dto/update-representante.dto';

@Injectable()
export class AdministrativoService extends BaseService<any> {
    constructor(prisma: PrismaService) {
        super(prisma, 'representante');
    }

    async createRepresentante(dto: CreateRepresentanteDto, userId: string) {
        const existing = await this.prisma.representante.findUnique({
            where: { cedula: dto.cedula },
        });

        if (existing) {
            throw new ConflictException('La cédula ya está registrada para otro representante');
        }

        return super.create(dto, userId);
    }

    async updateRepresentante(id: string, dto: UpdateRepresentanteDto, userId: string) {
        await this.findOne(id);
        return super.update(id, dto, userId);
    }

    async createFichaMedica(data: any, userId: string) {
        return this.prisma.fichaMedica.create({
            data: {
                ...data,
                createdAt: new Date(),
                createdBy: userId,
            },
        });
    }
}
