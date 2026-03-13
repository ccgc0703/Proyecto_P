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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const constantes_1 = require("../../../common/constantes");
const prisma_service_1 = require("../../prisma/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: constantes_1.JWT_SECRET,
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        var _a;
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                nombre: true,
                email: true,
                unidadId: true,
                activo: true,
                deletedAt: true,
                tokenVersion: true,
            },
        });
        if (!usuario || !usuario.activo || usuario.deletedAt) {
            throw new common_1.UnauthorizedException('Usuario no válido o inactivo');
        }
        if (payload.tokenVersion !== usuario.tokenVersion) {
            throw new common_1.UnauthorizedException('Sesión expirada: tus permisos han cambiado. Por favor inicia sesión de nuevo.');
        }
        return {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            unidadId: usuario.unidadId,
            permissions: (_a = payload.permissions) !== null && _a !== void 0 ? _a : [],
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map