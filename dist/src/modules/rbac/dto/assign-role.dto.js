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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignRoleByNameDto = exports.AssignRoleDto = void 0;
const class_validator_1 = require("class-validator");
class AssignRoleDto {
}
exports.AssignRoleDto = AssignRoleDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'rolId debe ser un string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'rolId es requerido' }),
    (0, class_validator_1.IsUUID)('4', { message: 'rolId debe ser un UUID válido' }),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "rolId", void 0);
class AssignRoleByNameDto {
}
exports.AssignRoleByNameDto = AssignRoleByNameDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'usuarioId debe ser un string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'usuarioId es requerido' }),
    (0, class_validator_1.IsUUID)('4', { message: 'usuarioId debe ser un UUID válido' }),
    __metadata("design:type", String)
], AssignRoleByNameDto.prototype, "usuarioId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'rolNombre debe ser un string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'rolNombre es requerido' }),
    __metadata("design:type", String)
], AssignRoleByNameDto.prototype, "rolNombre", void 0);
//# sourceMappingURL=assign-role.dto.js.map