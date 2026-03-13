import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /** Valida credenciales y genera el token con permisos RBAC embebidos */
    async login(loginDto: LoginDto) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { email: loginDto.email },
        });

        if (!usuario || usuario.deletedAt) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!usuario.activo) {
            throw new UnauthorizedException('Usuario inactivo');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, usuario.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // ── Cargar permisos RBAC con un único JOIN (sin N+1) ──────────────────
        const permissions = await this.loadUserPermissions(usuario.id);

        // ── JWT payload: mantiene rol legacy + agrega permissions[] RBAC ──────
        const payload = {
            sub: usuario.id,
            email: usuario.email,
            unidadId: usuario.unidadId,
            permissions,                // Permisos RBAC — leídos por PermissionsGuard
            tokenVersion: usuario.tokenVersion, // Para invalidación inmediata de JWTs
        };

        return {
            accessToken: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                unidadId: usuario.unidadId,
                permissions,            // Devuelto también en respuesta para el frontend
            },
        };
    }

    /**
     * Obtiene el perfil completo del usuario autenticado.
     * Incluye roles y permisos únicos extraídos de las relaciones RBAC.
     */
    async getProfile(userId: string) {
        const usuario = await this.prisma.usuario.findFirst({
            where: { id: userId, deletedAt: null, activo: true },
            select: {
                id: true,
                nombre: true,
                email: true,
                unidadId: true,
                activo: true,
                UsuarioRoles: {
                    where: { deletedAt: null },
                    include: {
                        Rol: {
                            include: {
                                RolPermisos: {
                                    where: { deletedAt: null },
                                    include: { Permiso: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Extraer roles y permisos únicos
        const roles = usuario.UsuarioRoles.map(ur => ({
            id: ur.Rol.id,
            nombre: ur.Rol.nombre,
            descripcion: ur.Rol.descripcion,
        }));

        const permisosSet = new Set<string>();
        for (const ur of usuario.UsuarioRoles) {
            for (const rp of ur.Rol.RolPermisos) {
                permisosSet.add(rp.Permiso.accion);
            }
        }

        return {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            unidadId: usuario.unidadId,
            roles,
            permisos: Array.from(permisosSet),
        };
    }

    /**
     * Cierra sesión del usuario incrementando tokenVersion.
     * Esto invalida todos los JWTs activos inmediatamente.
     */
    async logout(userId: string) {
        await this.prisma.usuario.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
        });
    }

    /**
     * Genera un nuevo token de acceso sin requerir credenciales.
     * Incrementa tokenVersion para invalidar el token anterior.
     */
    async refreshToken(userId: string) {
        const usuario = await this.prisma.usuario.findFirst({
            where: { id: userId, deletedAt: null, activo: true },
        });

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const permissions = await this.loadUserPermissions(usuario.id);

        const payload = {
            sub: usuario.id,
            email: usuario.email,
            unidadId: usuario.unidadId,
            permissions,
            tokenVersion: usuario.tokenVersion,
        };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    /**
     * Carga los permisos del usuario mediante un único JOIN eficiente.
     * UsuarioRol → RolPermiso → Permiso
     * Solo incluye asignaciones activas (deletedAt IS NULL).
     */
    async loadUserPermissions(usuarioId: string): Promise<string[]> {
        const rows = await this.prisma.usuarioRol.findMany({
            where: {
                usuarioId,
                deletedAt: null,
                Rol: { deletedAt: null, activo: true },
            },
            include: {
                Rol: {
                    include: {
                        RolPermisos: {
                            where: { deletedAt: null },
                            include: { Permiso: true },
                        },
                    },
                },
            },
        });

        // Flatten: usuario puede tener múltiples roles → union de todos sus permisos
        const permisosSet = new Set<string>();
        for (const ur of rows) {
            for (const rp of ur.Rol.RolPermisos) {
                permisosSet.add(rp.Permiso.accion);
            }
        }
        return Array.from(permisosSet);
    }
}

