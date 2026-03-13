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
exports.JovenesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const base_service_1 = require("../../common/base.service");
const audit_service_1 = require("../audit/audit.service");
const ADULT_UNIT_MAP = {
    ADULTO_MANADA: 'Manada',
    ADULTO_TROPA: 'Tropa',
    ADULTO_CLAN: 'Clan',
};
const UNIT_BYPASS_ROLES = ['SYSTEM_ADMIN', 'GROUP_LEADER'];
let JovenesService = class JovenesService extends base_service_1.BaseService {
    constructor(prisma, auditService) {
        super(prisma, 'joven');
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
        return this.prisma.joven.findMany({
            where: {
                unidadId,
                deletedAt: null,
            },
            include: {
                Unidad: true,
                Representante: true,
            },
        });
    }
    async createJoven(createJovenDto, userId, userRol, userUnidadId) {
        await this.validateUnitAccess(userId, createJovenDto.unidadId);
        const joven = await super.create(Object.assign(Object.assign({}, createJovenDto), { fechaNacimiento: new Date(createJovenDto.fechaNacimiento) }), userId);
        await this.auditService.logAction({
            actorId: userId,
            action: 'JOVEN_CREATED',
            module: 'jovenes',
            targetId: joven.id,
            description: 'Joven registrado',
        });
        return joven;
    }
    async updateJoven(id, dto, actorId) {
        const joven = await this.findOne(id);
        await this.validateUnitAccess(actorId, joven.unidadId);
        if (dto.unidadId && dto.unidadId !== joven.unidadId) {
            await this.validateUnitAccess(actorId, dto.unidadId);
        }
        const updateData = {};
        if (dto.nombres !== undefined)
            updateData.nombres = dto.nombres;
        if (dto.apellidos !== undefined)
            updateData.apellidos = dto.apellidos;
        if (dto.fechaNacimiento !== undefined)
            updateData.fechaNacimiento = new Date(dto.fechaNacimiento);
        if (dto.unidadId !== undefined)
            updateData.unidadId = dto.unidadId;
        updateData.updatedBy = actorId;
        const updated = await this.prisma.joven.update({
            where: { id },
            data: updateData,
        });
        await this.auditService.logAction({
            actorId,
            action: 'JOVEN_UPDATED',
            module: 'jovenes',
            targetId: updated.id,
            description: 'Joven actualizado',
        });
        return updated;
    }
    async removeJoven(id, actorId) {
        const joven = await this.findOne(id);
        await this.validateUnitAccess(actorId, joven.unidadId);
        const result = await super.remove(id, actorId);
        await this.auditService.logAction({
            actorId,
            action: 'JOVEN_DELETED',
            module: 'jovenes',
            targetId: id,
            description: 'Joven eliminado (soft delete)',
        });
        return result;
    }
};
exports.JovenesService = JovenesService;
exports.JovenesService = JovenesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], JovenesService);
//# sourceMappingURL=jovenes.service.js.map