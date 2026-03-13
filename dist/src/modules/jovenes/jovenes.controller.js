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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JovenesController = void 0;
const common_1 = require("@nestjs/common");
const jovenes_service_1 = require("./jovenes.service");
const create_joven_dto_1 = require("./dto/create-joven.dto");
const update_joven_dto_1 = require("./dto/update-joven.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constantes_1 = require("../../common/constantes");
const unit_policy_1 = require("../../common/policies/unit.policy");
let JovenesController = class JovenesController {
    constructor(jovenesService, unitPolicy) {
        this.jovenesService = jovenesService;
        this.unitPolicy = unitPolicy;
    }
    async create(createJovenDto, req) {
        this.unitPolicy.assertCanManageUnit(req.user, createJovenDto.unidadId);
        const joven = await this.jovenesService.createJoven(createJovenDto, req.user.id, req.user.rol, req.user.unidadId);
        return {
            success: true,
            message: 'Joven registrado exitosamente',
            data: joven,
        };
    }
    async findAll(req, queryUnidadId) {
        var _a;
        const user = req.user;
        if (!this.unitPolicy.canManageUnit(user, (_a = user.unidadId) !== null && _a !== void 0 ? _a : undefined)) {
            const jovenes = await this.jovenesService.findAllByUnit(user.unidadId);
            return { success: true, message: 'Jóvenes de tu unidad recuperados', data: jovenes };
        }
        if (queryUnidadId) {
            const jovenes = await this.jovenesService.findAllByUnit(queryUnidadId);
            return { success: true, message: `Jóvenes de la unidad ${queryUnidadId} recuperados`, data: jovenes };
        }
        const jovenes = await this.jovenesService.findAll();
        return {
            success: true,
            message: 'Todos los jóvenes recuperados',
            data: jovenes,
        };
    }
    async findOne(id, req) {
        const joven = await this.jovenesService.findOne(id);
        this.unitPolicy.assertCanManageUnit(req.user, joven === null || joven === void 0 ? void 0 : joven.unidadId);
        return {
            success: true,
            message: 'Joven recuperado exitosamente',
            data: joven,
        };
    }
    async update(id, updateJovenDto, req) {
        const joven = await this.jovenesService.updateJoven(id, updateJovenDto, req.user.id);
        return {
            success: true,
            message: 'Joven actualizado exitosamente',
            data: joven,
        };
    }
    async remove(id, req) {
        await this.jovenesService.removeJoven(id, req.user.id);
        return {
            success: true,
            message: 'Joven eliminado exitosamente',
            data: null,
        };
    }
};
exports.JovenesController = JovenesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.JOVEN_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_joven_dto_1.CreateJovenDto, Object]),
    __metadata("design:returntype", Promise)
], JovenesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.JOVEN_VIEW),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('unidadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], JovenesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.JOVEN_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JovenesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.JOVEN_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_joven_dto_1.UpdateJovenDto, Object]),
    __metadata("design:returntype", Promise)
], JovenesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.JOVEN_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JovenesController.prototype, "remove", null);
exports.JovenesController = JovenesController = __decorate([
    (0, common_1.Controller)('jovenes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [jovenes_service_1.JovenesService,
        unit_policy_1.UnitPolicy])
], JovenesController);
//# sourceMappingURL=jovenes.controller.js.map