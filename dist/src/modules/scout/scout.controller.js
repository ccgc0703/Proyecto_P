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
exports.ScoutController = void 0;
const common_1 = require("@nestjs/common");
const scout_service_1 = require("./scout.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constantes_1 = require("../../common/constantes");
let ScoutController = class ScoutController {
    constructor(scoutService) {
        this.scoutService = scoutService;
    }
    async createProgresion(data, req) {
        const progresion = await this.scoutService.createProgresion(data, req.user.id);
        return { success: true, message: 'Progresión registrada', data: progresion };
    }
    async findAllProgresiones() {
        const progresiones = await this.scoutService.findAllProgresiones();
        return { success: true, message: 'Progresiones recuperadas', data: progresiones };
    }
    async findProgresion(id) {
        const progresion = await this.scoutService.findProgresionById(id);
        return { success: true, message: 'Progresión recuperada', data: progresion };
    }
    async updateProgresion(id, data, req) {
        const progresion = await this.scoutService.updateProgresion(id, data, req.user.id);
        return { success: true, message: 'Progresión actualizada', data: progresion };
    }
    async removeProgresion(id, req) {
        await this.scoutService.removeProgresion(id, req.user.id);
        return { success: true, message: 'Progresión eliminada', data: null };
    }
    async createCondecoracion(data, req) {
        const condecoracion = await this.scoutService.createCondecoracion(data, req.user.id);
        return { success: true, message: 'Condecoración creada en catálogo', data: condecoracion };
    }
    async findAllCondecoraciones() {
        const condecoraciones = await this.scoutService.findAllCondecoraciones();
        return { success: true, message: 'Condecoraciones recuperadas', data: condecoraciones };
    }
    async removeCondecoracion(id, req) {
        await this.scoutService.removeCondecoracion(id, req.user.id);
        return { success: true, message: 'Condecoración eliminada', data: null };
    }
    async otorgarCondecoracion(data, req) {
        const result = await this.scoutService.otorgarCondecoracion(data.jovenId, data.condecoracionId, req.user.id);
        return { success: true, message: 'Condecoración otorgada exitosamente', data: result };
    }
    async findJovenCondecoraciones(jovenId) {
        const condecoraciones = await this.scoutService.findJovenCondecoraciones(jovenId);
        return { success: true, message: 'Condecoraciones del joven', data: condecoraciones };
    }
    async removeJovenCondecoracion(id, req) {
        await this.scoutService.removeJovenCondecoracion(id, req.user.id);
        return { success: true, message: 'Condecoración removida del joven', data: null };
    }
};
exports.ScoutController = ScoutController;
__decorate([
    (0, common_1.Post)('progresiones'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.PROGRESION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "createProgresion", null);
__decorate([
    (0, common_1.Get)('progresiones'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.PROGRESION_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "findAllProgresiones", null);
__decorate([
    (0, common_1.Get)('progresiones/:id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.PROGRESION_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "findProgresion", null);
__decorate([
    (0, common_1.Patch)('progresiones/:id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.PROGRESION_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "updateProgresion", null);
__decorate([
    (0, common_1.Delete)('progresiones/:id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.PROGRESION_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "removeProgresion", null);
__decorate([
    (0, common_1.Post)('condecoraciones'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.CONDECORACION_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "createCondecoracion", null);
__decorate([
    (0, common_1.Get)('condecoraciones'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.CONDECORACION_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "findAllCondecoraciones", null);
__decorate([
    (0, common_1.Delete)('condecoraciones/:id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.CONDECORACION_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "removeCondecoracion", null);
__decorate([
    (0, common_1.Post)('otorgar-condecoracion'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.CONDECORACION_OTORGAR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "otorgarCondecoracion", null);
__decorate([
    (0, common_1.Get)('jovenes/:jovenId/condecoraciones'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.CONDECORACION_VIEW),
    __param(0, (0, common_1.Param)('jovenId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "findJovenCondecoraciones", null);
__decorate([
    (0, common_1.Delete)('jovenes-condecoraciones/:id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.CONDECORACION_OTORGAR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScoutController.prototype, "removeJovenCondecoracion", null);
exports.ScoutController = ScoutController = __decorate([
    (0, common_1.Controller)('scout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [scout_service_1.ScoutService])
], ScoutController);
//# sourceMappingURL=scout.controller.js.map