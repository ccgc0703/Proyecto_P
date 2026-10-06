import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
    let service: AuthService;

    const PASSWORD = 'Secret123';
    const HASH = bcrypt.hashSync(PASSWORD, 4);

    const mockPrisma = {
        usuario: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        usuarioRol: {
            findMany: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('token-firmado'),
    };

    const usuarioActivo = {
        id: 'u1',
        email: 'ana@test.com',
        nombre: 'ANA',
        password: HASH,
        activo: true,
        deletedAt: null,
        unidadId: 'uni-1',
        nodoId: null,
        tokenVersion: 3,
        Unidad: { id: 'uni-1', nombre: 'Manada' },
        Joven: { miembroId: 'm1' },
    };

    const filasRoles = [
        {
            Rol: {
                nombre: 'JOVEN',
                RolPermisos: [
                    { Permiso: { accion: 'joven:view' } },
                    { Permiso: { accion: 'joven:update' } },
                ],
            },
        },
        {
            Rol: {
                nombre: 'ADULTO_MANADA',
                RolPermisos: [{ Permiso: { accion: 'joven:view' } }],
            },
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jest.clearAllMocks();
        mockJwtService.sign.mockReturnValue('token-firmado');
    });

    describe('login — credenciales inválidas', () => {
        it('rechaza el login si el usuario no existe o fue eliminado', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValueOnce(null);
            await expect(
                service.login({ email: 'no@test.com', password: PASSWORD }),
            ).rejects.toThrow(UnauthorizedException);
            await expect(
                service.login({ email: 'no@test.com', password: PASSWORD }),
            ).rejects.toThrow('Credenciales inválidas');

            mockPrisma.usuario.findUnique.mockResolvedValueOnce({
                ...usuarioActivo,
                deletedAt: new Date(),
            });
            await expect(
                service.login({ email: 'ana@test.com', password: PASSWORD }),
            ).rejects.toThrow('Credenciales inválidas');
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });

        it('rechaza el login si la contraseña es incorrecta', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(usuarioActivo);

            await expect(
                service.login({ email: 'ana@test.com', password: 'otra-password' }),
            ).rejects.toThrow(UnauthorizedException);
            await expect(
                service.login({ email: 'ana@test.com', password: 'otra-password' }),
            ).rejects.toThrow('Credenciales inválidas');
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });

        it('rechaza el login si el usuario está inactivo', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue({ ...usuarioActivo, activo: false });

            await expect(
                service.login({ email: 'ana@test.com', password: PASSWORD }),
            ).rejects.toThrow('Usuario inactivo');
            expect(mockJwtService.sign).not.toHaveBeenCalled();
            expect(mockPrisma.usuarioRol.findMany).not.toHaveBeenCalled();
        });
    });

    describe('login — token', () => {
        it('emite el JWT con permissions, roles, miembroId y tokenVersion del vínculo joven', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(usuarioActivo);
            mockPrisma.usuarioRol.findMany.mockResolvedValue(filasRoles);

            const result = await service.login({ email: 'ana@test.com', password: PASSWORD });

            expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { email: 'ana@test.com' },
                    include: expect.objectContaining({
                        Joven: { select: { miembroId: true } },
                    }),
                }),
            );
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                sub: 'u1',
                email: 'ana@test.com',
                unidadId: 'uni-1',
                nodoId: null,
                miembroId: 'm1',
                permissions: ['joven:view', 'joven:update'],
                roles: ['JOVEN', 'ADULTO_MANADA'],
                tokenVersion: 3,
            });
            expect(result.access_token).toBe('token-firmado');
            expect(result.user).toEqual(
                expect.objectContaining({
                    id: 'u1',
                    unidad: 'Manada',
                    miembroId: 'm1',
                    permissions: ['joven:view', 'joven:update'],
                    roles: ['JOVEN', 'ADULTO_MANADA'],
                }),
            );
        });

        it('devuelve miembroId null cuando el usuario no tiene fila Joven', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue({ ...usuarioActivo, Joven: null });
            mockPrisma.usuarioRol.findMany.mockResolvedValue([]);

            const result = await service.login({ email: 'ana@test.com', password: PASSWORD });

            expect(mockJwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({ miembroId: null, permissions: [], roles: [] }),
            );
            expect(result.user.miembroId).toBeNull();
        });
    });

    describe('logout y refreshToken', () => {
        it('logout incrementa tokenVersion para invalidar los JWTs activos', async () => {
            mockPrisma.usuario.update.mockResolvedValue({ id: 'u1', tokenVersion: 4 });

            await service.logout('u1');

            expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: { tokenVersion: { increment: 1 } },
            });
        });

        it('refreshToken devuelve un nuevo token con permisos frescos', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue(usuarioActivo);
            mockPrisma.usuarioRol.findMany.mockResolvedValue(filasRoles);

            const result = await service.refreshToken('u1');

            expect(mockPrisma.usuario.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ id: 'u1', deletedAt: null, activo: true }),
                }),
            );
            expect(mockJwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    sub: 'u1',
                    miembroId: 'm1',
                    permissions: ['joven:view', 'joven:update'],
                    roles: ['JOVEN', 'ADULTO_MANADA'],
                    tokenVersion: 3,
                }),
            );
            expect(result).toEqual({ accessToken: 'token-firmado' });
        });
    });

    describe('loadUserPermissions', () => {
        it('deduplica permisos y solo considera roles activos sin borrado lógico', async () => {
            mockPrisma.usuarioRol.findMany.mockResolvedValue(filasRoles);

            const permissions = await service.loadUserPermissions('u1');

            expect(permissions).toEqual(['joven:view', 'joven:update']);
            expect(mockPrisma.usuarioRol.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        usuarioId: 'u1',
                        deletedAt: null,
                        Rol: { deletedAt: null, activo: true },
                    },
                }),
            );
        });
    });
});
