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
exports.RbacController = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("./rbac.service");
const assign_role_dto_1 = require("./dto/assign-role.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constantes_1 = require("../../common/constantes");
let RbacController = class RbacController {
    constructor(rbacService) {
        this.rbacService = rbacService;
    }
    async listRoles() {
        const data = await this.rbacService.listRoles();
        return { success: true, message: 'Roles del sistema', data };
    }
    async listPermisos() {
        const data = await this.rbacService.listPermisos();
        return { success: true, message: 'Permisos del sistema', data };
    }
    async getUserPermissions(id) {
        const data = await this.rbacService.getUserPermissions(id);
        return { success: true, message: `Permisos del usuario ${id}`, data };
    }
    async assignRole(usuarioId, dto, req) {
        const result = await this.rbacService.assignRole(usuarioId, dto.rolId, req.user.id, req.ip);
        return { success: true, message: result.message, data: result.asignacion };
    }
    async revokeRole(usuarioId, rolId, req) {
        const result = await this.rbacService.revokeRole(usuarioId, rolId, req.user.id, req.ip);
        return { success: true, message: result.message, data: null };
    }
    async assignRoleByName(dto, req) {
        const result = await this.rbacService.assignRoleByName(dto, req.user.id, req.ip);
        return { success: true, message: result.message, data: result.asignacion };
    }
};
exports.RbacController = RbacController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.RBAC_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)('permisos'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.RBAC_VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "listPermisos", null);
__decorate([
    (0, common_1.Get)('usuarios/:id/permisos'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getUserPermissions", null);
__decorate([
    (0, common_1.Post)('usuarios/:id/roles'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_role_dto_1.AssignRoleDto, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)('usuarios/:id/roles/:rolId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('rolId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "revokeRole", null);
__decorate([
    (0, common_1.Post)('assign-role'),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.RBAC_ASSIGN_ROLE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_role_dto_1.AssignRoleByNameDto, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "assignRoleByName", null);
exports.RbacController = RbacController = __decorate([
    (0, common_1.Controller)('rbac'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)(constantes_1.PERMISSIONS.RBAC_MANAGE),
    __metadata("design:paramtypes", [rbac_service_1.RbacService])
], RbacController);
//# sourceMappingURL=rbac.controller.js.map