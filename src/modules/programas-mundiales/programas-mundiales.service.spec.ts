import { Test, TestingModule } from '@nestjs/testing';
import { ProgramasMundialesService } from './programas-mundiales.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProgramasMundialesService', () => {
    let service: ProgramasMundialesService;
    let prisma: any;

    let mockPrisma: any;

    beforeEach(async () => {
        mockPrisma = {
            programaMundial: { findMany: jest.fn() },
            miembroProgramaMundial: { findMany: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProgramasMundialesService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<ProgramasMundialesService>(ProgramasMundialesService);
        prisma = module.get(PrismaService);
        jest.clearAllMocks();
    });

    describe('findAllCatalog', () => {
        it('lista solo programas activos y no eliminados', async () => {
            const catalogo = [{ id: 'p1', nombre: 'Programa Uno', activo: true }];
            prisma.programaMundial.findMany.mockResolvedValue(catalogo);

            const result = await service.findAllCatalog();

            expect(result).toEqual(catalogo);
            expect(prisma.programaMundial.findMany).toHaveBeenCalledWith({
                where: { activo: true, deletedAt: null },
            });
        });

        it('propaga el error de Prisma al listar el catalogo', async () => {
            prisma.programaMundial.findMany.mockRejectedValue(new Error('catalogo no disponible'));

            await expect(service.findAllCatalog()).rejects.toThrow('catalogo no disponible');
        });
    });

    describe('findByMiembro', () => {
        it('filtra por miembro, excluye eliminados e incluye el programa mundial', async () => {
            const inscripciones = [
                {
                    id: 'i1',
                    miembroId: 'm1',
                    ProgramaMundial: { id: 'p1', nombre: 'Programa Uno' },
                },
            ];
            prisma.miembroProgramaMundial.findMany.mockResolvedValue(inscripciones);

            const result = await service.findByMiembro('m1');

            expect(result).toEqual(inscripciones);
            expect(prisma.miembroProgramaMundial.findMany).toHaveBeenCalledWith({
                where: { miembroId: 'm1', deletedAt: null },
                include: { ProgramaMundial: true },
            });
        });

        it('devuelve una lista vacia si el miembro no tiene programas inscriptos', async () => {
            prisma.miembroProgramaMundial.findMany.mockResolvedValue([]);

            const result = await service.findByMiembro('m404');

            expect(result).toEqual([]);
        });

        it('propaga el error de Prisma al buscar inscripciones', async () => {
            prisma.miembroProgramaMundial.findMany.mockRejectedValue(new Error('timeout en la consulta'));

            await expect(service.findByMiembro('m1')).rejects.toThrow('timeout en la consulta');
        });
    });
});
