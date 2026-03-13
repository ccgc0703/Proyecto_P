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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const base_service_1 = require("../../common/base.service");
const audit_service_1 = require("../audit/audit.service");
const bcrypt = require("bcryptjs");
let UsersService = class UsersService extends base_service_1.BaseService {
    constructor(prisma, auditService) {
        super(prisma, 'usuario');
        this.auditService = auditService;
    }
    async findAll(where = {}) {
        const users = await super.findAll(where);
        return users.map((user) => this.excludePassword(user));
    }
    async findOne(id) {
        const user = await super.findOne(id);
        return this.excludePassword(user);
    }
    async create(createUserDto, creatorId, ip, userAgent) {
        const existing = await this.prisma.usuario.findUnique({
            where: { email: createUserDto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('El email ya está registrado');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await super.create(Object.assign(Object.assign({}, createUserDto), { password: hashedPassword }), creatorId);
        await this.auditService.logAction({
            actorId: creatorId,
            action: 'USER_CREATED',
            module: 'users',
            targetId: user.id,
            description: 'Usuario creado',
            ipAddress: ip,
            userAgent,
        });
        return this.excludePassword(user);
    }
    async updateUser(id, dto, actorId, ip, userAgent) {
        const existing = await this.prisma.usuario.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (dto.email && dto.email !== existing.email) {
            const emailTaken = await this.prisma.usuario.findUnique({
                where: { email: dto.email },
            });
            if (emailTaken) {
                throw new common_1.ConflictException('El email ya está registrado');
            }
        }
        const updateData = {};
        if (dto.nombre !== undefined)
            updateData.nombre = dto.nombre;
        if (dto.email !== undefined)
            updateData.email = dto.email;
        if (dto.unidadId !== undefined)
            updateData.unidadId = dto.unidadId;
        updateData.updatedBy = actorId;
        const user = await this.prisma.usuario.update({
            where: { id },
            data: updateData,
        });
        await this.auditService.logAction({
            actorId,
            action: 'USER_UPDATED',
            module: 'users',
            targetId: user.id,
            description: 'Usuario actualizado',
            ipAddress: ip,
            userAgent,
        });
        return this.excludePassword(user);
    }
    async remove(id, userId, ip, userAgent) {
        const result = await super.remove(id, userId);
        await this.auditService.logAction({
            actorId: userId,
            action: 'USER_DELETED',
            module: 'users',
            targetId: id,
            description: 'Usuario eliminado (soft delete)',
            ipAddress: ip,
            userAgent,
        });
        return result;
    }
    excludePassword(user) {
        if (!user)
            return null;
        const { password } = user, userWithoutPassword = __rest(user, ["password"]);
        return userWithoutPassword;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map