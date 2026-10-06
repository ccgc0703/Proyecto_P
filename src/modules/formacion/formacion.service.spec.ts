import { Test, TestingModule } from '@nestjs/testing';
import { FormacionService } from './formacion.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FormacionService', () => {
    let service: FormacionService;
    let prisma: any;

    let mockPrisma: any;

    beforeEach(async () => {
        mockPrisma = {
            formacion: { findMany: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FormacionService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<FormacionService>(FormacionService);
        prisma = module.get(PrismaService);
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('devuelve las formaciones incluyendo el adulto responsable', async () => {
            const formaciones = [
                { id: 'f1', titulo: 'Curso de Formacion', adultoId: 'a1', Adulto: { id: 'a1', nombre: 'MARIA' } },
            ];
            prisma.formacion.findMany.mockResolvedValue(formaciones);

            const result = await service.findAll();

            expect(result).toEqual(formaciones);
            expect(prisma.formacion.findMany).toHaveBeenCalledWith({ include: { Adulto: true } });
        });

        it('propaga el error de Prisma al listar formaciones', async () => {
            prisma.formacion.findMany.mockRejectedValue(new Error('consulta fallida'));

            await expect(service.findAll()).rejects.toThrow('consulta fallida');
        });
    });

    describe('findByAdulto', () => {
        it('filtra las formaciones por adultoId', async () => {
            const formaciones = [{ id: 'f1', adultoId: 'a1' }];
            prisma.formacion.findMany.mockResolvedValue(formaciones);

            const result = await service.findByAdulto('a1');

            expect(result).toEqual(formaciones);
            expect(prisma.formacion.findMany).toHaveBeenCalledWith({ where: { adultoId: 'a1' } });
        });

        it('devuelve una lista vacia si el adulto no tiene formaciones', async () => {
            prisma.formacion.findMany.mockResolvedValue([]);

            const result = await service.findByAdulto('a404');

            expect(result).toEqual([]);
        });

        it('propaga el error de Prisma al buscar por adulto', async () => {
            prisma.formacion.findMany.mockRejectedValue(new Error('timeout en la consulta'));

            await expect(service.findByAdulto('a1')).rejects.toThrow('timeout en la consulta');
        });
    });
});
