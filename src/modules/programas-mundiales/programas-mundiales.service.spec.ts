import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EstadoProgramaMundial } from '@prisma/client';
import { ProgramasMundialesService, Actor } from './programas-mundiales.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';

describe('ProgramasMundialesService', () => {
    let service: ProgramasMundialesService;

    const actor: Actor = { id: 'u1', roles: ['SYSTEM_ADMIN'], unidadId: null, nodoId: null };

    const mockPrisma = {
        programaMundial: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
        miembroProgramaMundial: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        miembro: {
            findFirst: jest.fn(),
        },
    };

    const mockAudit = { logAction: jest.fn().mockResolvedValue(undefined) };
    const mockUnitPolicy = {
        unidadesAlcance: jest.fn().mockResolvedValue(null),
        assertCanManageUnit: jest.fn().mockResolvedValue(undefined),
    };

    const miembro = { id: 'm1', unidadId: 'unidad-1', nombres: 'Ana', apellidos: 'Pérez' };

    const programa = { id: 'p1', nombre: 'World Scout Jamboree', activo: true };

    const inscripcion = {
        id: 'i1',
        miembroId: 'm1',
        programaMundialId: 'p1',
        fechaInicio: new Date('2024-01-10T00:00:00.000Z'),
        fechaCompletado: null,
        estado: EstadoProgramaMundial.EN_CURSO,
        deletedAt: null,
        ProgramaMundial: programa,
        Miembro: miembro,
    };

    const dtoCrear = {
        miembroId: 'm1',
        programaMundialId: 'p1',
        fechaInicio: '2024-01-10',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProgramasMundialesService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAudit },
                { provide: UnitPolicy, useValue: mockUnitPolicy },
            ],
        }).compile();

        service = module.get<ProgramasMundialesService>(ProgramasMundialesService);
        jest.clearAllMocks();
        mockAudit.logAction.mockResolvedValue(undefined);
        mockUnitPolicy.unidadesAlcance.mockResolvedValue(null);
        mockUnitPolicy.assertCanManageUnit.mockResolvedValue(undefined);
    });

    describe('findAllCatalog', () => {
        it('lista solo programas activos y no eliminados', async () => {
            const catalogo = [programa];
            mockPrisma.programaMundial.findMany.mockResolvedValue(catalogo);

            const result = await service.findAllCatalog();

            expect(result).toEqual(catalogo);
            expect(mockPrisma.programaMundial.findMany).toHaveBeenCalledWith({
                where: { activo: true, deletedAt: null },
                orderBy: { nombre: 'asc' },
            });
        });

        it('propaga el error de Prisma al listar el catálogo', async () => {
            mockPrisma.programaMundial.findMany.mockRejectedValue(new Error('catálogo no disponible'));

            await expect(service.findAllCatalog()).rejects.toThrow('catálogo no disponible');
        });
    });

    describe('findAll', () => {
        it('sin alcance restringido lista enlaces de miembros activos', async () => {
            mockPrisma.miembroProgramaMundial.findMany.mockResolvedValue([inscripcion]);

            const result = await service.findAll(actor);

            expect(result).toEqual([inscripcion]);
            expect(mockPrisma.miembroProgramaMundial.findMany).toHaveBeenCalledWith({
                where: { Miembro: { deletedAt: null }, deletedAt: null },
                include: expect.any(Object),
                orderBy: [{ Miembro: { apellidos: 'asc' } }, { fechaInicio: 'desc' }],
            });
        });

        it('con alcance restringido filtra por las unidades permitidas', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-1']);
            mockPrisma.miembroProgramaMundial.findMany.mockResolvedValue([]);

            await service.findAll(actor);

            expect(mockPrisma.miembroProgramaMundial.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        Miembro: { deletedAt: null, unidadId: { in: ['unidad-1'] } },
                        deletedAt: null,
                    },
                }),
            );
        });
    });

    describe('findByMiembro', () => {
        it('valida el miembro y devuelve sus enlaces activos', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.miembroProgramaMundial.findMany.mockResolvedValue([inscripcion]);

            const result = await service.findByMiembro('m1', actor);

            expect(result).toEqual([inscripcion]);
            expect(mockPrisma.miembroProgramaMundial.findMany).toHaveBeenCalledWith({
                where: { miembroId: 'm1', deletedAt: null },
                include: { ProgramaMundial: true },
                orderBy: { fechaInicio: 'desc' },
            });
        });

        it('lanza 404 si el miembro no existe', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(null);

            await expect(service.findByMiembro('m404', actor)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockPrisma.miembroProgramaMundial.findMany).not.toHaveBeenCalled();
        });

        it('fail-closed: 404 si el miembro está fuera del alcance', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-2']);
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);

            await expect(service.findByMiembro('m1', actor)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockPrisma.miembroProgramaMundial.findMany).not.toHaveBeenCalled();
        });
    });

    describe('crear', () => {
        it('enlaza el programa con auditoría', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.programaMundial.findFirst.mockResolvedValue(programa);
            mockPrisma.miembroProgramaMundial.findUnique.mockResolvedValue(null);
            mockPrisma.miembroProgramaMundial.create.mockResolvedValue(inscripcion);

            const result = await service.crear(dtoCrear, actor);

            expect(result).toEqual(inscripcion);
            expect(mockPrisma.miembroProgramaMundial.create).toHaveBeenCalledWith({
                data: {
                    miembroId: 'm1',
                    programaMundialId: 'p1',
                    fechaInicio: new Date('2024-01-10'),
                    fechaCompletado: null,
                    estado: EstadoProgramaMundial.PENDIENTE,
                },
                include: { ProgramaMundial: true },
            });
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'PROGRAMA_MUNDIAL_CREATED',
                    module: 'programas-mundiales',
                    targetId: 'i1',
                }),
            );
        });

        it('exige gestionar la unidad del miembro', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockUnitPolicy.assertCanManageUnit.mockRejectedValue(new Error('sin alcance'));

            await expect(service.crear(dtoCrear, actor)).rejects.toThrow('sin alcance');
            expect(mockPrisma.miembroProgramaMundial.create).not.toHaveBeenCalled();
        });

        it('404 si el programa no existe o está inactivo', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.programaMundial.findFirst.mockResolvedValue({ ...programa, activo: false });

            await expect(service.crear(dtoCrear, actor)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('409 si el miembro ya tiene ese programa activo', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.programaMundial.findFirst.mockResolvedValue(programa);
            mockPrisma.miembroProgramaMundial.findUnique.mockResolvedValue({
                id: 'i1',
                deletedAt: null,
            });

            await expect(service.crear(dtoCrear, actor)).rejects.toBeInstanceOf(ConflictException);
            expect(mockPrisma.miembroProgramaMundial.create).not.toHaveBeenCalled();
        });

        it('reactiva el enlace soft-deleted en lugar de violar el unique', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.programaMundial.findFirst.mockResolvedValue(programa);
            mockPrisma.miembroProgramaMundial.findUnique.mockResolvedValue({
                id: 'i1',
                deletedAt: new Date('2024-05-01'),
            });
            mockPrisma.miembroProgramaMundial.update.mockResolvedValue(inscripcion);

            await service.crear(dtoCrear, actor);

            expect(mockPrisma.miembroProgramaMundial.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'i1' },
                    data: expect.objectContaining({ deletedAt: null }),
                }),
            );
            expect(mockPrisma.miembroProgramaMundial.create).not.toHaveBeenCalled();
        });

        it('400 si fechaCompletado es anterior a fechaInicio', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.programaMundial.findFirst.mockResolvedValue(programa);

            await expect(
                service.crear({ ...dtoCrear, fechaCompletado: '2023-12-31' }, actor),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('400 si se marca COMPLETADO sin fechaCompletado', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.programaMundial.findFirst.mockResolvedValue(programa);

            await expect(
                service.crear({ ...dtoCrear, estado: EstadoProgramaMundial.COMPLETADO }, actor),
            ).rejects.toBeInstanceOf(BadRequestException);
        });
    });

    describe('actualizar', () => {
        it('actualiza estado y fecha con auditoría', async () => {
            mockPrisma.miembroProgramaMundial.findFirst.mockResolvedValue(inscripcion);
            mockPrisma.miembroProgramaMundial.update.mockResolvedValue({
                ...inscripcion,
                estado: EstadoProgramaMundial.COMPLETADO,
            });

            const result = await service.actualizar(
                'i1',
                { estado: EstadoProgramaMundial.COMPLETADO, fechaCompletado: '2024-06-01' },
                actor,
            );

            expect(result.estado).toBe(EstadoProgramaMundial.COMPLETADO);
            expect(mockPrisma.miembroProgramaMundial.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'i1' },
                    data: expect.objectContaining({
                        estado: EstadoProgramaMundial.COMPLETADO,
                        fechaCompletado: new Date('2024-06-01'),
                    }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'PROGRAMA_MUNDIAL_UPDATED', targetId: 'i1' }),
            );
        });

        it('404 si el enlace no existe o está eliminado', async () => {
            mockPrisma.miembroProgramaMundial.findFirst.mockResolvedValue(null);

            await expect(service.actualizar('i404', {}, actor)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('400 si el estado combinado queda incoherente', async () => {
            mockPrisma.miembroProgramaMundial.findFirst.mockResolvedValue({
                ...inscripcion,
                fechaCompletado: null,
            });

            await expect(
                service.actualizar('i1', { estado: EstadoProgramaMundial.COMPLETADO }, actor),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('409 al mover a un programa que el miembro ya tiene', async () => {
            mockPrisma.miembroProgramaMundial.findFirst.mockResolvedValue({
                ...inscripcion,
                miembroId: 'm1',
            });
            mockPrisma.programaMundial.findFirst.mockResolvedValue({
                ...programa,
                id: 'p2',
            });
            mockPrisma.miembroProgramaMundial.findUnique.mockResolvedValue({
                id: 'i2',
                deletedAt: null,
            });

            await expect(
                service.actualizar('i1', { programaMundialId: 'p2' }, actor),
            ).rejects.toBeInstanceOf(ConflictException);
        });
    });

    describe('eliminar', () => {
        it('hace soft-delete y audita', async () => {
            mockPrisma.miembroProgramaMundial.findFirst.mockResolvedValue(inscripcion);
            mockPrisma.miembroProgramaMundial.update.mockResolvedValue(inscripcion);

            const result = await service.eliminar('i1', actor);

            expect(result).toEqual({ id: 'i1', deleted: true });
            expect(mockPrisma.miembroProgramaMundial.update).toHaveBeenCalledWith({
                where: { id: 'i1' },
                data: { deletedAt: expect.any(Date) },
            });
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'PROGRAMA_MUNDIAL_DELETED', targetId: 'i1' }),
            );
        });

        it('exige gestionar la unidad del miembro', async () => {
            mockPrisma.miembroProgramaMundial.findFirst.mockResolvedValue(inscripcion);
            mockUnitPolicy.assertCanManageUnit.mockRejectedValue(new Error('sin alcance'));

            await expect(service.eliminar('i1', actor)).rejects.toThrow('sin alcance');
            expect(mockPrisma.miembroProgramaMundial.update).not.toHaveBeenCalled();
        });
    });
});
