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
exports.FormacionController = void 0;
const common_1 = require("@nestjs/common");
const formacion_service_1 = require("./formacion.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let FormacionController = class FormacionController {
    constructor(formacionService) {
        this.formacionService = formacionService;
    }
    findAll() {
        return this.formacionService.findAll();
    }
    findByAdulto(adultoId) {
        return this.formacionService.findByAdulto(adultoId);
    }
};
exports.FormacionController = FormacionController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FormacionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('adulto/:adultoId'),
    __param(0, (0, common_1.Param)('adultoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormacionController.prototype, "findByAdulto", null);
exports.FormacionController = FormacionController = __decorate([
    (0, common_1.Controller)('formacion'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [formacion_service_1.FormacionService])
], FormacionController);
//# sourceMappingURL=formacion.controller.js.map