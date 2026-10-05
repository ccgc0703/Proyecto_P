import { Test, TestingModule } from '@nestjs/testing';
import { OrganizacionService } from './organizacion.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('OrganizacionService', () => {
    let service: OrganizacionService;

    const mockPrisma = {
        organizacionNodo: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        unidad: {
            findFirst: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganizacionService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<OrganizacionService>(OrganizacionService);
        jest.clearAllMocks();
    });

    describe('create — cadena jerárquica', () => {
        it('rechaza un REGION sin padre', async () => {
            await expect(
                service.create({ tipo: 'REGION', nombre: 'Norte' } as any, 'actor'),
            ).rejects.toThrow(BadRequestException);
        });

        it('rechaza CONSEJO_NACIONAL con padre', async () => {
            await expect(
                service.create({ tipo: 'CONSEJO_NACIONAL', nombre: 'C', padreId: 'x' } as any, 'actor'),
            ).rejects.toThrow(BadRequestException);
        });

        it('rechaza CONSEJO_NACIONAL si ya existe uno activo', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce({ id: 'existente' });

            await expect(
                service.create({ tipo: 'CONSEJO_NACIONAL', nombre: 'C2' } as any, 'actor'),
            ).rejects.toThrow(ConflictException);
        });

        it('rechaza si el padre tiene el tipo incorrecto', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce({
                id: 'p1',
                tipo: 'GRUPO',
            });

            await expect(
                service.create({ tipo: 'REGION', nombre: 'X', padreId: 'p1' } as any, 'actor'),
            ).rejects.toThrow(BadRequestException);
        });

        it('rechaza si el padre no existe', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce(null);

            await expect(
                service.create({ tipo: 'DISTRITO', nombre: 'X', padreId: 'no-existe' } as any, 'actor'),
            ).rejects.toThrow(NotFoundException);
        });

        it('crea REGION con padre DIRECCION_EJECUTIVA válido (nivel 3)', async () => {
            mockPrisma.organizacionNodo.findMany.mockResolvedValue([]); // sin códigos previos
            mockPrisma.organizacionNodo.findFirst
                .mockResolvedValueOnce({ id: 'p1', tipo: 'DIRECCION_EJECUTIVA' }) // padre
                .mockResolvedValueOnce(null); // REG-01 libre
            mockPrisma.organizacionNodo.create.mockResolvedValue({ id: 'r1', codigo: 'REG-01' });

            const result = await service.create(
                { tipo: 'REGION', nombre: 'Norte', padreId: 'p1' } as any,
                'actor',
            );

            expect(result.codigo).toBe('REG-01');
            expect(mockPrisma.organizacionNodo.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { codigo: { startsWith: 'REG-' } } }),
            );
            expect(mockPrisma.organizacionNodo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ nivel: 3, codigo: 'REG-01' }),
                }),
            );
        });

        it('incrementa el correlativo si el código está ocupado', async () => {
            // Una sola lectura de códigos existentes (max=1) + una existencia del candidato
            mockPrisma.organizacionNodo.findMany.mockResolvedValue([{ codigo: 'GRP-01' }]);
            mockPrisma.organizacionNodo.findFirst
                .mockResolvedValueOnce({ id: 'p1', tipo: 'DISTRITO' }) // padre
                .mockResolvedValueOnce(null); // GRP-02 libre
            mockPrisma.organizacionNodo.create.mockResolvedValue({ codigo: 'GRP-02' });

            const result = await service.create(
                { tipo: 'GRUPO', nombre: 'G', padreId: 'p1' } as any,
                'actor',
            );

            expect(result.codigo).toBe('GRP-02');
        });
    });

    describe('remove', () => {
        it('bloquea la eliminación si tiene hijos activos', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce({ id: 'n1' });
            mockPrisma.organizacionNodo.count.mockResolvedValueOnce(2);

            await expect(service.remove('n1', 'actor')).rejects.toThrow(BadRequestException);
            expect(mockPrisma.organizacionNodo.update).not.toHaveBeenCalled();
        });

        it('bloquea la eliminación si tiene unidades asignadas', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce({ id: 'n1' });
            mockPrisma.organizacionNodo.count.mockResolvedValueOnce(0);
            mockPrisma.unidad.count.mockResolvedValueOnce(4);

            await expect(service.remove('n1', 'actor')).rejects.toThrow(BadRequestException);
            expect(mockPrisma.organizacionNodo.update).not.toHaveBeenCalled();
        });

        it('elimina por soft delete si está vacío', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce({ id: 'n1' });
            mockPrisma.organizacionNodo.count.mockResolvedValueOnce(0);
            mockPrisma.unidad.count.mockResolvedValueOnce(0);
            mockPrisma.organizacionNodo.update.mockResolvedValue({ id: 'n1' });

            await service.remove('n1', 'actor');

            expect(mockPrisma.organizacionNodo.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'n1' },
                    data: expect.objectContaining({ deletedAt: expect.any(Date) }),
                }),
            );
        });
    });

    describe('getArbol', () => {
        it('construye el árbol anidado con unidades', async () => {
            mockPrisma.organizacionNodo.findMany.mockResolvedValue([
                { id: 'c', padreId: null, nivel: 1, Unidades: [] },
                { id: 'd', padreId: 'c', nivel: 2, Unidades: [] },
                {
                    id: 'g',
                    padreId: 'd',
                    nivel: 5,
                    Unidades: [{ id: 'u1', nombre: 'Manada', tipo: 'MANADA', grupoId: 'g' }],
                },
            ]);

            const arbol = await service.getArbol();

            expect(arbol).toHaveLength(1);
            expect(arbol[0].id).toBe('c');
            expect(arbol[0].hijos[0].id).toBe('d');
            expect(arbol[0].hijos[0].hijos[0].Unidades).toHaveLength(1);
        });

        it('trata como raíz un nodo cuyo padre no existe (dato huérfano)', async () => {
            mockPrisma.organizacionNodo.findMany.mockResolvedValue([
                { id: 'huerfano', padreId: 'borrado', nivel: 3, Unidades: [] },
            ]);

            const arbol = await service.getArbol();

            expect(arbol).toHaveLength(1);
            expect(arbol[0].id).toBe('huerfano');
        });
    });

    describe('asignarUnidad', () => {
        it('rechaza si el destino no es un nodo GRUPO', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce(null);

            await expect(service.asignarUnidad('u1', 'no-grupo', 'actor')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('rechaza si la unidad no existe', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce({ id: 'g1', tipo: 'GRUPO' });
            mockPrisma.unidad.findFirst.mockResolvedValueOnce(null);

            await expect(service.asignarUnidad('no-uni', 'g1', 'actor')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('asigna la unidad al grupo', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValueOnce({ id: 'g1', tipo: 'GRUPO' });
            mockPrisma.unidad.findFirst.mockResolvedValueOnce({ id: 'u1', nombre: 'Manada' });
            mockPrisma.unidad.update.mockResolvedValue({ id: 'u1', grupoId: 'g1' });

            const result = await service.asignarUnidad('u1', 'g1', 'actor');

            expect(result.grupoId).toBe('g1');
            expect(mockPrisma.unidad.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'u1' },
                    data: expect.objectContaining({ grupoId: 'g1', updatedBy: 'actor' }),
                }),
            );
        });
    });
});
