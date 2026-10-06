import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { verificarJerarquiaAsignacion } from '../../common/jerarquia';

jest.mock('../../common/jerarquia', () => ({
    verificarJerarquiaAsignacion: jest.fn().mockResolvedValue(undefined),
}));

const verificarJerarquia = verificarJerarquiaAsignacion as jest.Mock;

describe('RbacService', () => {
    let service: RbacService;

    const mockPrisma: any = {
        rol: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
        permiso: { findMany: jest.fn() },
        usuario: { findFirst: jest.fn(), update: jest.fn() },
        usuarioRol: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
        auditRBAC: { create: jest.fn() },
        $transaction: jest.fn(),
    };

    const mockAuthService = { loadUserPermissions: jest.fn() };
    const mockAuditService = { logAction: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RbacService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuthService, useValue: mockAuthService },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<RbacService>(RbacService);
        mockPrisma.$transaction.mockImplementation(async (arg: any) =>
            typeof arg === 'function' ? arg(mockPrisma) : Promise.all(arg),
        );
        mockAuditService.logAction.mockResolvedValue(undefined);
        mockPrisma.auditRBAC.create.mockResolvedValue({ id: 'audit-1' });
        jest.clearAllMocks();
    });

    describe('listRoles / listPermisos', () => {
        it('lista solo roles activos ordenados por nombre', async () => {
            mockPrisma.rol.findMany.mockResolvedValue([{ id: 'r1', nombre: 'CONSULTOR' }]);

            const result = await service.listRoles();

            expect(mockPrisma.rol.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                orderBy: { nombre: 'asc' },
            });
            expect(result).toHaveLength(1);
        });

        it('lista permisos agrupados por módulo y acción', async () => {
            mockPrisma.permiso.findMany.mockResolvedValue([{ id: 'p1', accion: 'joven:view' }]);

            await service.listPermisos();

            expect(mockPrisma.permiso.findMany).toHaveBeenCalledWith({
                orderBy: [{ modulo: 'asc' }, { accion: 'asc' }],
            });
        });

        it('delega la consulta de permisos de usuario en AuthService', async () => {
            mockAuthService.loadUserPermissions.mockResolvedValue(['joven:view']);

            const result = await service.getUserPermissions('u1');

            expect(mockAuthService.loadUserPermissions).toHaveBeenCalledWith('u1');
            expect(result).toEqual(['joven:view']);
        });
    });

    describe('assignRole', () => {
        it('lanza NotFoundException si el usuario no existe', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue(null);

            await expect(service.assignRole('u1', 'r1', 'actor')).rejects.toThrow(NotFoundException);
        });

        it('lanza NotFoundException si el rol no existe o está inactivo', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
            mockPrisma.rol.findFirst.mockResolvedValue(null);

            await expect(service.assignRole('u1', 'r1', 'actor')).rejects.toThrow(NotFoundException);
        });

        it('bloquea la escalada de privilegios con ForbiddenException desde la jerarquía', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'r1', nombre: 'SYSTEM_ADMIN', activo: true });
            verificarJerarquia.mockRejectedValueOnce(new ForbiddenException('Sin jerarquía suficiente'));

            await expect(service.assignRole('u1', 'r1', 'u2')).rejects.toThrow(ForbiddenException);
            expect(mockPrisma.usuarioRol.create).not.toHaveBeenCalled();
        });

        it('lanza ConflictException cuando el usuario ya tiene el rol activo', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'r1', nombre: 'CONSULTOR', activo: true });
            mockPrisma.usuarioRol.findFirst.mockResolvedValue({ id: 'ur1' });

            await expect(service.assignRole('u1', 'r1', 'actor')).rejects.toThrow(ConflictException);
            expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        });

        it('asigna el rol: transacción con tokenVersion++ y auditoría', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'r1', nombre: 'CONSULTOR', activo: true });
            mockPrisma.usuarioRol.findFirst.mockResolvedValue(null);
            mockPrisma.usuarioRol.create.mockResolvedValue({ id: 'ur1' });
            mockPrisma.usuario.update.mockResolvedValue({ id: 'u1' });

            const result = await service.assignRole('u1', 'r1', 'actor', '127.0.0.1');

            expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
            expect(mockPrisma.usuarioRol.create).toHaveBeenCalledWith({
                data: { usuarioId: 'u1', rolId: 'r1', asignadoPor: 'actor' },
            });
            expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: { tokenVersion: { increment: 1 } },
            });
            expect(mockPrisma.auditRBAC.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ accion: 'ROLE_ASSIGNED' }) }),
            );
            expect(result.message).toContain('CONSULTOR asignado');
            expect(result.asignacion.id).toBe('ur1');
        });

        it('convierte el error P2002 (carrera) en ConflictException', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'r1', nombre: 'CONSULTOR', activo: true });
            mockPrisma.usuarioRol.findFirst.mockResolvedValue(null);
            mockPrisma.usuarioRol.create.mockRejectedValue({ code: 'P2002' });

            await expect(service.assignRole('u1', 'r1', 'actor')).rejects.toThrow(ConflictException);
        });
    });

    describe('assignRoleByName', () => {
        it('lanza NotFoundException si el rol no existe', async () => {
            mockPrisma.rol.findUnique.mockResolvedValue(null);

            await expect(
                service.assignRoleByName({ usuarioId: 'u1', rolNombre: 'FANTASMA' }, 'actor'),
            ).rejects.toThrow(NotFoundException);
        });

        it('responde sin error cuando el usuario ya tiene ese rol', async () => {
            mockPrisma.rol.findUnique.mockResolvedValue({ id: 'r1', nombre: 'CONSULTOR' });
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
            mockPrisma.usuarioRol.findFirst.mockResolvedValue({ id: 'ur1' });

            const result = await service.assignRoleByName(
                { usuarioId: 'u1', rolNombre: 'CONSULTOR' },
                'actor',
            );

            expect(result.message).toContain('ya tiene ese rol');
            expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        });

        it('asigna el rol, audita en RBAC y en el log global', async () => {
            mockPrisma.rol.findUnique.mockResolvedValue({ id: 'r1', nombre: 'ADULTO_COMUNIDAD' });
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'u1' });
            mockPrisma.usuarioRol.findFirst.mockResolvedValue(null);
            mockPrisma.usuarioRol.create.mockResolvedValue({ id: 'ur2' });
            mockPrisma.usuario.update.mockResolvedValue({ id: 'u1' });

            const result = await service.assignRoleByName(
                { usuarioId: 'u1', rolNombre: 'ADULTO_COMUNIDAD' },
                'actor',
                '10.0.0.1',
            );

            expect(mockPrisma.auditRBAC.create).toHaveBeenCalledTimes(1);
            expect(mockAuditService.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'ROLE_ASSIGNED', module: 'rbac', targetId: 'u1' }),
            );
            expect(result.asignacion.id).toBe('ur2');
        });
    });

    describe('revokeRole', () => {
        it('lanza NotFoundException cuando el usuario no tiene el rol activo', async () => {
            mockPrisma.usuarioRol.findFirst.mockResolvedValue(null);

            await expect(service.revokeRole('u1', 'r1', 'actor')).rejects.toThrow(NotFoundException);
        });

        it('protege al último SYSTEM_ADMIN activo con BadRequestException', async () => {
            mockPrisma.usuarioRol.findFirst.mockResolvedValue({
                id: 'ur1',
                Rol: { nombre: 'SYSTEM_ADMIN' },
            });
            mockPrisma.usuarioRol.count.mockResolvedValue(1);

            await expect(service.revokeRole('u1', 'r1', 'actor')).rejects.toThrow(BadRequestException);
            expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        });

        it('revoca con soft-delete, tokenVersion++ y auditoría', async () => {
            mockPrisma.usuarioRol.findFirst.mockResolvedValue({
                id: 'ur1',
                Rol: { nombre: 'CONSULTOR' },
            });
            mockPrisma.usuarioRol.update.mockResolvedValue({ id: 'ur1' });
            mockPrisma.usuario.update.mockResolvedValue({ id: 'u1' });

            const result = await service.revokeRole('u1', 'r1', 'actor');

            expect(mockPrisma.usuarioRol.update).toHaveBeenCalledWith({
                where: { id: 'ur1' },
                data: { deletedAt: expect.any(Date) },
            });
            expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: { tokenVersion: { increment: 1 } },
            });
            expect(mockPrisma.auditRBAC.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ accion: 'ROLE_REVOKED' }) }),
            );
            expect(result.message).toContain('CONSULTOR revocado');
        });

        it('permite revocar SYSTEM_ADMIN cuando queda al menos otro admin activo', async () => {
            mockPrisma.usuarioRol.findFirst.mockResolvedValue({
                id: 'ur1',
                Rol: { nombre: 'SYSTEM_ADMIN' },
            });
            mockPrisma.usuarioRol.count.mockResolvedValue(2);
            mockPrisma.usuarioRol.update.mockResolvedValue({ id: 'ur1' });
            mockPrisma.usuario.update.mockResolvedValue({ id: 'u1' });

            await expect(service.revokeRole('u1', 'r1', 'actor')).resolves.toEqual({
                message: expect.stringContaining('SYSTEM_ADMIN revocado'),
            });
        });
    });
});
