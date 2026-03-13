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
exports.ScoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const base_service_1 = require("../../common/base.service");
let ScoutService = class ScoutService extends base_service_1.BaseService {
    constructor(prisma) {
        super(prisma, 'progresion');
    }
    async createProgresion(data, userId) {
        return this.prisma.progresion.create({
            data: Object.assign(Object.assign({}, data), { createdAt: new Date(), createdBy: userId }),
        });
    }
    async findAllProgresiones() {
        return this.prisma.progresion.findMany({
            where: { deletedAt: null },
            include: { Joven: true, Unidad: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findProgresionById(id) {
        const progresion = await this.prisma.progresion.findFirst({
            where: { id, deletedAt: null },
            include: { Joven: true, Unidad: true },
        });
        if (!progresion) {
            throw new common_1.NotFoundException('Progresión no encontrada');
        }
        return progresion;
    }
    async updateProgresion(id, data, userId) {
        await this.findProgresionById(id);
        return this.prisma.progresion.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { updatedAt: new Date(), updatedBy: userId }),
        });
    }
    async removeProgresion(id, userId) {
        await this.findProgresionById(id);
        return this.prisma.progresion.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }
    async createCondecoracion(data, userId) {
        return this.prisma.condecoracion.create({
            data: Object.assign(Object.assign({}, data), { createdAt: new Date(), createdBy: userId }),
        });
    }
    async findAllCondecoraciones() {
        return this.prisma.condecoracion.findMany({
            where: { deletedAt: null },
            orderBy: { nombre: 'asc' },
        });
    }
    async findCondecoracionById(id) {
        const condecoracion = await this.prisma.condecoracion.findFirst({
            where: { id, deletedAt: null },
        });
        if (!condecoracion) {
            throw new common_1.NotFoundException('Condecoración no encontrada');
        }
        return condecoracion;
    }
    async removeCondecoracion(id, userId) {
        await this.findCondecoracionById(id);
        return this.prisma.condecoracion.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }
    async findJovenCondecoraciones(jovenId) {
        return this.prisma.jovenCondecoracion.findMany({
            where: { jovenId, deletedAt: null },
            include: { Condecoracion: true },
            orderBy: { fechaOtorgada: 'desc' },
        });
    }
    async removeJovenCondecoracion(id, userId) {
        const jovenCondec = await this.prisma.jovenCondecoracion.findFirst({
            where: { id, deletedAt: null },
        });
        if (!jovenCondec) {
            throw new common_1.NotFoundException('Condecoración del joven no encontrada');
        }
        return this.prisma.jovenCondecoracion.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }
    async otorgarCondecoracion(jovenId, condecoracionId, userId) {
        return this.prisma.jovenCondecoracion.create({
            data: {
                jovenId,
                condecoracionId,
                fechaOtorgada: new Date(),
                createdAt: new Date(),
                createdBy: userId,
            },
        });
    }
};
exports.ScoutService = ScoutService;
exports.ScoutService = ScoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScoutService);
//# sourceMappingURL=scout.service.js.map