import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdultoDto } from './dto/create-adulto.dto';
import { UpdateAdultoDto } from './dto/update-adulto.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdultosService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UsersService,
        private readonly auditService: AuditService,
    ) { }

    async findAll() {
        const adultos = await this.prisma.adulto.findMany({
            include: { Miembro: { include: { Unidad: true } }, Usuario: { include: { UsuarioRoles: { include: { Rol: true } } } }, Formaciones: true }
        });
        
        return adultos.map(a => {
            const { Miembro, Usuario, ...rest } = a;
            return {
                ...rest,
                ...Miembro,
                email: Usuario?.email,
                activo: Miembro.estado === 'ACTIVO',
                roles: Usuario?.UsuarioRoles?.map(ur => ur.Rol.nombre) || [],
                Unidad: Miembro.Unidad,
                Usuario,
                id: a.id,
            };
        });
    }

    async findOne(id: string) {
        const a = await this.prisma.adulto.findUnique({
            where: { id },
            include: { Miembro: { include: { Unidad: true } }, Usuario: { include: { UsuarioRoles: { include: { Rol: true } } } }, Formaciones: true }
        });
        if (!a) throw new NotFoundException('Adulto no encontrado');

        const { Miembro, Usuario, ...rest } = a;
        return {
            ...rest,
            ...Miembro,
            email: Usuario?.email,
            activo: Miembro.estado === 'ACTIVO',
            roles: Usuario?.UsuarioRoles?.map(ur => ur.Rol.nombre) || [],
            Unidad: Miembro.Unidad,
            Usuario,
            id: a.id,
        };
    }

    /** Resuelve el perfil de adulto vinculado a un usuario logueado. */
    async findByUsuarioId(usuarioId: string) {
        const adulto = await this.prisma.adulto.findUnique({
            where: { usuarioId },
            include: { Miembro: { include: { Unidad: true, FichaMedica: true } } },
        });
        if (!adulto) {
            throw new NotFoundException('No se encontró un perfil de staff vinculado a esta cuenta');
        }
        return adulto;
    }

    async create(dto: CreateAdultoDto, creatorId: string) {
        const existing = await this.prisma.miembro.findUnique({ where: { cedula: dto.cedula } });
        if (existing) throw new ConflictException('Cédula ya registrada');

        let usuarioId: string | null = null;

        // Crear usuario si envía datos
        if (dto.email && dto.password) {
            const user = await this.usersService.create(
                {
                    nombre: dto.nombres,
                    apellido: dto.apellidos,
                    email: dto.email,
                    password: dto.password,
                    unidadId: dto.unidadId
                },
                creatorId
            );
            usuarioId = user.id;

            if (dto.rolId) {
                // Assign role (bypass rbac service to keep it simple, or inject it)
                await this.prisma.usuarioRol.create({
                    data: { usuarioId: user.id, rolId: dto.rolId, asignadoPor: creatorId }
                });
            }
        }

        const adultoData: any = {
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

    async update(id: string, dto: UpdateAdultoDto, actorId: string) {
        const adulto = await this.prisma.adulto.findUnique({ where: { id }, include: { Miembro: true } });
        if (!adulto) throw new NotFoundException('Adulto no encontrado');

        const adultoData: any = {};
        if (dto.ocupacion !== undefined) adultoData.ocupacion = dto.ocupacion;
        if (dto.telefono !== undefined) adultoData.telefono = dto.telefono;
        if (dto.direccion !== undefined) adultoData.direccion = dto.direccion;

        const miembroData: any = { updatedBy: actorId };
        if (dto.nombres !== undefined) miembroData.nombres = dto.nombres;
        if (dto.apellidos !== undefined) miembroData.apellidos = dto.apellidos;
        if (dto.cedula !== undefined) miembroData.cedula = dto.cedula;
        if (dto.fechaNacimiento !== undefined) miembroData.fechaNacimiento = new Date(dto.fechaNacimiento);
        if (dto.genero !== undefined) miembroData.genero = dto.genero;
        if (dto.unidadId !== undefined) miembroData.unidadId = dto.unidadId;

        await this.prisma.adulto.update({
            where: { id },
            data: {
                ...adultoData,
                Miembro: { update: miembroData }
            }
        });

        return this.findOne(id);
    }

    async createAccount(id: string, dto: CreateAccountDto, creatorId: string) {
        const adulto = await this.prisma.adulto.findUnique({ where: { id }, include: { Miembro: true } });
        if (!adulto) throw new NotFoundException('Adulto no encontrado');
        if (adulto.usuarioId) throw new ConflictException('Adulto ya tiene una cuenta de usuario vinculada');

        const user = await this.usersService.create(
            {
                nombre: adulto.Miembro.nombres,
                apellido: adulto.Miembro.apellidos,
                email: dto.email,
                password: dto.password,
                unidadId: adulto.Miembro.unidadId
            },
            creatorId
        );

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

    async remove(id: string, actorId: string) {
        const adulto = await this.prisma.adulto.findUnique({ where: { id }, include: { Miembro: true } });
        if (!adulto) throw new NotFoundException('Adulto no encontrado');

        await this.prisma.miembro.update({
            where: { id: adulto.miembroId },
            data: { deletedAt: new Date(), updatedBy: actorId }
        });

        if (adulto.usuarioId) {
            await this.usersService.remove(adulto.usuarioId, actorId);
        }

        return { message: 'Adulto eliminado lógicamente' };
    }
}
