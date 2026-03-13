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
exports.AuditoriaInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
let AuditoriaInterceptor = class AuditoriaInterceptor {
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const usuario = request.user;
        const ip = request.ip;
        const tabla = context.getClass().name.replace('Controller', '');
        const accion = context.getHandler().name;
        const datosAntes = request.body;
        return next.handle().pipe((0, operators_1.tap)(async (datosDespues) => {
            var _a;
            try {
                await this.prisma.bitacoraAuditoria.create({
                    data: {
                        usuarioId: (usuario === null || usuario === void 0 ? void 0 : usuario.id) || null,
                        accion,
                        tabla,
                        registroId: ((_a = datosDespues === null || datosDespues === void 0 ? void 0 : datosDespues.id) === null || _a === void 0 ? void 0 : _a.toString()) || 'N/A',
                        datosAntes: datosAntes ? JSON.parse(JSON.stringify(datosAntes)) : null,
                        datosDespues: datosDespues ? JSON.parse(JSON.stringify(datosDespues)) : null,
                        ip,
                        createdBy: (usuario === null || usuario === void 0 ? void 0 : usuario.id) || 'SYSTEM',
                    },
                });
            }
            catch (error) {
                console.error('Error logging audit:', error);
            }
        }));
    }
};
exports.AuditoriaInterceptor = AuditoriaInterceptor;
exports.AuditoriaInterceptor = AuditoriaInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditoriaInterceptor);
//# sourceMappingURL=auditoria.interceptor.js.map