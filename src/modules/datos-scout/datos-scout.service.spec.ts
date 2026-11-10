import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DatosScoutService, Actor } from './datos-scout.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';

describe('DatosScoutService', () => {
    let service: DatosScoutService;

    const actor: Actor = { id: 'u1', roles: ['SYSTEM_ADMIN'], unidadId: null, nodoId: null };

    const mockPrisma = {
        datosScout: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            upsert: jest.fn(),
        },
        miembro: {
            findFirst: jest.fn(),
        },
        patrulla: {
            findFirst: jest.fn(),
        },
    };

    const mockAudit = { logAction: jest.fn().mockResolvedValue(undefined) };
    const mockUnitPolicy = {
        unidadesAlcance: jest.fn().mockResolvedValue(null),
        assertCanManageUnit: jest.fn().mockResolvedValue(undefined),
    };

    const miembro = {
        id: 'm1',
        unidadId: 'unidad-1',
        nombres: 'Ana',
        apellidos: 'Pérez',
    };

    const datos = {
        id: 'd1',
        miembroId: 'm1',
        fechaIngreso: new Date('2024-03-01T00:00:00.000Z'),
        cargoActual: 'SCOUT',
        Patrulla: { id: 'p1', nombre: 'Zorro', color: 'rojo' },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DatosScoutService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAudit },
                { provide: UnitPolicy, useValue: mockUnitPolicy },
            ],
        }).compile();

        service = module.get<DatosScoutService>(DatosScoutService);
        jest.clearAllMocks();
        mockAudit.logAction.mockResolvedValue(undefined);
        mockUnitPolicy.unidadesAlcance.mockResolvedValue(null);
        mockUnitPolicy.assertCanManageUnit.mockResolvedValue(undefined);
    });

    describe('findAll', () => {
        it('sin alcance restringido lista los expedientes de miembros activos', async () => {
            mockPrisma.datosScout.findMany.mockResolvedValue([datos]);

            const result = await service.findAll(actor);

            expect(result).toEqual([datos]);
            expect(mockPrisma.datosScout.findMany).toHaveBeenCalledWith({
                where: { Miembro: { deletedAt: null } },
                include: expect.any(Object),
                orderBy: { Miembro: { apellidos: 'asc' } },
            });
        });

        it('filtra por las unidades del alcance del actor', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-1']);
            mockPrisma.datosScout.findMany.mockResolvedValue([]);

            await service.findAll(actor);

            const { where } = mockPrisma.datosScout.findMany.mock.calls[0][0];
            expect(where).toEqual({
                Miembro: { deletedAt: null, unidadId: { in: ['unidad-1'] } },
            });
        });

        it('sin usuario lista globalmente sin consultar el alcance', async () => {
            mockPrisma.datosScout.findMany.mockResolvedValue([]);

            await service.findAll();

            expect(mockUnitPolicy.unidadesAlcance).not.toHaveBeenCalled();
        });

        it('propaga el error de Prisma al listar', async () => {
            mockPrisma.datosScout.findMany.mockRejectedValue(new Error('conexion caida'));

            await expect(service.findAll(actor)).rejects.toThrow('conexion caida');
        });
    });

    describe('findByMiembro', () => {
        it('devuelve el expediente del miembro con su patrulla', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.findFirst.mockResolvedValue(datos);

            const result = await service.findByMiembro('m1', actor);

            expect(result).toEqual(datos);
            expect(mockPrisma.datosScout.findFirst).toHaveBeenCalledWith({
                where: { miembroId: 'm1', Miembro: { deletedAt: null } },
                include: expect.any(Object),
            });
        });

        it('lanza NotFound si el miembro no existe', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(null);

            await expect(service.findByMiembro('m404', actor)).rejects.toBeInstanceOf(NotFoundException);
            expect(mockPrisma.datosScout.findFirst).not.toHaveBeenCalled();
        });

        it('lanza NotFound si el miembro está fuera del alcance', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-9']);
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);

            await expect(service.findByMiembro('m1', actor)).rejects.toBeInstanceOf(NotFoundException);
            expect(mockPrisma.datosScout.findFirst).not.toHaveBeenCalled();
        });

        it('lanza NotFound si el miembro no tiene expediente', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.findFirst.mockResolvedValue(null);

            await expect(service.findByMiembro('m1', actor)).rejects.toThrow(
                'Datos scout no encontrados para este miembro',
            );
        });

        it('no convierte un error de Prisma en NotFound', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.findFirst.mockRejectedValue(new Error('timeout en la consulta'));

            await expect(service.findByMiembro('m1', actor)).rejects.toThrow('timeout en la consulta');
        });
    });

    describe('crear', () => {
        const dto = {
            miembroId: 'm1',
            fechaIngreso: '2024-03-01',
            cargoActual: '  SCOUT  ',
            observaciones: '  Sin novedades  ',
        };

        it('valida la unidad del miembro, normaliza y crea el expediente', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.findUnique.mockResolvedValue(null);
            mockPrisma.datosScout.create.mockResolvedValue(datos);

            const result = await service.crear(dto as any, actor);

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(actor, 'unidad-1');
            expect(mockPrisma.datosScout.create).toHaveBeenCalledWith({
                data: {
                    miembroId: 'm1',
                    fechaIngreso: new Date('2024-03-01'),
                    cargoActual: 'SCOUT',
                    observaciones: 'Sin novedades',
                },
                include: expect.any(Object),
            });
            expect(result).toEqual(datos);
        });

        it('audita la creación', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.findUnique.mockResolvedValue(null);
            mockPrisma.datosScout.create.mockResolvedValue(datos);

            await service.crear(dto as any, actor);

            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    actorId: 'u1',
                    action: 'DATOS_SCOUT_CREATED',
                    module: 'datos-scout',
                    targetId: 'd1',
                }),
            );
        });

        it('lanza Conflict si el miembro ya tiene expediente', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.findUnique.mockResolvedValue({ id: 'd1' });

            await expect(service.crear(dto as any, actor)).rejects.toBeInstanceOf(ConflictException);
            expect(mockPrisma.datosScout.create).not.toHaveBeenCalled();
        });

        it('lanza NotFound si el miembro no existe', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(null);

            await expect(service.crear(dto as any, actor)).rejects.toBeInstanceOf(NotFoundException);
            expect(mockPrisma.datosScout.create).not.toHaveBeenCalled();
        });

        it('propaga el Forbidden del aislamiento por unidad sin crear', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockUnitPolicy.assertCanManageUnit.mockRejectedValue(new Error('Aislamiento de Unidad'));

            await expect(service.crear(dto as any, actor)).rejects.toThrow('Aislamiento de Unidad');
            expect(mockPrisma.datosScout.create).not.toHaveBeenCalled();
        });

        it('rechaza una patrulla de otra unidad', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.findUnique.mockResolvedValue(null);
            mockPrisma.patrulla.findFirst.mockResolvedValue({ id: 'p9', unidadId: 'unidad-9' });

            await expect(
                service.crear({ ...dto, patrullaId: 'p9' } as any, actor),
            ).rejects.toBeInstanceOf(BadRequestException);
            expect(mockPrisma.datosScout.create).not.toHaveBeenCalled();
        });

        it('lanza NotFound si la patrulla no existe', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.findUnique.mockResolvedValue(null);
            mockPrisma.patrulla.findFirst.mockResolvedValue(null);

            await expect(
                service.crear({ ...dto, patrullaId: 'p404' } as any, actor),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('actualizarPorMiembro', () => {
        it('hace upsert con los campos normalizados y audita', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.upsert.mockResolvedValue(datos);

            const result = await service.actualizarPorMiembro(
                'm1',
                { cargoActual: '  PATRULLERO  ', fechaPromesa: '2025-06-15' } as any,
                actor,
            );

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(actor, 'unidad-1');
            expect(mockPrisma.datosScout.upsert).toHaveBeenCalledWith({
                where: { miembroId: 'm1' },
                create: {
                    miembroId: 'm1',
                    cargoActual: 'PATRULLERO',
                    fechaPromesa: new Date('2025-06-15'),
                },
                update: {
                    cargoActual: 'PATRULLERO',
                    fechaPromesa: new Date('2025-06-15'),
                },
                include: expect.any(Object),
            });
            expect(result).toEqual(datos);
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'DATOS_SCOUT_UPDATED', targetId: 'd1' }),
            );
        });

        it('permite limpiar campos opcionales con null', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.datosScout.upsert.mockResolvedValue(datos);

            await service.actualizarPorMiembro(
                'm1',
                { cargoActual: null, observaciones: null, patrullaId: null } as any,
                actor,
            );

            const { update } = mockPrisma.datosScout.upsert.mock.calls[0][0];
            expect(update).toEqual({ cargoActual: null, observaciones: null, patrullaId: null });
        });

        it('lanza NotFound si el miembro no existe', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(null);

            await expect(
                service.actualizarPorMiembro('m404', { cargoActual: 'X' } as any, actor),
            ).rejects.toBeInstanceOf(NotFoundException);
            expect(mockPrisma.datosScout.upsert).not.toHaveBeenCalled();
        });

        it('no actualiza si el actor no puede gestionar la unidad', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockUnitPolicy.assertCanManageUnit.mockRejectedValue(new Error('sin permiso'));

            await expect(
                service.actualizarPorMiembro('m1', { cargoActual: 'X' } as any, actor),
            ).rejects.toThrow('sin permiso');
            expect(mockPrisma.datosScout.upsert).not.toHaveBeenCalled();
        });

        it('valida la patrulla antes de escribir', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockPrisma.patrulla.findFirst.mockResolvedValue({ id: 'p9', unidadId: 'unidad-9' });

            await expect(
                service.actualizarPorMiembro('m1', { patrullaId: 'p9' } as any, actor),
            ).rejects.toBeInstanceOf(BadRequestException);
            expect(mockPrisma.datosScout.upsert).not.toHaveBeenCalled();
        });
    });
});
