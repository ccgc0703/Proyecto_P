import { Test, TestingModule } from '@nestjs/testing';
import { JovenesService } from './jovenes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitAccessPolicy } from '../../common/policies/unit-access.policy';
import { UsersService } from '../users/users.service';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';

describe('JovenesService', () => {
    let service: JovenesService;

    const mockPrisma = {
        miembro: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        unidad: {
            findFirst: jest.fn(),
        },
        rol: {
            findUnique: jest.fn(),
        },
        usuarioRol: {
            create: jest.fn(),
        },
        joven: {
            update: jest.fn(),
        },
    };

    const mockAuditService = {
        logAction: jest.fn().mockResolvedValue(undefined),
    };

    const mockUnitAccess = {
        assertCanAccessUnit: jest.fn().mockResolvedValue(undefined),
    };

    const mockUsersService = {
        create: jest.fn(),
        remove: jest.fn(),
    };

    const miembroJoven = {
        id: 'm1',
        nombres: 'LUCAS',
        apellidos: 'GOMEZ',
        cedula: '111222333',
        tipo: 'JOVEN',
        estado: 'ACTIVO',
        deletedAt: null,
        unidadId: 'uni-1',
        fechaNacimiento: new Date('2014-03-01'),
        Joven: {
            id: 'j1',
            representanteId: 'rep-1',
            usuarioId: null,
            historial: null,
        },
        DatosScout: {
            cargoActual: 'SCOUT',
            patrullaId: null,
        },
    };

    const fechaNacimiento = (edad: number): string => {
        const fecha = new Date();
        fecha.setFullYear(fecha.getFullYear() - edad);
        return fecha.toISOString();
    };

    const dtoJoven = (edad: number) => ({
        nombres: 'LUCAS',
        apellidos: 'GOMEZ',
        cedula: '111222333',
        genero: 'MASCULINO',
        fechaNacimiento: fechaNacimiento(edad),
        unidadId: 'uni-1',
        representanteId: 'rep-1',
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JovenesService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAuditService },
                { provide: UnitAccessPolicy, useValue: mockUnitAccess },
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();

        service = module.get<JovenesService>(JovenesService);
        jest.clearAllMocks();
        mockUnitAccess.assertCanAccessUnit.mockResolvedValue(undefined);
        mockAuditService.logAction.mockResolvedValue(undefined);
    });

    describe('findAllByUnit', () => {
        it('sin paginación devuelve la lista completa aplanada con búsqueda', async () => {
            mockPrisma.miembro.findMany.mockResolvedValue([miembroJoven]);

            const result = await service.findAllByUnit('uni-1', { q: 'gomez' });

            expect(mockPrisma.miembro.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        tipo: 'JOVEN',
                        deletedAt: null,
                        unidadId: 'uni-1',
                        OR: [
                            { nombres: { contains: 'gomez', mode: 'insensitive' } },
                            { apellidos: { contains: 'gomez', mode: 'insensitive' } },
                            { cedula: { contains: 'gomez', mode: 'insensitive' } },
                        ],
                    },
                    include: expect.objectContaining({ Unidad: true }),
                }),
            );
            expect(mockPrisma.miembro.count).not.toHaveBeenCalled();
            expect(result.total).toBe(1);
            expect(result.data[0]).toEqual(
                expect.objectContaining({
                    id: 'm1',
                    representanteId: 'rep-1',
                    cargoActual: 'SCOUT',
                }),
            );
            expect(result.data[0].Joven).toBeUndefined();
            expect(result.data[0].DatosScout).toBeUndefined();
        });

        it('con page/limit aplica skip/take y usa el total del count', async () => {
            mockPrisma.miembro.findMany.mockResolvedValue([miembroJoven]);
            mockPrisma.miembro.count.mockResolvedValue(42);

            const result = await service.findAllByUnit('uni-1', { page: 2, limit: 10 });

            expect(mockPrisma.miembro.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
                    skip: 10,
                    take: 10,
                }),
            );
            expect(mockPrisma.miembro.count).toHaveBeenCalledTimes(1);
            expect(result.total).toBe(42);
            expect(result.data).toHaveLength(1);
        });
    });

    describe('findOne', () => {
        it('lanza NotFoundException si el miembro no es un joven activo', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(null);

            await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('no-existe')).rejects.toThrow(
                'Joven con ID no-existe no encontrado',
            );
            expect(mockPrisma.miembro.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'no-existe', deletedAt: null, tipo: 'JOVEN' },
                }),
            );
        });
    });

    describe('createJoven', () => {
        it('rechaza si la edad queda fuera del rango de la unidad', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ nombre: 'Manada' });

            await expect(
                service.createJoven(dtoJoven(25) as any, 'u1', 'ADULTO_MANADA', 'uni-1'),
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.createJoven(dtoJoven(25) as any, 'u1', 'ADULTO_MANADA', 'uni-1'),
            ).rejects.toThrow('La unidad "Manada" acepta edades de 6 a 10 años');
            expect(mockPrisma.miembro.create).not.toHaveBeenCalled();
            expect(mockUnitAccess.assertCanAccessUnit).toHaveBeenCalledWith('u1', 'uni-1');
        });

        it('crea el miembro con sus fichas y registra auditoría', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ nombre: 'Tropa' });
            mockPrisma.miembro.create.mockResolvedValue({
                id: 'm1',
                nombres: 'LUCAS',
                Joven: { id: 'j1', representanteId: 'rep-1' },
                DatosScout: { cargoActual: 'SCOUT' },
            });

            const dto = { ...dtoJoven(12), fechaIngreso: '2024-01-15', cargoActual: 'SCOUT' };
            const result = await service.createJoven(dto as any, 'u1', 'ADULTO_TROPA', 'uni-1');

            expect(mockPrisma.unidad.findFirst).toHaveBeenCalledWith({
                where: { id: 'uni-1', deletedAt: null },
                select: { nombre: true },
            });
            expect(mockUnitAccess.assertCanAccessUnit).toHaveBeenCalledWith('u1', 'uni-1');
            expect(mockPrisma.miembro.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tipo: 'JOVEN',
                        estado: 'ACTIVO',
                        unidadId: 'uni-1',
                        createdBy: 'u1',
                        fechaNacimiento: new Date(dto.fechaNacimiento),
                        Joven: {
                            create: { representanteId: 'rep-1', historial: undefined },
                        },
                        DatosScout: {
                            create: expect.objectContaining({
                                fechaIngreso: new Date('2024-01-15'),
                                cargoActual: 'SCOUT',
                            }),
                        },
                    }),
                }),
            );
            expect(mockAuditService.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'JOVEN_CREATED', module: 'jovenes' }),
            );
            expect(result).toEqual(
                expect.objectContaining({ id: 'm1', representanteId: 'rep-1', cargoActual: 'SCOUT' }),
            );
        });
    });

    describe('removeJoven', () => {
        it('valida el acceso a la unidad y hace soft delete con auditoría', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValueOnce({
                id: 'm1',
                unidadId: 'uni-1',
                tipo: 'JOVEN',
            });
            mockPrisma.miembro.update.mockResolvedValue({
                id: 'm1',
                deletedAt: new Date(),
            });

            const result = await service.removeJoven('m1', 'u1');

            expect(mockUnitAccess.assertCanAccessUnit).toHaveBeenCalledWith('u1', 'uni-1');
            expect(mockPrisma.miembro.update).toHaveBeenCalledWith({
                where: { id: 'm1' },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                    updatedBy: 'u1',
                }),
            });
            expect(mockAuditService.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'JOVEN_DELETED', targetId: 'm1' }),
            );
            expect(result.id).toBe('m1');
        });
    });

    describe('createAccount', () => {
        it('rechaza si el joven ya tiene una cuenta vinculada', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue({
                id: 'm1',
                Joven: { id: 'j1', usuarioId: 'u-old' },
            });

            await expect(
                service.createAccount('m1', { email: 'l@test.com', password: '123456' }, 'c1'),
            ).rejects.toThrow(ConflictException);
            expect(mockUsersService.create).not.toHaveBeenCalled();
            expect(mockPrisma.rol.findUnique).not.toHaveBeenCalled();
        });

        it('asigna obligatoriamente el rol JOVEN y vincula la cuenta', async () => {
            mockPrisma.miembro.findFirst
                .mockResolvedValueOnce({
                    id: 'm1',
                    nombres: 'LUCAS',
                    apellidos: 'GOMEZ',
                    unidadId: 'uni-1',
                    Joven: { id: 'j1', usuarioId: null },
                })
                .mockResolvedValue({
                    id: 'm1',
                    nombres: 'LUCAS',
                    apellidos: 'GOMEZ',
                    unidadId: 'uni-1',
                    Joven: { id: 'j1', usuarioId: 'u7' },
                });
            mockUsersService.create.mockResolvedValue({ id: 'u7' });
            mockPrisma.rol.findUnique.mockResolvedValue({ id: 'rol-joven', nombre: 'JOVEN' });
            mockPrisma.usuarioRol.create.mockResolvedValue({});
            mockPrisma.joven.update.mockResolvedValue({ id: 'j1' });

            const result = await service.createAccount(
                'm1',
                { email: 'l@test.com', password: '123456', rolId: 'rol-admin' } as any,
                'c1',
            );

            expect(mockUsersService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre: 'LUCAS',
                    apellido: 'GOMEZ',
                    email: 'l@test.com',
                    password: '123456',
                    unidadId: 'uni-1',
                }),
                'c1',
            );
            expect(mockPrisma.rol.findUnique).toHaveBeenCalledWith({
                where: { nombre: 'JOVEN' },
            });
            expect(mockPrisma.usuarioRol.create).toHaveBeenCalledWith({
                data: { usuarioId: 'u7', rolId: 'rol-joven', asignadoPor: 'c1' },
            });
            expect(mockPrisma.joven.update).toHaveBeenCalledWith({
                where: { id: 'j1' },
                data: { usuarioId: 'u7' },
            });
            expect(mockAuditService.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'JOVEN_ACCOUNT_CREATED', targetId: 'm1' }),
            );
            expect(result.id).toBe('m1');
            expect(result.usuarioId).toBe('u7');
        });
    });
});
