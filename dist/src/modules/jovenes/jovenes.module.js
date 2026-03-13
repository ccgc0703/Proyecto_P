"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JovenesModule = void 0;
const common_1 = require("@nestjs/common");
const jovenes_service_1 = require("./jovenes.service");
const jovenes_controller_1 = require("./jovenes.controller");
const unit_policy_1 = require("../../common/policies/unit.policy");
let JovenesModule = class JovenesModule {
};
exports.JovenesModule = JovenesModule;
exports.JovenesModule = JovenesModule = __decorate([
    (0, common_1.Module)({
        providers: [jovenes_service_1.JovenesService, unit_policy_1.UnitPolicy],
        controllers: [jovenes_controller_1.JovenesController],
        exports: [jovenes_service_1.JovenesService],
    })
], JovenesModule);
//# sourceMappingURL=jovenes.module.js.map