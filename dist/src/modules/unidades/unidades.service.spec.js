"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const unidades_service_1 = require("./unidades.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('UnidadesService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        unidad: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                unidades_service_1.UnidadesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(unidades_service_1.UnidadesService);
        prisma = module.get(prisma_service_1.PrismaService);
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
            mockPrisma.unidad.create.mockResolvedValue(Object.assign({ id: '1' }, newUnidad));
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
//# sourceMappingURL=unidades.service.spec.js.map