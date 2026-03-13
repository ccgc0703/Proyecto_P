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
exports.UnidadesController = void 0;
const common_1 = require("@nestjs/common");
const unidades_service_1 = require("./unidades.service");
const create_unidad_dto_1 = require("./dto/create-unidad.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constantes_1 = require("../../common/constantes");
let UnidadesController = class UnidadesController {
    constructor(unidadesService) {
        this.unidadesService = unidadesService;
    }
    async create(createUnidadDto, req) {
        const unidad = await this.unidadesService.create(createUnidadDto, req.user.id);
        return {
            success: true,
            message: 'Unidad creada exitosamente',
            data: unidad,
        };
    }
    async findAll() {
        const unidades = await this.unidadesService.findAll();
        return {
            success: true,
            message: 'Unidades recuperadas exitosamente',
            data: unidades,
        };
    }
    async findOne(id) {
        const unidad = await this.unidadesService.findOne(id);
        return {
            success: true,
            message: 'Unidad recuperada exitosamente',
            data: unidad,
        };
    }
    async remove(id, req) {
        await this.unidadesService.remove(id, req.user.id);
        return {
            success: true,
            message: 'Unidad eliminada exitosamente',
            data: null,
        };
    }
};
exports.UnidadesController = UnidadesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.UNIDAD_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_unidad_dto_1.CreateUnidadDto, Object]),
    __metadata("design:returntype", Promise)
], UnidadesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.UNIDAD_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UnidadesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.UNIDAD_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UnidadesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.UNIDAD_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UnidadesController.prototype, "remove", null);
exports.UnidadesController = UnidadesController = __decorate([
    (0, common_1.Controller)('unidades'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [unidades_service_1.UnidadesService])
], UnidadesController);
//# sourceMappingURL=unidades.controller.js.map