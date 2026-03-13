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
exports.FichaMedicaController = void 0;
const common_1 = require("@nestjs/common");
const ficha_medica_service_1 = require("./ficha-medica.service");
const create_ficha_medica_dto_1 = require("./dto/create-ficha-medica.dto");
const update_ficha_medica_dto_1 = require("./dto/update-ficha-medica.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constantes_1 = require("../../common/constantes");
let FichaMedicaController = class FichaMedicaController {
    constructor(fichaMedicaService) {
        this.fichaMedicaService = fichaMedicaService;
    }
    async create(dto, req) {
        const ficha = await this.fichaMedicaService.create(dto, req.user.id);
        return { success: true, message: 'Ficha médica creada', data: ficha };
    }
    async findAll() {
        const fichas = await this.fichaMedicaService.findAll();
        return { success: true, message: 'Fichas médicas recuperadas', data: fichas };
    }
    async findByJoven(jovenId) {
        const ficha = await this.fichaMedicaService.findByJoven(jovenId);
        return { success: true, message: 'Ficha médica del joven', data: ficha };
    }
    async findOne(id) {
        const ficha = await this.fichaMedicaService.findOne(id);
        return { success: true, message: 'Ficha médica recuperada', data: ficha };
    }
    async update(id, dto, req) {
        const ficha = await this.fichaMedicaService.update(id, dto, req.user.id);
        return { success: true, message: 'Ficha médica actualizada', data: ficha };
    }
    async remove(id, req) {
        await this.fichaMedicaService.remove(id, req.user.id);
        return { success: true, message: 'Ficha médica eliminada', data: null };
    }
};
exports.FichaMedicaController = FichaMedicaController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.MEDICO_EDIT),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ficha_medica_dto_1.CreateFichaMedicaDto, Object]),
    __metadata("design:returntype", Promise)
], FichaMedicaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.MEDICO_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FichaMedicaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('joven/:jovenId'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.MEDICO_VIEW),
    __param(0, (0, common_1.Param)('jovenId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FichaMedicaController.prototype, "findByJoven", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.MEDICO_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FichaMedicaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.MEDICO_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_ficha_medica_dto_1.UpdateFichaMedicaDto, Object]),
    __metadata("design:returntype", Promise)
], FichaMedicaController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.MEDICO_EDIT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FichaMedicaController.prototype, "remove", null);
exports.FichaMedicaController = FichaMedicaController = __decorate([
    (0, common_1.Controller)('ficha-medica'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [ficha_medica_service_1.FichaMedicaService])
], FichaMedicaController);
//# sourceMappingURL=ficha-medica.controller.js.map