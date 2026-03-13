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
exports.CreateJovenDto = void 0;
const class_validator_1 = require("class-validator");
class CreateJovenDto {
}
exports.CreateJovenDto = CreateJovenDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Los nombres son requeridos' }),
    __metadata("design:type", String)
], CreateJovenDto.prototype, "nombres", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Los apellidos son requeridos' }),
    __metadata("design:type", String)
], CreateJovenDto.prototype, "apellidos", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Fecha de nacimiento inválida' }),
    __metadata("design:type", String)
], CreateJovenDto.prototype, "fechaNacimiento", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'ID de unidad inválido' }),
    __metadata("design:type", String)
], CreateJovenDto.prototype, "unidadId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'ID de representante inválido' }),
    __metadata("design:type", String)
], CreateJovenDto.prototype, "representanteId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJovenDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJovenDto.prototype, "historial", void 0);
//# sourceMappingURL=create-joven.dto.js.map