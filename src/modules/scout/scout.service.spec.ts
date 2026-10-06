import { Test, TestingModule } from '@nestjs/testing';
import { ScoutService } from './scout.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ScoutService', () => {
    let service: ScoutService;

    const mockPrisma = {
        condecoracion: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        miembroCondecoracion: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ScoutService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();

        service = module.get<ScoutService>(ScoutService);
        jest.clearAllMocks();
    });

    describe('createCondecoracion', () => {
        it('crea la condecoración registrando autor y fecha', async () => {
            mockPrisma.condecoracion.create.mockResolvedValue({
                id: 'c1',
                nombre: 'Cruz al Mérito',
                createdBy: 'u1',
            });

            const result = await service.createCondecoracion(
                { nombre: 'Cruz al Mérito', descripcion: 'Servicio destacado' },
                'u1',
            );

            expect(mockPrisma.condecoracion.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    nombre: 'Cruz al Mérito',
                    descripcion: 'Servicio destacado',
                    createdBy: 'u1',
                    createdAt: expect.any(Date),
                }),
            });
            expect(result.id).toBe('c1');
        });
    });

    describe('findAllCondecoraciones', () => {
        it('lista solo las condecoraciones activas ordenadas por nombre', async () => {
            const mockCondecoraciones = [
                { id: 'c2', nombre: 'Cruz Scout' },
                { id: 'c1', nombre: 'Cruz al Mérito' },
            ];
            mockPrisma.condecoracion.findMany.mockResolvedValue(mockCondecoraciones);

            const result = await service.findAllCondecoraciones();

            expect(result).toEqual(mockCondecoraciones);
            expect(mockPrisma.condecoracion.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                orderBy: { nombre: 'asc' },
            });
        });
    });

    describe('findCondecoracionById', () => {
        it('devuelve la condecoración activa y lanza NotFoundException si fue borrada', async () => {
            mockPrisma.condecoracion.findFirst.mockResolvedValueOnce({ id: 'c1', nombre: 'Cruz' });

            const result = await service.findCondecoracionById('c1');

            expect(result).toEqual({ id: 'c1', nombre: 'Cruz' });
            expect(mockPrisma.condecoracion.findFirst).toHaveBeenCalledWith({
                where: { id: 'c1', deletedAt: null },
            });

            mockPrisma.condecoracion.findFirst.mockResolvedValue(null);

            await expect(service.findCondecoracionById('c1')).rejects.toThrow(NotFoundException);
            await expect(service.findCondecoracionById('c1')).rejects.toThrow(
                'Condecoración no encontrada',
            );
        });
    });

    describe('removeCondecoracion', () => {
        it('hace soft delete con el usuario que lo ejecuta', async () => {
            mockPrisma.condecoracion.findFirst.mockResolvedValue({ id: 'c1' });
            mockPrisma.condecoracion.update.mockResolvedValue({ id: 'c1', deletedAt: new Date() });

            const result = await service.removeCondecoracion('c1', 'u1');

            expect(mockPrisma.condecoracion.findFirst).toHaveBeenCalledWith({
                where: { id: 'c1', deletedAt: null },
            });
            expect(mockPrisma.condecoracion.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                    updatedBy: 'u1',
                }),
            });
            expect(result.id).toBe('c1');
        });
    });

    describe('findJovenCondecoraciones', () => {
        it('lista las condecoraciones del miembro con su detalle', async () => {
            const otorgadas = [
                { id: 'mc1', miembroId: 'm1', Condecoracion: { id: 'c1', nombre: 'Cruz' } },
            ];
            mockPrisma.miembroCondecoracion.findMany.mockResolvedValue(otorgadas);

            const result = await service.findJovenCondecoraciones('m1');

            expect(result).toEqual(otorgadas);
            expect(mockPrisma.miembroCondecoracion.findMany).toHaveBeenCalledWith({
                where: { miembroId: 'm1', deletedAt: null },
                include: { Condecoracion: true },
                orderBy: { fechaOtorgada: 'desc' },
            });
        });
    });

    describe('removeJovenCondecoracion', () => {
        it('rechaza si el miembro no tiene la condecoración y si no, anula el otorgamiento', async () => {
            mockPrisma.miembroCondecoracion.findFirst.mockResolvedValueOnce(null);

            await expect(service.removeJovenCondecoracion('mc1', 'u1')).rejects.toThrow(
                NotFoundException,
            );
            expect(mockPrisma.miembroCondecoracion.update).not.toHaveBeenCalled();

            mockPrisma.miembroCondecoracion.findFirst.mockResolvedValue({ id: 'mc1' });
            mockPrisma.miembroCondecoracion.update.mockResolvedValue({ id: 'mc1' });

            const result = await service.removeJovenCondecoracion('mc1', 'u1');

            expect(mockPrisma.miembroCondecoracion.findFirst).toHaveBeenCalledWith({
                where: { id: 'mc1', deletedAt: null },
            });
            expect(mockPrisma.miembroCondecoracion.update).toHaveBeenCalledWith({
                where: { id: 'mc1' },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                    updatedBy: 'u1',
                }),
            });
            expect(result.id).toBe('mc1');
        });
    });

    describe('otorgarCondecoracion', () => {
        it('registra el otorgamiento con fecha actual y autor', async () => {
            mockPrisma.miembroCondecoracion.create.mockResolvedValue({
                id: 'mc1',
                miembroId: 'm1',
                condecoracionId: 'c1',
            });

            const result = await service.otorgarCondecoracion('m1', 'c1', 'u1');

            expect(mockPrisma.miembroCondecoracion.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    miembroId: 'm1',
                    condecoracionId: 'c1',
                    createdBy: 'u1',
                    fechaOtorgada: expect.any(Date),
                    createdAt: expect.any(Date),
                }),
            });
            expect(result.id).toBe('mc1');
        });
    });

    describe('findAll heredado de BaseService', () => {
        it('aplica soft delete global sobre el modelo condecoracion', async () => {
            mockPrisma.condecoracion.findMany.mockResolvedValue([{ id: 'c1' }]);

            const result = await service.findAll({ activo: true });

            expect(mockPrisma.condecoracion.findMany).toHaveBeenCalledWith({
                where: { activo: true, deletedAt: null },
            });
            expect(result).toHaveLength(1);
        });
    });
});
