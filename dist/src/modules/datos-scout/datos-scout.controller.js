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
exports.DatosScoutController = void 0;
const common_1 = require("@nestjs/common");
const datos_scout_service_1 = require("./datos-scout.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let DatosScoutController = class DatosScoutController {
    constructor(datosScoutService) {
        this.datosScoutService = datosScoutService;
    }
    findAll() {
        return this.datosScoutService.findAll();
    }
    findByMiembro(miembroId) {
        return this.datosScoutService.findByMiembro(miembroId);
    }
};
exports.DatosScoutController = DatosScoutController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DatosScoutController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('miembro/:miembroId'),
    __param(0, (0, common_1.Param)('miembroId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DatosScoutController.prototype, "findByMiembro", null);
exports.DatosScoutController = DatosScoutController = __decorate([
    (0, common_1.Controller)('datos-scout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [datos_scout_service_1.DatosScoutService])
], DatosScoutController);
//# sourceMappingURL=datos-scout.controller.js.map