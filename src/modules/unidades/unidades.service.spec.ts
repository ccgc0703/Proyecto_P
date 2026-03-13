import { Test, TestingModule } from '@nestjs/testing';
import { UnidadesService } from './unidades.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UnidadesService', () => {
    let service: UnidadesService;
    let prisma: any;

    const mockPrisma = {
        unidad: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UnidadesService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<UnidadesService>(UnidadesService);
        prisma = module.get(PrismaService);
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return an array of unidades', async () => {
            const mockUnidades = [
                { id: '1', nombre: 'Manada', tipo: 'MANADA' },
                { id: '2', nombre: 'Tropa', tipo: 'TROPA' },
            ];
            mockPrisma.unidad.findMany.mockResolvedValue(mockUnidades);

            const result = await service.findAll();

            expect(result).toEqual(mockUnidades);
            expect(mockPrisma.unidad.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
            });
        });
    });

    describe('findOne', () => {
        it('should return a unidad by id', async () => {
            const mockUnidad = { id: '1', nombre: 'Manada', tipo: 'MANADA' };
            mockPrisma.unidad.findFirst.mockResolvedValue(mockUnidad);

            const result = await service.findOne('1');

            expect(result).toEqual(mockUnidad);
        });
    });

    describe('create', () => {
        it('should create a unidad', async () => {
            const newUnidad = { nombre: 'Nueva Unidad', tipo: 'CLAN' };
            mockPrisma.unidad.create.mockResolvedValue({ id: '1', ...newUnidad });

            const result = await service.create(newUnidad, 'user-1');

            expect(result.nombre).toBe('Nueva Unidad');
            expect(mockPrisma.unidad.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    nombre: 'Nueva Unidad',
                    tipo: 'CLAN',
                    createdBy: 'user-1',
                }),
            });
        });
    });
});
