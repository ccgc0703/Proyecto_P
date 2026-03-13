"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitPolicy = void 0;
const common_1 = require("@nestjs/common");
const constantes_1 = require("../constantes");
let UnitPolicy = class UnitPolicy {
    constructor() {
        this.unitRestrictedRoles = [
            constantes_1.ROLES.JEFE_GRUPO,
            constantes_1.ROLES.SUBJEFE_GRUPO,
            constantes_1.ROLES.ADULTO_MANADA,
            constantes_1.ROLES.ADULTO_TROPA,
            constantes_1.ROLES.ADULTO_CLAN,
        ];
    }
    canManageUnit(user, targetUnitId) {
        if (!targetUnitId)
            return true;
        if (!this.unitRestrictedRoles.includes(user.rol))
            return true;
        return user.unidadId === targetUnitId;
    }
    assertCanManageUnit(user, targetUnitId) {
        if (!this.canManageUnit(user, targetUnitId)) {
            throw new common_1.ForbiddenException('Aislamiento de Unidad: Solo puedes gestionar datos de tu propia unidad asignada');
        }
    }
};
exports.UnitPolicy = UnitPolicy;
exports.UnitPolicy = UnitPolicy = __decorate([
    (0, common_1.Injectable)()
], UnitPolicy);
//# sourceMappingURL=unit.policy.js.map