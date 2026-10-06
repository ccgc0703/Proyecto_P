import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('RolesService', () => {
    let service: RolesService;

    const tx = {
        rolPermiso: {
            updateMany: jest.fn(),
            findMany: jest.fn(),
            createMany: jest.fn(),
        },
    };

    const mockPrisma: any = {
        rol: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        permiso: { findMany: jest.fn() },
        $transaction: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RolesService, { provide: PrismaService, useValue: mockPrisma }],
        }).compile();

        service = module.get<RolesService>(RolesService);
        mockPrisma.$transaction.mockImplementation(async (arg: any) =>
            typeof arg === 'function' ? arg(tx) : Promise.all(arg),
        );
        jest.clearAllMocks();
    });

    describe('createRole', () => {
        it('crea el rol con el nombre normalizado a mayúsculas y sin espacios', async () => {
            mockPrisma.rol.findFirst.mockResolvedValue(null);
            mockPrisma.rol.create.mockResolvedValue({ id: 'r1', nombre: 'CONSULTOR' });

            const result = await service.createRole({ nombre: '  consultor ', descripcion: 'Solo lectura' });

            expect(mockPrisma.rol.create).toHaveBeenCalledWith({
                data: { nombre: 'CONSULTOR', descripcion: 'Solo lectura' },
            });
            expect(result.nombre).toBe('CONSULTOR');
        });

        it('lanza ConflictException cuando el rol activo ya existe (case-insensitive)', async () => {
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'r1', nombre: 'CONSULTOR', deletedAt: null });

            await expect(
                service.createRole({ nombre: 'consultor', descripcion: 'x' }),
            ).rejects.toThrow(ConflictException);
            expect(mockPrisma.rol.create).not.toHaveBeenCalled();
        });

        it('restaura el rol soft-deleted en lugar de duplicarlo', async () => {
            mockPrisma.rol.findFirst.mockResolvedValue({
                id: 'r1',
                nombre: 'CONSULTOR',
                deletedAt: new Date(),
                activo: false,
            });
            mockPrisma.rol.update.mockResolvedValue({ id: 'r1', nombre: 'CONSULTOR', activo: true });

            const result = await service.createRole({ nombre: 'CONSULTOR', descripcion: 'Nueva descripción' });

            expect(mockPrisma.rol.update).toHaveBeenCalledWith({
                where: { id: 'r1' },
                data: { deletedAt: null, activo: true, descripcion: 'Nueva descripción' },
            });
            expect(mockPrisma.rol.create).not.toHaveBeenCalled();
            expect(result.id).toBe('r1');
        });
    });

    describe('findAll', () => {
        it('excluye soft-delete y arma permisos planos + totalUsuarios', async () => {
            mockPrisma.rol.findMany.mockResolvedValue([
                {
                    id: 'r1',
                    nombre: 'CONSULTOR',
                    descripcion: 'solo lectura',
                    activo: true,
                    createdAt: new Date('2026-01-01'),
                    RolPermisos: [
                        { Permiso: { id: 'p1', accion: 'joven:view', modulo: 'jovenes', descripcion: 'ver' } },
                    ],
                    _count: { UsuarioRoles: 3 },
                },
            ]);

            const result = await service.findAll();

            expect(mockPrisma.rol.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { deletedAt: null } }),
            );
            expect(result).toEqual([
                expect.objectContaining({
                    id: 'r1',
                    nombre: 'CONSULTOR',
                    totalUsuarios: 3,
                    permisos: [{ id: 'p1', accion: 'joven:view', modulo: 'jovenes', descripcion: 'ver' }],
                }),
            ]);
        });

        it('devuelve lista vacía cuando no hay roles', async () => {
            mockPrisma.rol.findMany.mockResolvedValue([]);
            expect(await service.findAll()).toEqual([]);
        });
    });

    describe('assignPermissions', () => {
        it('lanza NotFoundException si el rol no existe o está inactivo', async () => {
            mockPrisma.rol.findFirst.mockResolvedValue(null);

            await expect(
                service.assignPermissions('no-existe', ['p1']),
            ).rejects.toThrow(NotFoundException);
            expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        });

        it('lanza BadRequestException si algún permiso no existe en la base', async () => {
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'r1', nombre: 'X', activo: true });
            mockPrisma.permiso.findMany.mockResolvedValue([{ id: 'p1', accion: 'a', modulo: 'm', descripcion: '' }]);

            await expect(service.assignPermissions('r1', ['p1', 'fantasma'])).rejects.toThrow(
                BadRequestException,
            );
            expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        });

        it('reemplaza los permisos en transacción: soft-delete de activos y creación de los nuevos', async () => {
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'r1', nombre: 'CONSULTOR', activo: true });
            mockPrisma.permiso.findMany.mockResolvedValue([
                { id: 'p1', accion: 'joven:view', modulo: 'jovenes', descripcion: '' },
                { id: 'p2', accion: 'unidad:view', modulo: 'unidades', descripcion: '' },
            ]);
            tx.rolPermiso.updateMany.mockResolvedValue({ count: 1 });
            tx.rolPermiso.findMany.mockResolvedValue([{ permisoId: 'p1' }]);
            tx.rolPermiso.createMany.mockResolvedValue({ count: 1 });

            const result = await service.assignPermissions('r1', ['p1', 'p2', 'p1']);

            expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
            expect(tx.rolPermiso.updateMany).toHaveBeenCalledWith({
                where: { rolId: 'r1', deletedAt: null },
                data: { deletedAt: expect.any(Date) },
            });
            expect(tx.rolPermiso.createMany).toHaveBeenCalledWith({ data: [{ rolId: 'r1', permisoId: 'p2' }] });
            expect(result.rolNombre).toBe('CONSULTOR');
            expect(result.permisosAsignados).toHaveLength(2);
        });
    });

    describe('findOne', () => {
        it('lanza NotFoundException cuando el rol no existe', async () => {
            mockPrisma.rol.findFirst.mockResolvedValue(null);
            await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
        });

        it('devuelve el rol con sus permisos activos', async () => {
            mockPrisma.rol.findFirst.mockResolvedValue({
                id: 'r1',
                nombre: 'CONSULTOR',
                RolPermisos: [],
            });

            const result = await service.findOne('r1');

            expect(mockPrisma.rol.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'r1', deletedAt: null } }),
            );
            expect(result.id).toBe('r1');
        });
    });
});
