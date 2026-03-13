"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(loginDto) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { email: loginDto.email },
        });
        if (!usuario || usuario.deletedAt) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (!usuario.activo) {
            throw new common_1.UnauthorizedException('Usuario inactivo');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, usuario.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
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
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                unidadId: usuario.unidadId,
                permissions,
            },
        };
    }
    async getProfile(userId) {
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
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const roles = usuario.UsuarioRoles.map(ur => ({
            id: ur.Rol.id,
            nombre: ur.Rol.nombre,
            descripcion: ur.Rol.descripcion,
        }));
        const permisosSet = new Set();
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
    async logout(userId) {
        await this.prisma.usuario.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
        });
    }
    async refreshToken(userId) {
        const usuario = await this.prisma.usuario.findFirst({
            where: { id: userId, deletedAt: null, activo: true },
        });
        if (!usuario) {
            throw new common_1.NotFoundException('Usuario no encontrado');
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
    async loadUserPermissions(usuarioId) {
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
        const permisosSet = new Set();
        for (const ur of rows) {
            for (const rp of ur.Rol.RolPermisos) {
                permisosSet.add(rp.Permiso.accion);
            }
        }
        return Array.from(permisosSet);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map