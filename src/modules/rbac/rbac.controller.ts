import {
    Controller, Get, Post, Delete,
    Param, Body, Req, UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { AssignRoleDto, AssignRoleByNameDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

/**
 * Controlador RBAC — Gestión de Roles y Permisos.
 * Todos los endpoints requieren permiso `rbac:manage` (solo SYSTEM_ADMIN)
 * salvo los que tengan un override a nivel de método.
 * El actorId se extrae del JWT, nunca del body (previene autoasignación).
 */
@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission(PERMISSIONS.RBAC_MANAGE)
export class RbacController {
    constructor(private readonly rbacService: RbacService) { }

    @Get('roles')
    @RequirePermission(PERMISSIONS.RBAC_VIEW)
    async listRoles() {
        const data = await this.rbacService.listRoles();
        return { success: true, message: 'Roles del sistema', data };
    }

    @Get('permisos')
    @RequirePermission(PERMISSIONS.RBAC_VIEW)
    async listPermisos() {
        const data = await this.rbacService.listPermisos();
        return { success: true, message: 'Permisos del sistema', data };
    }

    @Get('usuarios/:id/permisos')
    async getUserPermissions(@Param('id') id: string) {
        const data = await this.rbacService.getUserPermissions(id);
        return { success: true, message: `Permisos del usuario ${id}`, data };
    }

    @Post('usuarios/:id/roles')
    async assignRole(
        @Param('id', ParseUUIDPipe) usuarioId: string,
        @Body() dto: AssignRoleDto,
        @Req() req: any,
    ) {
        const result = await this.rbacService.assignRole(
            usuarioId,
            dto.rolId,
            req.user.id,  // actorId desde JWT — nunca del body
            req.ip,
        );
        return { success: true, message: result.message, data: result.asignacion };
    }

    @Delete('usuarios/:id/roles/:rolId')
    async revokeRole(
        @Param('id', ParseUUIDPipe) usuarioId: string,
        @Param('rolId', ParseUUIDPipe) rolId: string,
        @Req() req: any,
    ) {
        const result = await this.rbacService.revokeRole(
            usuarioId,
            rolId,
            req.user.id,  // actorId desde JWT — nunca del body
            req.ip,
        );
        return { success: true, message: result.message, data: null };
    }

    /**
     * POST /rbac/assign-role
     * Asigna un rol a un usuario por nombre de rol.
     * Requiere solo `rbac:assign-role` (disponible para GROUP_LEADER y SYSTEM_ADMIN).
     * Override a nivel de método: NO requiere `rbac:manage`.
     */
    @Post('assign-role')
    @RequirePermission(PERMISSIONS.RBAC_ASSIGN_ROLE)
    async assignRoleByName(
        @Body() dto: AssignRoleByNameDto,
        @Req() req: any,
    ) {
        const result = await this.rbacService.assignRoleByName(
            dto,
            req.user.id,  // actorId desde JWT
            req.ip,
        );
        return { success: true, message: result.message, data: result.asignacion };
    }
}
