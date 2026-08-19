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
exports.AdultosController = void 0;
const common_1 = require("@nestjs/common");
const adultos_service_1 = require("./adultos.service");
const create_adulto_dto_1 = require("./dto/create-adulto.dto");
const update_adulto_dto_1 = require("./dto/update-adulto.dto");
const create_account_dto_1 = require("./dto/create-account.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constantes_1 = require("../../common/constantes");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
let AdultosController = class AdultosController {
    constructor(adultosService) {
        this.adultosService = adultosService;
    }
    findAll() {
        return this.adultosService.findAll();
    }
    findOne(id) {
        return this.adultosService.findOne(id);
    }
    create(dto, req) {
        return this.adultosService.create(dto, req.user.id);
    }
    update(id, dto, req) {
        return this.adultosService.update(id, dto, req.user.id);
    }
    createAccount(id, dto, req) {
        return this.adultosService.createAccount(id, dto, req.user.id);
    }
    remove(id, req) {
        return this.adultosService.remove(id, req.user.id);
    }
};
exports.AdultosController = AdultosController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.USER_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdultosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.USER_VIEW),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdultosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.USER_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_adulto_dto_1.CreateAdultoDto, Object]),
    __metadata("design:returntype", void 0)
], AdultosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.USER_UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_adulto_dto_1.UpdateAdultoDto, Object]),
    __metadata("design:returntype", void 0)
], AdultosController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/cuenta'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.USER_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_account_dto_1.CreateAccountDto, Object]),
    __metadata("design:returntype", void 0)
], AdultosController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.USER_DELETE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdultosController.prototype, "remove", null);
exports.AdultosController = AdultosController = __decorate([
    (0, common_1.Controller)('adultos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [adultos_service_1.AdultosService])
], AdultosController);
//# sourceMappingURL=adultos.controller.js.map