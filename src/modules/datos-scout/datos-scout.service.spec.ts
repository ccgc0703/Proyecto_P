import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DatosScoutService } from './datos-scout.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DatosScoutService', () => {
    let service: DatosScoutService;
    let prisma: any;

    let mockPrisma: any;

    beforeEach(async () => {
        mockPrisma = {
            datosScout: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DatosScoutService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<DatosScoutService>(DatosScoutService);
        prisma = module.get(PrismaService);
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('devuelve todos los datos scout', async () => {
            const datos = [
                { id: 'd1', miembroId: 'm1', agrupamiento: 'SCOUTS' },
                { id: 'd2', miembroId: 'm2', agrupamiento: 'ROVERS' },
            ];
            prisma.datosScout.findMany.mockResolvedValue(datos);

            const result = await service.findAll();

            expect(result).toEqual(datos);
            expect(prisma.datosScout.findMany).toHaveBeenCalledTimes(1);
        });

        it('propaga el error de Prisma', async () => {
            prisma.datosScout.findMany.mockRejectedValue(new Error('conexion caida'));

            await expect(service.findAll()).rejects.toThrow('conexion caida');
        });
    });

    describe('findByMiembro', () => {
        it('devuelve los datos scout del miembro', async () => {
            const datos = { id: 'd1', miembroId: 'm1', agrupamiento: 'SCOUTS' };
            prisma.datosScout.findUnique.mockResolvedValue(datos);

            const result = await service.findByMiembro('m1');

            expect(result).toEqual(datos);
            expect(prisma.datosScout.findUnique).toHaveBeenCalledWith({ where: { miembroId: 'm1' } });
        });

        it('lanza NotFoundException si el miembro no tiene datos scout', async () => {
            prisma.datosScout.findUnique.mockResolvedValue(null);

            await expect(service.findByMiembro('m404')).rejects.toThrow(NotFoundException);
        });

        it('no convierte un error de Prisma en NotFound', async () => {
            prisma.datosScout.findUnique.mockRejectedValue(new Error('timeout en la consulta'));

            await expect(service.findByMiembro('m1')).rejects.toThrow('timeout en la consulta');
        });
    });
});
