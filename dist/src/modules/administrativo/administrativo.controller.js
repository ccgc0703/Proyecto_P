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
exports.AdministrativoController = void 0;
const common_1 = require("@nestjs/common");
const administrativo_service_1 = require("./administrativo.service");
const create_representante_dto_1 = require("./dto/create-representante.dto");
const update_representante_dto_1 = require("./dto/update-representante.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constantes_1 = require("../../common/constantes");
let AdministrativoController = class AdministrativoController {
    constructor(administrativoService) {
        this.administrativoService = administrativoService;
    }
    async createRepresentante(dto, req) {
        const representante = await this.administrativoService.createRepresentante(dto, req.user.id);
        return {
            success: true,
            message: 'Representante registrado exitosamente',
            data: representante,
        };
    }
    async findAllRepresentantes() {
        const representantes = await this.administrativoService.findAll();
        return {
            success: true,
            message: 'Representantes recuperados exitosamente',
            data: representantes,
        };
    }
    async findOneRepresentante(id) {
        const representante = await this.administrativoService.findOne(id);
        return {
            success: true,
            message: 'Representante recuperado exitosamente',
            data: representante,
        };
    }
    async updateRepresentante(id, dto, req) {
        const representante = await this.administrativoService.updateRepresentante(id, dto, req.user.id);
        return {
            success: true,
            message: 'Representante actualizado exitosamente',
            data: representante,
        };
    }
    async removeRepresentante(id, req) {
        await this.administrativoService.remove(id, req.user.id);
        return {
            success: true,
            message: 'Representante eliminado exitosamente',
            data: null,
        };
    }
};
exports.AdministrativoController = AdministrativoController;
__decorate([
    (0, common_1.Post)('representantes'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.REPRESENTANTE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_representante_dto_1.CreateRepresentanteDto, Object]),
    __metadata("design:returntype", Promise)
], AdministrativoController.prototype, "createRepresentante", null);
__decorate([
    (0, common_1.Get)('representantes'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.REPRESENTANTE_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdministrativoController.prototype, "findAllRepresentantes", null);
__decorate([
    (0, common_1.Get)('representantes/:id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.REPRESENTANTE_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdministrativoController.prototype, "findOneRepresentante", null);
__decorate([
    (0, common_1.Patch)('representantes/:id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.REPRESENTANTE_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_representante_dto_1.UpdateRepresentanteDto, Object]),
    __metadata("design:returntype", Promise)
], AdministrativoController.prototype, "updateRepresentante", null);
__decorate([
    (0, common_1.Delete)('representantes/:id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.REPRESENTANTE_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdministrativoController.prototype, "removeRepresentante", null);
exports.AdministrativoController = AdministrativoController = __decorate([
    (0, common_1.Controller)('administrativo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [administrativo_service_1.AdministrativoService])
], AdministrativoController);
//# sourceMappingURL=administrativo.controller.js.map