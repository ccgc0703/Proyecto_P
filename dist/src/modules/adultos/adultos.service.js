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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdultosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const audit_service_1 = require("../audit/audit.service");
let AdultosService = class AdultosService {
    constructor(prisma, usersService, auditService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.auditService = auditService;
    }
    async findAll() {
        const adultos = await this.prisma.adulto.findMany({
            include: { Miembro: { include: { Unidad: true } }, Usuario: { include: { UsuarioRoles: { include: { Rol: true } } } }, Formaciones: true }
        });
        return adultos.map(a => {
            var _a;
            const { Miembro, Usuario } = a, rest = __rest(a, ["Miembro", "Usuario"]);
            return Object.assign(Object.assign(Object.assign({}, rest), Miembro), { email: Usuario === null || Usuario === void 0 ? void 0 : Usuario.email, activo: Miembro.estado === 'ACTIVO', roles: ((_a = Usuario === null || Usuario === void 0 ? void 0 : Usuario.UsuarioRoles) === null || _a === void 0 ? void 0 : _a.map(ur => ur.Rol.nombre)) || [], Unidad: Miembro.Unidad, Usuario, id: a.id });
        });
    }
    async findOne(id) {
        var _a;
        const a = await this.prisma.adulto.findUnique({
            where: { id },
            include: { Miembro: { include: { Unidad: true } }, Usuario: { include: { UsuarioRoles: { include: { Rol: true } } } }, Formaciones: true }
        });
        if (!a)
            throw new common_1.NotFoundException('Adulto no encontrado');
        const { Miembro, Usuario } = a, rest = __rest(a, ["Miembro", "Usuario"]);
        return Object.assign(Object.assign(Object.assign({}, rest), Miembro), { email: Usuario === null || Usuario === void 0 ? void 0 : Usuario.email, activo: Miembro.estado === 'ACTIVO', roles: ((_a = Usuario === null || Usuario === void 0 ? void 0 : Usuario.UsuarioRoles) === null || _a === void 0 ? void 0 : _a.map(ur => ur.Rol.nombre)) || [], Unidad: Miembro.Unidad, Usuario, id: a.id });
    }
    async create(dto, creatorId) {
        const existing = await this.prisma.miembro.findUnique({ where: { cedula: dto.cedula } });
        if (existing)
            throw new common_1.ConflictException('Cédula ya registrada');
        let usuarioId = null;
        if (dto.email && dto.password) {
            const user = await this.usersService.create({
                nombre: dto.nombres,
                apellido: dto.apellidos,
                email: dto.email,
                password: dto.password,
                unidadId: dto.unidadId
            }, creatorId);
            usuarioId = user.id;
            if (dto.rolId) {
                await this.prisma.usuarioRol.create({
                    data: { usuarioId: user.id, rolId: dto.rolId, asignadoPor: creatorId }
                });
            }
        }
        const adultoData = {
            ocupacion: dto.ocupacion,
            telefono: dto.telefono,
            direccion: dto.direccion,
            Miembro: {
                create: {
                    nombres: dto.nombres,
                    apellidos: dto.apellidos,
                    cedula: dto.cedula,
                    fechaNacimiento: new Date(dto.fechaNacimiento),
                    genero: dto.genero,
                    tipo: 'ADULTO',
                    unidadId: dto.unidadId,
                    createdBy: creatorId,
                }
            }
        };
        if (usuarioId) {
            adultoData.Usuario = { connect: { id: usuarioId } };
        }
        const adulto = await this.prisma.adulto.create({
            data: adultoData,
            include: { Miembro: true }
        });
        await this.auditService.logAction({
            actorId: creatorId,
            action: 'ADULTO_CREATED',
            module: 'adultos',
            targetId: adulto.id,
            description: 'Adulto registrado',
        });
        return this.findOne(adulto.id);
    }
    async update(id, dto, actorId) {
        const adulto = await this.prisma.adulto.findUnique({ where: { id }, include: { Miembro: true } });
        if (!adulto)
            throw new common_1.NotFoundException('Adulto no encontrado');
        const adultoData = {};
        if (dto.ocupacion !== undefined)
            adultoData.ocupacion = dto.ocupacion;
        if (dto.telefono !== undefined)
            adultoData.telefono = dto.telefono;
        if (dto.direccion !== undefined)
            adultoData.direccion = dto.direccion;
        const miembroData = { updatedBy: actorId };
        if (dto.nombres !== undefined)
            miembroData.nombres = dto.nombres;
        if (dto.apellidos !== undefined)
            miembroData.apellidos = dto.apellidos;
        if (dto.cedula !== undefined)
            miembroData.cedula = dto.cedula;
        if (dto.fechaNacimiento !== undefined)
            miembroData.fechaNacimiento = new Date(dto.fechaNacimiento);
        if (dto.genero !== undefined)
            miembroData.genero = dto.genero;
        if (dto.unidadId !== undefined)
            miembroData.unidadId = dto.unidadId;
        await this.prisma.adulto.update({
            where: { id },
            data: Object.assign(Object.assign({}, adultoData), { Miembro: { update: miembroData } })
        });
        return this.findOne(id);
    }
    async createAccount(id, dto, creatorId) {
        const adulto = await this.prisma.adulto.findUnique({ where: { id }, include: { Miembro: true } });
        if (!adulto)
            throw new common_1.NotFoundException('Adulto no encontrado');
        if (adulto.usuarioId)
            throw new common_1.ConflictException('Adulto ya tiene una cuenta de usuario vinculada');
        const user = await this.usersService.create({
            nombre: adulto.Miembro.nombres,
            apellido: adulto.Miembro.apellidos,
            email: dto.email,
            password: dto.password,
            unidadId: adulto.Miembro.unidadId
        }, creatorId);
        if (dto.rolId) {
            await this.prisma.usuarioRol.create({
                data: { usuarioId: user.id, rolId: dto.rolId, asignadoPor: creatorId }
            });
        }
        await this.prisma.adulto.update({
            where: { id },
            data: { usuarioId: user.id }
        });
        return this.findOne(id);
    }
    async remove(id, actorId) {
        const adulto = await this.prisma.adulto.findUnique({ where: { id }, include: { Miembro: true } });
        if (!adulto)
            throw new common_1.NotFoundException('Adulto no encontrado');
        await this.prisma.miembro.update({
            where: { id: adulto.miembroId },
            data: { deletedAt: new Date(), updatedBy: actorId }
        });
        if (adulto.usuarioId) {
            await this.usersService.remove(adulto.usuarioId, actorId);
        }
        return { message: 'Adulto eliminado lógicamente' };
    }
};
exports.AdultosService = AdultosService;
exports.AdultosService = AdultosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        audit_service_1.AuditService])
], AdultosService);
//# sourceMappingURL=adultos.service.js.map