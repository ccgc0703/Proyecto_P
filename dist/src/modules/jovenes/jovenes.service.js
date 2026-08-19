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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JovenesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const ADULT_UNIT_MAP = {
    ADULTO_MANADA: 'Manada',
    ADULTO_TROPA: 'Tropa',
    ADULTO_CLAN: 'Clan',
};
const UNIT_BYPASS_ROLES = ['SYSTEM_ADMIN', 'GROUP_LEADER'];
let JovenesService = class JovenesService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async validateUnitAccess(actorId, unidadId) {
        const actorRoles = await this.prisma.usuarioRol.findMany({
            where: { usuarioId: actorId, deletedAt: null },
            include: { Rol: true },
        });
        const roleNames = actorRoles.map(ur => ur.Rol.nombre);
        if (roleNames.some(r => UNIT_BYPASS_ROLES.includes(r))) {
            return;
        }
        const adultRole = roleNames.find(r => r in ADULT_UNIT_MAP);
        if (!adultRole) {
            return;
        }
        const unidad = await this.prisma.unidad.findFirst({
            where: { id: unidadId, deletedAt: null },
            select: { nombre: true },
        });
        if (!unidad)
            return;
        const allowedUnit = ADULT_UNIT_MAP[adultRole];
        if (unidad.nombre !== allowedUnit) {
            throw new common_1.ForbiddenException('No tienes acceso a jóvenes de otra unidad');
        }
    }
    async findAllByUnit(unidadId) {
        const miembros = await this.prisma.miembro.findMany({
            where: {
                tipo: 'JOVEN',
                unidadId,
                deletedAt: null,
            },
            include: {
                Unidad: true,
                Joven: {
                    include: { Representante: true }
                },
                FichaMedica: {
                    where: { deletedAt: null }
                },
            },
        });
        return miembros.map(m => {
            const { Joven } = m, rest = __rest(m, ["Joven"]);
            return Object.assign(Object.assign(Object.assign({}, rest), Joven), { id: m.id });
        });
    }
    async findAll() {
        const miembros = await this.prisma.miembro.findMany({
            where: {
                tipo: 'JOVEN',
                deletedAt: null,
            },
            include: {
                Unidad: true,
                Joven: {
                    include: { Representante: true }
                },
                FichaMedica: {
                    where: { deletedAt: null }
                },
            },
        });
        return miembros.map(m => {
            const { Joven } = m, rest = __rest(m, ["Joven"]);
            return Object.assign(Object.assign(Object.assign({}, rest), Joven), { id: m.id });
        });
    }
    async findOne(id) {
        const miembro = await this.prisma.miembro.findFirst({
            where: { id, deletedAt: null, tipo: 'JOVEN' },
            include: {
                Unidad: true,
                FichaMedica: {
                    where: { deletedAt: null }
                },
                Condecoraciones: {
                    where: { deletedAt: null },
                    include: { Condecoracion: true },
                },
                Joven: {
                    include: {
                        Representante: true,
                        Progresiones: {
                            where: { deletedAt: null },
                            orderBy: { fechaInicio: 'desc' },
                        }
                    }
                }
            },
        });
        if (!miembro) {
            throw new common_1.NotFoundException(`Joven con ID ${id} no encontrado`);
        }
        const { Joven } = miembro, rest = __rest(miembro, ["Joven"]);
        return Object.assign(Object.assign(Object.assign({}, rest), Joven), { id: miembro.id, Progresiones: Joven ? Joven.Progresiones : [], Representante: Joven ? Joven.Representante : null });
    }
    async createJoven(createJovenDto, userId, userRol, userUnidadId) {
        await this.validateUnitAccess(userId, createJovenDto.unidadId);
        const miembro = await this.prisma.miembro.create({
            data: {
                nombres: createJovenDto.nombres,
                apellidos: createJovenDto.apellidos,
                cedula: createJovenDto.cedula,
                fechaNacimiento: new Date(createJovenDto.fechaNacimiento),
                genero: createJovenDto.genero,
                tipo: 'JOVEN',
                estado: createJovenDto.estado || 'ACTIVO',
                unidadId: createJovenDto.unidadId,
                createdBy: userId,
                Joven: {
                    create: {
                        representanteId: createJovenDto.representanteId,
                        historial: createJovenDto.historial,
                    }
                }
            },
            include: { Joven: true }
        });
        await this.auditService.logAction({
            actorId: userId,
            action: 'JOVEN_CREATED',
            module: 'jovenes',
            targetId: miembro.id,
            description: 'Joven registrado',
        });
        return Object.assign(Object.assign(Object.assign({}, miembro), miembro.Joven), { id: miembro.id });
    }
    async updateJoven(id, dto, actorId) {
        const miembro = await this.findOne(id);
        await this.validateUnitAccess(actorId, miembro.unidadId);
        if (dto.unidadId && dto.unidadId !== miembro.unidadId) {
            await this.validateUnitAccess(actorId, dto.unidadId);
        }
        const miembroData = {};
        if (dto.nombres !== undefined)
            miembroData.nombres = dto.nombres;
        if (dto.apellidos !== undefined)
            miembroData.apellidos = dto.apellidos;
        if (dto.fechaNacimiento !== undefined)
            miembroData.fechaNacimiento = new Date(dto.fechaNacimiento);
        if (dto.unidadId !== undefined)
            miembroData.unidadId = dto.unidadId;
        if (dto.cedula !== undefined)
            miembroData.cedula = dto.cedula;
        if (dto.genero !== undefined)
            miembroData.genero = dto.genero;
        miembroData.updatedBy = actorId;
        const jovenData = {};
        if (dto.representanteId !== undefined)
            jovenData.representanteId = dto.representanteId;
        if (dto.historial !== undefined)
            jovenData.historial = dto.historial;
        const dataToUpdate = Object.assign({}, miembroData);
        if (Object.keys(jovenData).length > 0) {
            dataToUpdate.Joven = {
                update: jovenData
            };
        }
        const updated = await this.prisma.miembro.update({
            where: { id },
            data: dataToUpdate,
            include: { Joven: true }
        });
        await this.auditService.logAction({
            actorId,
            action: 'JOVEN_UPDATED',
            module: 'jovenes',
            targetId: updated.id,
            description: 'Joven actualizado',
        });
        return Object.assign(Object.assign(Object.assign({}, updated), updated.Joven), { id: updated.id });
    }
    async removeJoven(id, actorId) {
        const miembro = await this.findOne(id);
        await this.validateUnitAccess(actorId, miembro.unidadId);
        const result = await this.prisma.miembro.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: actorId }
        });
        await this.auditService.logAction({
            actorId,
            action: 'JOVEN_DELETED',
            module: 'jovenes',
            targetId: id,
            description: 'Joven eliminado (soft delete)',
        });
        return result;
    }
    async getStats() {
        const totalJovenes = await this.prisma.miembro.count({
            where: { tipo: 'JOVEN', deletedAt: null }
        });
        const [manada, tropa, clan] = await Promise.all([
            this.prisma.miembro.count({
                where: { tipo: 'JOVEN', deletedAt: null, Unidad: { nombre: 'Manada' } }
            }),
            this.prisma.miembro.count({
                where: { tipo: 'JOVEN', deletedAt: null, Unidad: { nombre: 'Tropa' } }
            }),
            this.prisma.miembro.count({
                where: { tipo: 'JOVEN', deletedAt: null, Unidad: { nombre: 'Clan' } }
            }),
        ]);
        return {
            totalJovenes,
            manada,
            tropa,
            clan,
        };
    }
};
exports.JovenesService = JovenesService;
exports.JovenesService = JovenesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], JovenesService);
//# sourceMappingURL=jovenes.service.js.map