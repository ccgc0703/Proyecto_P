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
exports.BaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../modules/prisma/prisma.service");
let BaseService = class BaseService {
    constructor(prisma, model) {
        this.prisma = prisma;
        this.model = model;
    }
    async findAll(where = {}) {
        return this.prisma[this.model].findMany({
            where: Object.assign(Object.assign({}, where), { deletedAt: null }),
        });
    }
    async findOne(id) {
        const record = await this.prisma[this.model].findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
        if (!record) {
            throw new common_1.NotFoundException(`Record with ID ${id} not found or already deleted.`);
        }
        return record;
    }
    async create(data, userId) {
        return this.prisma[this.model].create({
            data: Object.assign(Object.assign({}, data), { createdAt: new Date(), createdBy: userId || 'SYSTEM' }),
        });
    }
    async update(id, data, userId) {
        return this.prisma[this.model].update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { updatedAt: new Date(), updatedBy: userId || 'SYSTEM' }),
        });
    }
    async remove(id, userId) {
        return this.prisma[this.model].update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId || 'SYSTEM',
            },
        });
    }
};
exports.BaseService = BaseService;
exports.BaseService = BaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, String])
], BaseService);
//# sourceMappingURL=base.service.js.map