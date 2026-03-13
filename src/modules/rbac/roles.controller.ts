import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

/**
 * Controlador de Gestión de Roles RBAC.
 *
 * Base path: /roles
 * Todos los endpoints requieren el permiso `rbac:manage` (solo SYSTEM_ADMIN).
 *
 * Endpoints:
 *   POST   /roles              → Crear nuevo rol
 *   GET    /roles              → Listar roles con sus permisos
 *   POST   /roles/:id/permisos → Asignar/Reemplazar permisos de un rol
 */
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission(PERMISSIONS.RBAC_MANAGE)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    /**
     * POST /api/v1/roles
     * Crea un nuevo rol en el catálogo RBAC.
     * - 409 si el nombre ya existe (activo)
     * - Restaura automáticamente si estaba soft-deleted
     */
    @Post()
    async createRole(@Body() createRoleDto: CreateRoleDto) {
        const rol = await this.rolesService.createRole(createRoleDto);
        return {
            success: true,
            message: `Rol "${rol.nombre}" creado exitosamente`,
            data: rol,
        };
    }

    /**
     * GET /api/v1/roles
     * Lista todos los roles activos con sus permisos y conteo de usuarios.
     */
    @Get()
    async findAll() {
        const roles = await this.rolesService.findAll();
        return {
            success: true,
            message: 'Roles del sistema',
            data: roles,
        };
    }

    /**
     * POST /api/v1/roles/:id/permisos
     * Asigna (reemplaza) el conjunto completo de permisos de un rol.
     * - 404 si el rol no existe
     * - 400 si algún ID de permiso es inválido
     * Operación transaccional: nunca queda en estado parcial.
     */
    @Post(':id/permisos')
    async assignPermissions(
        @Param('id', ParseUUIDPipe) roleId: string,
        @Body() dto: AssignPermissionsDto,
    ) {
        const result = await this.rolesService.assignPermissions(roleId, dto.permisos);
        return {
            success: true,
            message: `Permisos actualizados para el rol "${result.rolNombre}"`,
            data: result,
        };
    }
}
