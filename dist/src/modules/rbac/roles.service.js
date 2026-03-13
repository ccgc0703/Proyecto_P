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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const RESERVED_ADMIN_ROLE = 'SYSTEM_ADMIN';
let RolesService = class RolesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRole(dto) {
        const normalizedNombre = dto.nombre.trim().toUpperCase();
        const existing = await this.prisma.rol.findFirst({
            where: { nombre: { equals: normalizedNombre, mode: 'insensitive' } },
        });
        if (existing) {
            if (!existing.deletedAt) {
                throw new common_1.ConflictException(`Ya existe un rol con el nombre "${normalizedNombre}"`);
            }
            const restored = await this.prisma.rol.update({
                where: { id: existing.id },
                data: {
                    deletedAt: null,
                    activo: true,
                    descripcion: dto.descripcion,
                },
            });
            return restored;
        }
        return this.prisma.rol.create({
            data: {
                nombre: normalizedNombre,
                descripcion: dto.descripcion,
            },
        });
    }
    async findAll() {
        const roles = await this.prisma.rol.findMany({
            where: { deletedAt: null },
            orderBy: { nombre: 'asc' },
            include: {
                RolPermisos: {
                    where: { deletedAt: null },
                    include: {
                        Permiso: {
                            select: { id: true, accion: true, modulo: true, descripcion: true },
                        },
                    },
                },
                _count: {
                    select: {
                        UsuarioRoles: {
                            where: { deletedAt: null },
                        },
                    },
                },
            },
        });
        return roles.map((rol) => ({
            id: rol.id,
            nombre: rol.nombre,
            descripcion: rol.descripcion,
            activo: rol.activo,
            createdAt: rol.createdAt,
            totalUsuarios: rol._count.UsuarioRoles,
            permisos: rol.RolPermisos.map((rp) => rp.Permiso),
        }));
    }
    async assignPermissions(roleId, permisoIds) {
        const rol = await this.prisma.rol.findFirst({
            where: { id: roleId, deletedAt: null, activo: true },
        });
        if (!rol) {
            throw new common_1.NotFoundException(`Rol con id "${roleId}" no encontrado o inactivo`);
        }
        const uniqueIds = [...new Set(permisoIds)];
        const permisosEnDB = await this.prisma.permiso.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true, accion: true, modulo: true, descripcion: true },
        });
        if (permisosEnDB.length !== uniqueIds.length) {
            const encontrados = new Set(permisosEnDB.map((p) => p.id));
            const noEncontrados = uniqueIds.filter((id) => !encontrados.has(id));
            throw new common_1.BadRequestException(`Los siguientes IDs de permisos no existen: ${noEncontrados.join(', ')}`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.rolPermiso.updateMany({
                where: { rolId: roleId, deletedAt: null },
                data: { deletedAt: new Date() },
            });
            for (const permisoId of uniqueIds) {
                const existing = await tx.rolPermiso.findFirst({
                    where: { rolId: roleId, permisoId },
                });
                if (existing) {
                    await tx.rolPermiso.update({
                        where: { id: existing.id },
                        data: { deletedAt: null },
                    });
                }
                else {
                    await tx.rolPermiso.create({
                        data: { rolId: roleId, permisoId },
                    });
                }
            }
        });
        return {
            rolId: rol.id,
            rolNombre: rol.nombre,
            permisosAsignados: permisosEnDB,
        };
    }
    async findOne(roleId) {
        const rol = await this.prisma.rol.findFirst({
            where: { id: roleId, deletedAt: null },
            include: {
                RolPermisos: {
                    where: { deletedAt: null },
                    include: { Permiso: true },
                },
            },
        });
        if (!rol)
            throw new common_1.NotFoundException(`Rol con id "${roleId}" no encontrado`);
        return rol;
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map