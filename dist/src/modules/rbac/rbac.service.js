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
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const audit_service_1 = require("../audit/audit.service");
const SYSTEM_ADMIN_ROLE = 'SYSTEM_ADMIN';
const ROLE_HIERARCHY = {
    SYSTEM_ADMIN: 100,
    GROUP_LEADER: 80,
    GROUP_SUBLEADER: 70,
    ADULTO_MANADA: 60,
    ADULTO_TROPA: 60,
    ADULTO_CLAN: 60,
    SECRETARIO: 50,
    ADULTO_COLABORADOR: 40,
    CONSULTOR: 10,
};
let RbacService = class RbacService {
    constructor(prisma, authService, auditService) {
        this.prisma = prisma;
        this.authService = authService;
        this.auditService = auditService;
    }
    async listRoles() {
        return this.prisma.rol.findMany({
            where: { deletedAt: null },
            orderBy: { nombre: 'asc' },
        });
    }
    async listPermisos() {
        return this.prisma.permiso.findMany({
            orderBy: [{ modulo: 'asc' }, { accion: 'asc' }],
        });
    }
    async getUserPermissions(usuarioId) {
        return this.authService.loadUserPermissions(usuarioId);
    }
    async assignRole(usuarioId, rolId, actorId, ip) {
        const usuario = await this.prisma.usuario.findFirst({
            where: { id: usuarioId, deletedAt: null },
        });
        if (!usuario)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const rol = await this.prisma.rol.findFirst({
            where: { id: rolId, deletedAt: null, activo: true },
        });
        if (!rol)
            throw new common_1.NotFoundException('Rol no encontrado o inactivo');
        const existing = await this.prisma.usuarioRol.findFirst({
            where: { usuarioId, rolId, deletedAt: null },
        });
        if (existing) {
            throw new common_1.ConflictException(`El usuario ya tiene el rol ${rol.nombre}`);
        }
        try {
            const [asignacion] = await this.prisma.$transaction([
                this.prisma.usuarioRol.create({
                    data: { usuarioId, rolId, asignadoPor: actorId },
                }),
                this.prisma.usuario.update({
                    where: { id: usuarioId },
                    data: { tokenVersion: { increment: 1 } },
                }),
            ]);
            await this.prisma.auditRBAC.create({
                data: {
                    accion: 'ROLE_ASSIGNED',
                    entidad: 'UsuarioRol',
                    entidadId: asignacion.id,
                    realizadoPorId: actorId,
                    datosCambio: { usuarioId, rolId, rolNombre: rol.nombre },
                    ip,
                },
            });
            return { message: `Rol ${rol.nombre} asignado exitosamente`, asignacion };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 'P2002') {
                throw new common_1.ConflictException(`El usuario ya tiene el rol ${rol.nombre}`);
            }
            throw err;
        }
    }
    async assignRoleByName(dto, actorId, ip) {
        var _a;
        const rol = await this.prisma.rol.findUnique({
            where: { nombre: dto.rolNombre },
        });
        if (!rol) {
            throw new common_1.NotFoundException('Rol no encontrado');
        }
        const usuario = await this.prisma.usuario.findFirst({
            where: { id: dto.usuarioId, deletedAt: null },
        });
        if (!usuario)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const targetLevel = (_a = ROLE_HIERARCHY[rol.nombre]) !== null && _a !== void 0 ? _a : 0;
        const actorRoles = await this.prisma.usuarioRol.findMany({
            where: { usuarioId: actorId, deletedAt: null },
            include: { Rol: true },
        });
        const actorMaxLevel = actorRoles.reduce((max, ur) => { var _a; return Math.max(max, (_a = ROLE_HIERARCHY[ur.Rol.nombre]) !== null && _a !== void 0 ? _a : 0); }, 0);
        if (targetLevel >= actorMaxLevel) {
            throw new common_1.ForbiddenException('No puedes asignar un rol igual o superior al tuyo');
        }
        const existing = await this.prisma.usuarioRol.findFirst({
            where: {
                usuarioId: dto.usuarioId,
                rolId: rol.id,
                deletedAt: null,
            },
        });
        if (existing) {
            return { message: 'El usuario ya tiene ese rol asignado', asignacion: existing };
        }
        try {
            const [asignacion] = await this.prisma.$transaction([
                this.prisma.usuarioRol.create({
                    data: {
                        usuarioId: dto.usuarioId,
                        rolId: rol.id,
                        asignadoPor: actorId,
                    },
                }),
                this.prisma.usuario.update({
                    where: { id: dto.usuarioId },
                    data: { tokenVersion: { increment: 1 } },
                }),
            ]);
            await this.prisma.auditRBAC.create({
                data: {
                    accion: 'ROLE_ASSIGNED',
                    entidad: 'UsuarioRol',
                    entidadId: asignacion.id,
                    realizadoPorId: actorId,
                    datosCambio: {
                        usuarioId: dto.usuarioId,
                        rolId: rol.id,
                        rolNombre: rol.nombre,
                    },
                    ip,
                },
            });
            await this.auditService.logAction({
                actorId,
                action: 'ROLE_ASSIGNED',
                module: 'rbac',
                targetId: dto.usuarioId,
                description: `Rol ${rol.nombre} asignado a usuario`,
                ipAddress: ip,
            });
            return { message: `Rol ${rol.nombre} asignado exitosamente`, asignacion };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 'P2002') {
                throw new common_1.ConflictException(`El usuario ya tiene el rol ${rol.nombre}`);
            }
            throw err;
        }
    }
    async revokeRole(usuarioId, rolId, actorId, ip) {
        const asignacion = await this.prisma.usuarioRol.findFirst({
            where: { usuarioId, rolId, deletedAt: null },
            include: { Rol: true },
        });
        if (!asignacion) {
            throw new common_1.NotFoundException('El usuario no tiene este rol activo');
        }
        if (asignacion.Rol.nombre === SYSTEM_ADMIN_ROLE) {
            const adminCount = await this.prisma.usuarioRol.count({
                where: {
                    rolId,
                    deletedAt: null,
                    Usuario: { activo: true, deletedAt: null },
                },
            });
            if (adminCount <= 1) {
                throw new common_1.BadRequestException('No se puede revocar: es el último SYSTEM_ADMIN activo del sistema. ' +
                    'Asigna el rol a otro usuario antes de revocarlo aquí.');
            }
        }
        await this.prisma.$transaction([
            this.prisma.usuarioRol.update({
                where: { id: asignacion.id },
                data: { deletedAt: new Date() },
            }),
            this.prisma.usuario.update({
                where: { id: usuarioId },
                data: { tokenVersion: { increment: 1 } },
            }),
        ]);
        await this.prisma.auditRBAC.create({
            data: {
                accion: 'ROLE_REVOKED',
                entidad: 'UsuarioRol',
                entidadId: asignacion.id,
                realizadoPorId: actorId,
                datosCambio: { usuarioId, rolId, rolNombre: asignacion.Rol.nombre },
                ip,
            },
        });
        return { message: `Rol ${asignacion.Rol.nombre} revocado exitosamente` };
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        audit_service_1.AuditService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map