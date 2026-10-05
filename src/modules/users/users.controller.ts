import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Req, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS, RBAC_ROLES } from '../../common/constantes';
import { resolverOpcionesLista, hayPaginacion, metaPagina } from '../../common/paginacion';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // ── Self-scope: cualquier usuario gestiona su propia cuenta ────────────
    // (sin RequirePermission: el id siempre es el del usuario autenticado)

    @Patch('me')
    async updateMe(@Body() dto: UpdateMeDto, @Req() req: any) {
        const user = await this.usersService.updateUser(
            req.user.id,
            dto,
            req.user.id,
            req.ip,
            req.headers?.['user-agent'],
        );
        return {
            success: true,
            message: 'Tu cuenta fue actualizada exitosamente',
            data: user,
        };
    }

    @Patch('me/password')
    async changeMyPassword(
        @Body() body: { currentPassword: string; newPassword: string },
        @Req() req: any,
    ) {
        const result = await this.usersService.changePassword(
            req.user.id,
            body.currentPassword,
            body.newPassword,
            req.user.id,
            req.ip,
        );
        return {
            success: true,
            message: result.message,
            data: null,
        };
    }

    @Post()
    @RequirePermission(PERMISSIONS.USER_CREATE)
    async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
        const user = await this.usersService.create(
            createUserDto,
            req.user.id,
            req.ip,
            req.headers?.['user-agent'],
        );
        return {
            success: true,
            message: 'Usuario creado exitosamente',
            data: user,
        };
    }

    @Get()
    @RequirePermission(PERMISSIONS.USER_VIEW)
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('q') q?: string,
    ) {
        const opts = resolverOpcionesLista({ page, limit, q });
        const { data, total } = await this.usersService.findAll({}, opts);
        return {
            success: true,
            message: 'Usuarios recuperados exitosamente',
            data,
            ...(hayPaginacion(opts) ? { meta: metaPagina(total, opts) } : {}),
        };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.USER_VIEW)
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        return {
            success: true,
            message: 'Usuario recuperado exitosamente',
            data: user,
        };
    }

    @Patch(':id')
    @RequirePermission(PERMISSIONS.USER_UPDATE)
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
        const user = await this.usersService.updateUser(
            id,
            updateUserDto,
            req.user.id,
            req.ip,
            req.headers?.['user-agent'],
        );
        return {
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: user,
        };
    }

    @Delete(':id')
    @RequirePermission(PERMISSIONS.USER_DELETE)
    async remove(@Param('id') id: string, @Req() req: any) {
        await this.usersService.remove(
            id,
            req.user.id,
            req.ip,
            req.headers?.['user-agent'],
        );
        return {
            success: true,
            message: 'Usuario eliminado (soft delete) exitosamente',
            data: null,
        };
    }

    @Patch(':id/password')
    async changePassword(
        @Param('id') id: string,
        @Body() body: { currentPassword: string; newPassword: string },
        @Req() req: any,
    ) {
        // Ownership: solo la propia cuenta (o SYSTEM_ADMIN) puede cambiar la contraseña
        if (id !== req.user.id && !(req.user.roles ?? []).includes(RBAC_ROLES.SYSTEM_ADMIN)) {
            throw new ForbiddenException('Solo puedes cambiar la contraseña de tu propia cuenta');
        }
        const result = await this.usersService.changePassword(
            id,
            body.currentPassword,
            body.newPassword,
            req.user.id,
            req.ip,
        );
        return {
            success: true,
            message: result.message,
            data: null,
        };
    }
}
