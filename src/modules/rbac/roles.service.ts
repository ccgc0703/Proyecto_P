import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

/** Nombre reservado que no puede crearse por duplicado */
const RESERVED_ADMIN_ROLE = 'SYSTEM_ADMIN';

@Injectable()
export class RolesService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Crea un nuevo rol.
     * - Valida que el nombre no exista (incluye soft-deleted)
     * - Valida que no se duplique el nombre SYSTEM_ADMIN (caso insensible)
     */
    async createRole(dto: CreateRoleDto) {
        const normalizedNombre = dto.nombre.trim().toUpperCase();

        // Verificar duplicado (activo o soft-deleted para evitar re-creación silenciosa)
        const existing = await this.prisma.rol.findFirst({
            where: { nombre: { equals: normalizedNombre, mode: 'insensitive' } },
        });

        if (existing) {
            if (!existing.deletedAt) {
                throw new ConflictException(`Ya existe un rol con el nombre "${normalizedNombre}"`);
            }
            // Si estaba soft-deleted, restaurarlo en lugar de duplicar
            const restored = await this.prisma.rol.update({
                where: { id: existing.id },
                data: {
                    deletedAt: null,
                    activo: true,
                    descripcion: dto.descripcion,
                },
            });
            return restored;
        }

        return this.prisma.rol.create({
            data: {
                nombre: normalizedNombre,
                descripcion: dto.descripcion,
            },
        });
    }

    /**
     * Lista todos los roles activos con sus permisos asignados.
     * Incluye conteo de usuarios que tienen el rol.
     */
    async findAll() {
        const roles = await this.prisma.rol.findMany({
            where: { deletedAt: null },
            orderBy: { nombre: 'asc' },
            include: {
                RolPermisos: {
                    where: { deletedAt: null },
                    include: {
                        Permiso: {
                            select: { id: true, accion: true, modulo: true, descripcion: true },
                        },
                    },
                },
                _count: {
                    select: {
                        UsuarioRoles: {
                            where: { deletedAt: null },
                        },
                    },
                },
            },
        });

        // Formato limpio: rol con array plano de permisos
        return roles.map((rol) => ({
            id: rol.id,
            nombre: rol.nombre,
            descripcion: rol.descripcion,
            activo: rol.activo,
            createdAt: rol.createdAt,
            totalUsuarios: rol._count.UsuarioRoles,
            permisos: rol.RolPermisos.map((rp) => rp.Permiso),
        }));
    }

    /**
     * Asigna (reemplaza) los permisos de un rol de forma transaccional.
     *
     * Lógica:
     *   1. Verificar que el rol existe
     *   2. Verificar que todos los permisos existan en DB
     *   3. En TX: soft-delete de los RolPermiso actuales + crear los nuevos
     *
     * Resultado: el rol tiene exactamente los permisos indicados (ni más ni menos).
     * Sin inserts parciales ni estado inconsistente.
     */
    async assignPermissions(roleId: string, permisoIds: string[]) {
        // 1. Verificar que el rol existe y está activo
        const rol = await this.prisma.rol.findFirst({
            where: { id: roleId, deletedAt: null, activo: true },
        });
        if (!rol) {
            throw new NotFoundException(`Rol con id "${roleId}" no encontrado o inactivo`);
        }

        // 2. Deduplicar IDs
        const uniqueIds = [...new Set(permisoIds)];

        // 3. Verificar que todos los permisos existan en DB
        const permisosEnDB = await this.prisma.permiso.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true, accion: true, modulo: true, descripcion: true },
        });

        if (permisosEnDB.length !== uniqueIds.length) {
            const encontrados = new Set(permisosEnDB.map((p) => p.id));
            const noEncontrados = uniqueIds.filter((id) => !encontrados.has(id));
            throw new BadRequestException(
                `Los siguientes IDs de permisos no existen: ${noEncontrados.join(', ')}`,
            );
        }

        // 4. TX: soft-delete de RolPermiso activos + restore-or-create de los nuevos
        //
        // NO se usa createMany porque @@unique([rolId, permisoId]) incluye registros
        // soft-deleted: si ya existe un registro con deletedAt != null, el insert lanza
        // P2002 y skipDuplicates lo OMITE silenciosamente (el permiso no queda asignado).
        // Solución: buscar si existe un registro previo (activo o soft-deleted) y restaurarlo,
        // o crear uno nuevo si nunca existió.
        await this.prisma.$transaction(async (tx) => {
            // 4a. Soft-delete de los permisos activos actuales del rol
            await tx.rolPermiso.updateMany({
                where: { rolId: roleId, deletedAt: null },
                data: { deletedAt: new Date() },
            });

            // 4b. Para cada permiso nuevo: restaurar si existe (soft-deleted), o crear
            for (const permisoId of uniqueIds) {
                const existing = await tx.rolPermiso.findFirst({
                    where: { rolId: roleId, permisoId },
                });

                if (existing) {
                    // Restaurar el registro soft-deleted (deletedAt → null)
                    await tx.rolPermiso.update({
                        where: { id: existing.id },
                        data: { deletedAt: null },
                    });
                } else {
                    // Crear registro nuevo (primera vez que se asigna este permiso al rol)
                    await tx.rolPermiso.create({
                        data: { rolId: roleId, permisoId },
                    });
                }
            }
        });

        // Retornar los permisos asignados
        return {
            rolId: rol.id,
            rolNombre: rol.nombre,
            permisosAsignados: permisosEnDB,
        };
    }

    /**
     * Obtiene un rol por ID con sus permisos.
     * Usado internamente para validaciones.
     */
    async findOne(roleId: string) {
        const rol = await this.prisma.rol.findFirst({
            where: { id: roleId, deletedAt: null },
            include: {
                RolPermisos: {
                    where: { deletedAt: null },
                    include: { Permiso: true },
                },
            },
        });
        if (!rol) throw new NotFoundException(`Rol con id "${roleId}" no encontrado`);
        return rol;
    }
}
