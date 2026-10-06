import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';
import {
    OpcionesLista,
    hayPaginacion,
    rangoLista,
    filtroBusqueda,
} from '../../common/paginacion';

const CAMPOS_BUSQUEDA_USUARIO = ['nombre', 'apellido', 'email'];

@Injectable()
export class UsersService extends BaseService<any> {
    constructor(
        prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {
        super(prisma, 'usuario');
    }

    /**
     * Lista usuarios con sus relaciones (roles, unidad).
     * Paginación y búsqueda: opt-in vía `opts` (sin page/limit = lista completa).
     */
    async findAll(where: any = {}, opts?: OpcionesLista) {
        const filtro = { ...where, deletedAt: null, ...(filtroBusqueda(opts?.q, CAMPOS_BUSQUEDA_USUARIO) ?? {}) };

        const base = {
            where: filtro,
            include: {
                Unidad: true,
                UsuarioRoles: {
                    where: { deletedAt: null },
                    include: { Rol: true },
                },
                Adulto: {
                    include: { Miembro: true },
                },
            },
        };

        const [users, total] = hayPaginacion(opts ?? {})
            ? await Promise.all([
                this.prisma.usuario.findMany({
                    ...base,
                    orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
                    ...rangoLista(opts!),
                }),
                this.prisma.usuario.count({ where: filtro }),
            ])
            : [await this.prisma.usuario.findMany(base), null];

        return {
            data: users.map((user) => {
                const { password, ...rest } = user;
                return {
                    ...rest,
                    roles: user.UsuarioRoles.map((ur) => ur.Rol.nombre),
                };
            }),
            total: total ?? users.length,
        };
    }

    /**
     * Obtiene un usuario por ID con relaciones completas.
     */
    async findOne(id: string) {
        const user = await this.prisma.usuario.findFirst({
            where: { id, deletedAt: null },
            include: {
                Unidad: true,
                UsuarioRoles: {
                    where: { deletedAt: null },
                    include: { Rol: true },
                },
                Adulto: {
                    include: { Miembro: true },
                },
            },
        });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
        }
        return this.excludePassword(user);
    }

    async create(createUserDto: CreateUserDto, creatorId?: string, ip?: string, userAgent?: string) {
        const existing = await this.prisma.usuario.findUnique({
            where: { email: createUserDto.email, deletedAt: undefined },
        });

        if (existing) {
            throw new ConflictException('El email ya está registrado');
        }

        await this.assertNodoExiste(createUserDto.nodoId);

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = await super.create(
            {
                ...createUserDto,
                password: hashedPassword,
            },
            creatorId,
        );

        await this.auditService.logAction({
            actorId: creatorId,
            action: 'USER_CREATED',
            module: 'users',
            targetId: user.id,
            description: 'Usuario creado',
            ipAddress: ip,
            userAgent,
        });

        return this.excludePassword(user);
    }

    async updateUser(id: string, dto: UpdateUserDto, actorId: string, ip?: string, userAgent?: string) {
        const existing = await this.prisma.usuario.findFirst({
            where: { id, deletedAt: null },
        });

        if (!existing) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Si cambia email, verificar que no esté en uso
        if (dto.email && dto.email !== existing.email) {
            const emailTaken = await this.prisma.usuario.findUnique({
                where: { email: dto.email, deletedAt: undefined },
            });
            if (emailTaken) {
                throw new ConflictException('El email ya está registrado');
            }
        }

        // Solo campos permitidos
        const updateData: any = {};
        if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
        if (dto.apellido !== undefined) updateData.apellido = dto.apellido;
        if (dto.email !== undefined) updateData.email = dto.email;
        if (dto.unidadId !== undefined) updateData.unidadId = dto.unidadId;
        if (dto.nodoId !== undefined) {
            await this.assertNodoExiste(dto.nodoId);
            updateData.nodoId = dto.nodoId;
        }
        updateData.updatedBy = actorId;

        const user = await this.prisma.usuario.update({
            where: { id },
            data: updateData,
        });

        await this.auditService.logAction({
            actorId,
            action: 'USER_UPDATED',
            module: 'users',
            targetId: user.id,
            description: 'Usuario actualizado',
            ipAddress: ip,
            userAgent,
        });

        return this.excludePassword(user);
    }

    /**
     * Cambiar contraseña de un usuario.
     */
    async changePassword(id: string, currentPassword: string, newPassword: string, actorId: string, ip?: string) {
        const user = await this.prisma.usuario.findFirst({
            where: { id, deletedAt: null },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new BadRequestException('La contraseña actual es incorrecta');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.usuario.update({
            where: { id },
            data: {
                password: hashedPassword,
                tokenVersion: { increment: 1 }, // Invalida JWT previo
                updatedBy: actorId,
            },
        });

        await this.auditService.logAction({
            actorId,
            action: 'PASSWORD_CHANGED',
            module: 'users',
            targetId: id,
            description: 'Contraseña actualizada',
            ipAddress: ip,
        });

        return { message: 'Contraseña actualizada exitosamente' };
    }

    async remove(id: string, userId?: string, ip?: string, userAgent?: string) {
        const result = await super.remove(id, userId);

        await this.auditService.logAction({
            actorId: userId,
            action: 'USER_DELETED',
            module: 'users',
            targetId: id,
            description: 'Usuario eliminado (soft delete)',
            ipAddress: ip,
            userAgent,
        });

        return result;
    }

    /** F4.3: valida que el nodo del ámbito exista y esté activo (null = sin ámbito). */
    private async assertNodoExiste(nodoId?: string | null): Promise<void> {
        if (nodoId === undefined || nodoId === null) return;

        const nodo = await this.prisma.organizacionNodo.findFirst({
            where: { id: nodoId, deletedAt: null },
            select: { id: true },
        });
        if (!nodo) {
            throw new BadRequestException('Nodo no encontrado');
        }
    }

    private excludePassword(user: any) {
        if (!user) return null;
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
