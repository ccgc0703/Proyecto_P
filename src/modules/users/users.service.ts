import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService extends BaseService<any> {
    constructor(
        prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {
        super(prisma, 'usuario');
    }

    async findAll(where: any = {}) {
        const users = await super.findAll(where);
        return users.map((user) => this.excludePassword(user));
    }

    async findOne(id: string) {
        const user = await super.findOne(id);
        return this.excludePassword(user);
    }

    async create(createUserDto: CreateUserDto, creatorId?: string, ip?: string, userAgent?: string) {
        const existing = await this.prisma.usuario.findUnique({
            where: { email: createUserDto.email },
        });

        if (existing) {
            throw new ConflictException('El email ya está registrado');
        }

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
                where: { email: dto.email },
            });
            if (emailTaken) {
                throw new ConflictException('El email ya está registrado');
            }
        }

        // Solo campos permitidos
        const updateData: any = {};
        if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
        if (dto.email !== undefined) updateData.email = dto.email;
        if (dto.unidadId !== undefined) updateData.unidadId = dto.unidadId;
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

    private excludePassword(user: any) {
        if (!user) return null;
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}


