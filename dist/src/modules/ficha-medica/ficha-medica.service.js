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
exports.FichaMedicaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FichaMedicaService = class FichaMedicaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, userId) {
        const existing = await this.prisma.fichaMedica.findUnique({
            where: { jovenId: dto.jovenId },
        });
        if (existing) {
            throw new common_1.ConflictException('El joven ya tiene una ficha médica registrada');
        }
        return this.prisma.fichaMedica.create({
            data: Object.assign(Object.assign({}, dto), { createdAt: new Date(), createdBy: userId }),
        });
    }
    async findAll() {
        return this.prisma.fichaMedica.findMany({
            where: { deletedAt: null },
            include: { Joven: true },
        });
    }
    async findByJoven(jovenId) {
        const ficha = await this.prisma.fichaMedica.findUnique({
            where: { jovenId },
            include: { Joven: true },
        });
        if (!ficha || ficha.deletedAt) {
            throw new common_1.NotFoundException('Ficha médica no encontrada');
        }
        return ficha;
    }
    async findOne(id) {
        const ficha = await this.prisma.fichaMedica.findFirst({
            where: { id, deletedAt: null },
            include: { Joven: true },
        });
        if (!ficha) {
            throw new common_1.NotFoundException('Ficha médica no encontrada');
        }
        return ficha;
    }
    async update(id, dto, userId) {
        await this.findOne(id);
        return this.prisma.fichaMedica.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { updatedAt: new Date(), updatedBy: userId }),
        });
    }
    async remove(id, userId) {
        await this.findOne(id);
        return this.prisma.fichaMedica.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }
};
exports.FichaMedicaService = FichaMedicaService;
exports.FichaMedicaService = FichaMedicaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FichaMedicaService);
//# sourceMappingURL=ficha-medica.service.js.map