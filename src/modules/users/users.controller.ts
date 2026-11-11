import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Req, Query, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission, SelfScope } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS, RBAC_ROLES } from '../../common/constantes';
import { NodoPolicy } from '../../common/policies/nodo.policy';
import { resolverOpcionesLista, hayPaginacion, metaPagina } from '../../common/paginacion';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly nodoPolicy: NodoPolicy,
    ) { }

    // ── Multi-grupo (Fase 7c): ámbito jerárquico del actor ────────────────

    /** `true` si el actor está restringido a un subárbol (nodoId, sin ser admin). */
    private esAmbito(user: any): boolean {
        return !!user?.nodoId && !(user?.roles ?? []).includes(RBAC_ROLES.SYSTEM_ADMIN);
    }

    /** Filtro de listado para el ámbito del actor (null = visión global). */
    private async filtroAlcance(user: any): Promise<Record<string, any> | null> {
        if (!this.esAmbito(user)) return null;
        return this.nodoPolicy.filtroUsuarios(user.nodoId);
    }

    /** Lanza 403 si la cuenta objetivo cae fuera del ámbito del actor. */
    private async assertUsuarioEnAlcance(user: any, usuarioId: string): Promise<void> {
        if (!this.esAmbito(user)) return;
        const enAlcance = await this.nodoPolicy.usuarioEnAlcance(user.nodoId, usuarioId);
        if (!enAlcance) {
            throw new ForbiddenException(
                'Aislamiento por nodo: el usuario está fuera de tu ámbito jerárquico',
            );
        }
    }

    /**
     * Valida que una cuenta (nueva o editada) quede anclada dentro del ámbito
     * del actor: nodoId dentro del subárbol o unidadId dentro del alcance.
     * `requiereAncla` = creación (debe anclar sí o sí). Un actor con ámbito no
     * puede vaciar nodoId (eso ampliaría su visión a global).
     */
    private async assertCuentaEnAmbito(
        user: any,
        dto: { unidadId?: string | null; nodoId?: string | null },
        requiereAncla: boolean,
    ): Promise<void> {
        if (!this.esAmbito(user)) return;
        const scope: string = user.nodoId;

        if ('nodoId' in dto && dto.nodoId === null) {
            throw new ForbiddenException(
                'No podés quitar el ámbito jerárquico de una cuenta desde tu ámbito',
            );
        }

        if (dto.nodoId) {
            const subtree = await this.nodoPolicy.subtreeIds(scope);
            if (!subtree.has(dto.nodoId)) {
                throw new ForbiddenException(
                    'Aislamiento por nodo: el nodo está fuera de tu ámbito jerárquico',
                );
            }
            return;
        }

        if (dto.unidadId) {
            const unidades = await this.nodoPolicy.unidadesEnAlcance(scope);
            if (!unidades.includes(dto.unidadId)) {
                throw new ForbiddenException(
                    'Aislamiento por nodo: la unidad está fuera de tu ámbito jerárquico',
                );
            }
            return;
        }

        if (requiereAncla) {
            throw new BadRequestException(
                'Asigná una unidad o un nodo de tu ámbito jerárquico a la cuenta nueva',
            );
        }
    }

    // ── Self-scope: cualquier usuario gestiona su propia cuenta ────────────
    // (@SelfScope: el id siempre es el del usuario autenticado)

    @SelfScope()
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

    @SelfScope()
    @Patch('me/password')
    async changeMyPassword(
        @Body() body: ChangePasswordDto,
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
        // Multi-grupo (7c): la cuenta nueva debe caer en el ámbito del actor.
        await this.assertCuentaEnAmbito(req.user, createUserDto, true);
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
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('q') q?: string,
    ) {
        const opts = resolverOpcionesLista({ page, limit, q });
        // Multi-grupo (7c): el listado se acota al subárbol del actor.
        const alcance = await this.filtroAlcance(req.user);
        const { data, total } = await this.usersService.findAll(alcance ?? {}, opts);
        return {
            success: true,
            message: 'Usuarios recuperados exitosamente',
            data,
            ...(hayPaginacion(opts) ? { meta: metaPagina(total, opts) } : {}),
        };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.USER_VIEW)
    async findOne(@Param('id') id: string, @Req() req: any) {
        await this.assertUsuarioEnAlcance(req.user, id);
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
        await this.assertUsuarioEnAlcance(req.user, id);
        // Reubicación (unidad/nodo) también debe caer en el ámbito del actor.
        await this.assertCuentaEnAmbito(req.user, updateUserDto, false);
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
        await this.assertUsuarioEnAlcance(req.user, id);
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

    // Sin permiso RBAC: el handler valida la propiedad de la cuenta
    // (propia o SYSTEM_ADMIN) antes de actuar.
    @SelfScope()
    @Patch(':id/password')
    async changePassword(
        @Param('id') id: string,
        @Body() body: ChangePasswordDto,
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
