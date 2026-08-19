import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFichaMedicaDto } from './dto/create-ficha-medica.dto';
import { UpdateFichaMedicaDto } from './dto/update-ficha-medica.dto';

@Injectable()
export class FichaMedicaService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateFichaMedicaDto, userId: string) {
        const existing = await this.prisma.fichaMedica.findUnique({
            where: { miembroId: dto.miembroId },
        });

        if (existing) {
            throw new ConflictException('El miembro ya tiene una ficha médica registrada');
        }

        return this.prisma.fichaMedica.create({
            data: {
                ...dto,
                createdAt: new Date(),
                createdBy: userId,
            },
        });
    }

    async findAll() {
        return this.prisma.fichaMedica.findMany({
            where: { deletedAt: null },
            include: { Miembro: true },
        });
    }

    async findByMiembro(miembroId: string) {
        const ficha = await this.prisma.fichaMedica.findUnique({
            where: { miembroId },
            include: { Miembro: true },
        });
        if (!ficha || ficha.deletedAt) {
            throw new NotFoundException('Ficha médica no encontrada');
        }
        return ficha;
    }

    async findOne(id: string) {
        const ficha = await this.prisma.fichaMedica.findFirst({
            where: { id, deletedAt: null },
            include: { Miembro: true },
        });
        if (!ficha) {
            throw new NotFoundException('Ficha médica no encontrada');
        }
        return ficha;
    }

    async update(id: string, dto: UpdateFichaMedicaDto, userId: string) {
        await this.findOne(id);
        return this.prisma.fichaMedica.update({
            where: { id },
            data: {
                ...dto,
                updatedAt: new Date(),
                updatedBy: userId,
            },
        });
    }

    async remove(id: string, userId: string) {
        await this.findOne(id);
        return this.prisma.fichaMedica.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }
}
