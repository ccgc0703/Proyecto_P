"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramasMundialesModule = void 0;
const common_1 = require("@nestjs/common");
const programas_mundiales_service_1 = require("./programas-mundiales.service");
const programas_mundiales_controller_1 = require("./programas-mundiales.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let ProgramasMundialesModule = class ProgramasMundialesModule {
};
exports.ProgramasMundialesModule = ProgramasMundialesModule;
exports.ProgramasMundialesModule = ProgramasMundialesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [programas_mundiales_controller_1.ProgramasMundialesController],
        providers: [programas_mundiales_service_1.ProgramasMundialesService]
    })
], ProgramasMundialesModule);
//# sourceMappingURL=programas-mundiales.module.js.map