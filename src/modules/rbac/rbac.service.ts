import {
    Injectable,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AssignRoleByNameDto } from './dto/assign-role.dto';
import { AuditService } from '../audit/audit.service';

/** Nombre del rol que no puede quedar sin al menos un titular activo */
const SYSTEM_ADMIN_ROLE = 'SYSTEM_ADMIN';

/** Jerarquía de roles — nivel más alto = más privilegios */
const ROLE_HIERARCHY: Record<string, number> = {
    SYSTEM_ADMIN: 100,
    GROUP_LEADER: 80,
    GROUP_SUBLEADER: 70,
    ADULTO_MANADA: 60,
    ADULTO_TROPA: 60,
    ADULTO_CLAN: 60,
    SECRETARIO: 50,
    ADULTO_COLABORADOR: 40,
    CONSULTOR: 10,
};

@Injectable()
export class RbacService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly auditService: AuditService,
    ) { }

    /** Lista todos los roles activos */
    async listRoles() {
        return this.prisma.rol.findMany({
            where: { deletedAt: null },
            orderBy: { nombre: 'asc' },
        });
    }

    /** Lista todos los permisos */
    async listPermisos() {
        return this.prisma.permiso.findMany({
            orderBy: [{ modulo: 'asc' }, { accion: 'asc' }],
        });
    }

    /** Obtiene los permisos actuales de un usuario */
    async getUserPermissions(usuarioId: string) {
        return this.authService.loadUserPermissions(usuarioId);
    }

    /**
     * Asigna un rol a un usuario.
     * - actorId viene del JWT (nunca del body → previene autoasignación)
     * - Incrementa tokenVersion del usuario → invalida JWT previo
     * - Registra en AuditRBAC
     * - Captura P2002 (unique constraint) → 409 ConflictException
     */
    async assignRole(usuarioId: string, rolId: string, actorId: string, ip?: string) {
        // Verificar que el usuario existe
        const usuario = await this.prisma.usuario.findFirst({
            where: { id: usuarioId, deletedAt: null },
        });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        // Verificar que el rol existe y está activo
        const rol = await this.prisma.rol.findFirst({
            where: { id: rolId, deletedAt: null, activo: true },
        });
        if (!rol) throw new NotFoundException('Rol no encontrado o inactivo');

        // Verificar si ya tiene este rol activo (soft-delete aware)
        const existing = await this.prisma.usuarioRol.findFirst({
            where: { usuarioId, rolId, deletedAt: null },
        });
        if (existing) {
            throw new ConflictException(`El usuario ya tiene el rol ${rol.nombre}`);
        }

        try {
            // ── Transacción: crear asignación + incrementar tokenVersion ────
            const [asignacion] = await this.prisma.$transaction([
                this.prisma.usuarioRol.create({
                    data: { usuarioId, rolId, asignadoPor: actorId },
                }),
                // tokenVersion++ → invalida JWT viejo del usuario
                this.prisma.usuario.update({
                    where: { id: usuarioId },
                    data: { tokenVersion: { increment: 1 } },
                }),
            ]);

            // Auditoría — fuera de la transacción (no crítica para atomicidad)
            await this.prisma.auditRBAC.create({
                data: {
                    accion: 'ROLE_ASSIGNED',
                    entidad: 'UsuarioRol',
                    entidadId: asignacion.id,
                    realizadoPorId: actorId,
                    datosCambio: { usuarioId, rolId, rolNombre: rol.nombre },
                    ip,
                },
            });

            return { message: `Rol ${rol.nombre} asignado exitosamente`, asignacion };

        } catch (err: any) {
            // P2002: unique constraint → ya existe el registro (race condition)
            if (err?.code === 'P2002') {
                throw new ConflictException(`El usuario ya tiene el rol ${rol.nombre}`);
            }
            throw err;
        }
    }

    /**
     * Asigna un rol a un usuario por nombre de rol.
     * Disponible para usuarios con permiso `rbac:assign-role` (GROUP_LEADER, SYSTEM_ADMIN).
     */
    async assignRoleByName(dto: AssignRoleByNameDto, actorId: string, ip?: string) {
        const rol = await this.prisma.rol.findUnique({
            where: { nombre: dto.rolNombre },
        });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        // Verificar que el usuario existe
        const usuario = await this.prisma.usuario.findFirst({
            where: { id: dto.usuarioId, deletedAt: null },
        });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        // ── Validación de jerarquía: prevenir escalación de privilegios ────
        const targetLevel = ROLE_HIERARCHY[rol.nombre] ?? 0;

        // Obtener el nivel más alto del actor
        const actorRoles = await this.prisma.usuarioRol.findMany({
            where: { usuarioId: actorId, deletedAt: null },
            include: { Rol: true },
        });
        const actorMaxLevel = actorRoles.reduce(
            (max, ur) => Math.max(max, ROLE_HIERARCHY[ur.Rol.nombre] ?? 0),
            0,
        );

        if (targetLevel >= actorMaxLevel) {
            throw new ForbiddenException(
                'No puedes asignar un rol igual o superior al tuyo',
            );
        }

        // Verificar si ya tiene este rol activo
        const existing = await this.prisma.usuarioRol.findFirst({
            where: {
                usuarioId: dto.usuarioId,
                rolId: rol.id,
                deletedAt: null,
            },
        });

        if (existing) {
            return { message: 'El usuario ya tiene ese rol asignado', asignacion: existing };
        }

        try {
            const [asignacion] = await this.prisma.$transaction([
                this.prisma.usuarioRol.create({
                    data: {
                        usuarioId: dto.usuarioId,
                        rolId: rol.id,
                        asignadoPor: actorId,
                    },
                }),
                this.prisma.usuario.update({
                    where: { id: dto.usuarioId },
                    data: { tokenVersion: { increment: 1 } },
                }),
            ]);

            await this.prisma.auditRBAC.create({
                data: {
                    accion: 'ROLE_ASSIGNED',
                    entidad: 'UsuarioRol',
                    entidadId: asignacion.id,
                    realizadoPorId: actorId,
                    datosCambio: {
                        usuarioId: dto.usuarioId,
                        rolId: rol.id,
                        rolNombre: rol.nombre,
                    },
                    ip,
                },
            });

            // Registro en auditoría global
            await this.auditService.logAction({
                actorId,
                action: 'ROLE_ASSIGNED',
                module: 'rbac',
                targetId: dto.usuarioId,
                description: `Rol ${rol.nombre} asignado a usuario`,
                ipAddress: ip,
            });

            return { message: `Rol ${rol.nombre} asignado exitosamente`, asignacion };

        } catch (err: any) {
            if (err?.code === 'P2002') {
                throw new ConflictException(`El usuario ya tiene el rol ${rol.nombre}`);
            }
            throw err;
        }
    }

    /**
     * Revoca un rol de un usuario (soft delete en UsuarioRol).
     * - Protege al último SYSTEM_ADMIN: bloquea si quedaría sin admins
     * - Incrementa tokenVersion → invalida JWT previo del usuario
     * - Registra en AuditRBAC
     */
    async revokeRole(usuarioId: string, rolId: string, actorId: string, ip?: string) {
        const asignacion = await this.prisma.usuarioRol.findFirst({
            where: { usuarioId, rolId, deletedAt: null },
            include: { Rol: true },
        });

        if (!asignacion) {
            throw new NotFoundException('El usuario no tiene este rol activo');
        }

        // ── Protección del último SYSTEM_ADMIN ───────────────────────────────
        if (asignacion.Rol.nombre === SYSTEM_ADMIN_ROLE) {
            const adminCount = await this.prisma.usuarioRol.count({
                where: {
                    rolId,
                    deletedAt: null,
                    Usuario: { activo: true, deletedAt: null },
                },
            });
            if (adminCount <= 1) {
                throw new BadRequestException(
                    'No se puede revocar: es el último SYSTEM_ADMIN activo del sistema. ' +
                    'Asigna el rol a otro usuario antes de revocarlo aquí.',
                );
            }
        }

        // ── Transacción: soft-delete + tokenVersion++ ────────────────────────
        await this.prisma.$transaction([
            this.prisma.usuarioRol.update({
                where: { id: asignacion.id },
                data: { deletedAt: new Date() },
            }),
            // tokenVersion++ → invalida JWT viejo del usuario afectado
            this.prisma.usuario.update({
                where: { id: usuarioId },
                data: { tokenVersion: { increment: 1 } },
            }),
        ]);

        // Auditoría
        await this.prisma.auditRBAC.create({
            data: {
                accion: 'ROLE_REVOKED',
                entidad: 'UsuarioRol',
                entidadId: asignacion.id,
                realizadoPorId: actorId,
                datosCambio: { usuarioId, rolId, rolNombre: asignacion.Rol.nombre },
                ip,
            },
        });

        return { message: `Rol ${asignacion.Rol.nombre} revocado exitosamente` };
    }
}

