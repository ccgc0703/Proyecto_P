/**
 * Controlador para la gestión de jóvenes.
 *
 * Arquitectura de autorización en capas:
 *   JwtAuthGuard       → (401) verifica JWT y tokenVersion
 *   PermissionsGuard   → (403) verifica permisos RBAC desde JWT (sin DB)
 *   UnitPolicy         → (403) ABAC: aislamiento por unidad (inyectado, centralizado)
 *   Handler            → lógica de negocio
 */
import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Req, Query, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JovenesService } from './jovenes.service';
import { CreateJovenDto } from './dto/create-joven.dto';
import { UpdateJovenDto } from './dto/update-joven.dto';
import { UpdateMiPerfilJovenDto } from './dto/update-mi-perfil-joven.dto';
import { CreateAccountDto } from '../adultos/dto/create-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';
import { resolverOpcionesLista, hayPaginacion, metaPagina } from '../../common/paginacion';

@Controller('jovenes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class JovenesController {
    constructor(
        private readonly jovenesService: JovenesService,
        private readonly unitPolicy: UnitPolicy,     // ABAC centralizado
        private readonly selfScope: SelfScopePolicy, // Self-scope (rol JOVEN)
    ) { }
    
    @Get('stats')
    @RequirePermission(PERMISSIONS.JOVEN_VIEW)
    async getStats(@Req() req: any) {
        const alcance = await this.unitPolicy.unidadesAlcance(req.user);
        const stats = await this.jovenesService.getStats(alcance ?? undefined);
        return {
            success: true,
            data: stats,
        };
    }

    // ── Self-scope: el joven gestiona su propio perfil ──────────────────────

    @Get('mi-perfil')
    @RequirePermission(PERMISSIONS.SELF_VIEW)
    async findMiPerfil(@Req() req: any) {
        if (!req.user.miembroId) {
            throw new NotFoundException('No hay un perfil de joven vinculado a esta cuenta');
        }
        const joven = await this.jovenesService.findOne(req.user.miembroId);
        return {
            success: true,
            message: 'Tu perfil recuperado exitosamente',
            data: joven,
        };
    }

    @Patch('mi-perfil')
    @RequirePermission(PERMISSIONS.SELF_UPDATE)
    async updateMiPerfil(@Body() dto: UpdateMiPerfilJovenDto, @Req() req: any) {
        const miembroId: string | null = req.user.miembroId;
        if (!miembroId) {
            throw new NotFoundException('No hay un perfil de joven vinculado a esta cuenta');
        }
        this.selfScope.assertSelf(req.user, miembroId);

        const joven = await this.jovenesService.updateJoven(miembroId, dto, req.user.id);
        return {
            success: true,
            message: 'Tu perfil fue actualizado exitosamente',
            data: joven,
        };
    }

    // ── Alta de cuenta de acceso para un joven (la hace un adulto) ─────────

    @Post(':id/cuenta')
    @RequirePermission(PERMISSIONS.USER_CREATE)
    async createAccount(@Param('id') id: string, @Body() dto: CreateAccountDto, @Req() req: any) {
        const joven = await this.jovenesService.createAccount(id, dto, req.user.id);
        return {
            success: true,
            message: 'Cuenta de joven creada exitosamente',
            data: joven,
        };
    }

    @Post()
    @RequirePermission(PERMISSIONS.JOVEN_CREATE)
    async create(@Body() createJovenDto: CreateJovenDto, @Req() req: any) {
        // ABAC: el adulto solo puede crear jóvenes en su propia unidad
        await this.unitPolicy.assertCanManageUnit(req.user, createJovenDto.unidadId);

        const joven = await this.jovenesService.createJoven(
            createJovenDto,
            req.user.id,
            req.user.rol,
            req.user.unidadId,
        );
        return {
            success: true,
            message: 'Joven registrado exitosamente',
            data: joven,
        };
    }

    @Get()
    @RequirePermission(PERMISSIONS.JOVEN_VIEW)
    async findAll(
        @Req() req: any,
        @Query('unidadId') queryUnidadId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('q') q?: string,
    ) {
        const user = req.user;
        const opts = resolverOpcionesLista({ page, limit, q });

        // ABAC: Si el usuario es restringido (Adulto de Unidad), solo puede ver su unidad
        if (this.unitPolicy.isRestricted(user)) {
            if (!user.unidadId) {
                return {
                    success: true,
                    message: 'No tienes una unidad asignada',
                    data: []
                };
            }
            const { data, total } = await this.jovenesService.findAllByUnit(user.unidadId, opts);
            return {
                success: true,
                message: 'Miembros de tu unidad recuperados',
                data,
                ...(hayPaginacion(opts) ? { meta: metaPagina(total, opts) } : {}),
            };
        }

        // F4.3: ámbito jerárquico — null = visión global, string[] = solo esas unidades
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        if (alcance !== null) {
            if (queryUnidadId) {
                if (!alcance.includes(queryUnidadId)) {
                    throw new ForbiddenException(
                        'Aislamiento por nodo: la unidad está fuera de tu ámbito jerárquico',
                    );
                }
                const { data, total } = await this.jovenesService.findAllByUnit(queryUnidadId, opts);
                return {
                    success: true,
                    message: 'Miembros de tu ámbito recuperados',
                    data,
                    ...(hayPaginacion(opts) ? { meta: metaPagina(total, opts) } : {}),
                };
            }

            const { data, total } = await this.jovenesService.findAll(opts, alcance);
            return {
                success: true,
                message: 'Miembros de tu ámbito recuperados',
                data,
                ...(hayPaginacion(opts) ? { meta: metaPagina(total, opts) } : {}),
            };
        }

        // Si el usuario tiene visión global (Admin/Jefe) y pide una unidad específica
        if (queryUnidadId) {
            await this.unitPolicy.assertCanManageUnit(user, queryUnidadId);
            const { data, total } = await this.jovenesService.findAllByUnit(queryUnidadId, opts);
            return {
                success: true,
                message: `Miembros de la unidad recuperados`,
                data,
                ...(hayPaginacion(opts) ? { meta: metaPagina(total, opts) } : {}),
            };
        }

        // Visión global: todos los miembros
        const { data, total } = await this.jovenesService.findAll(opts);
        return {
            success: true,
            message: 'Todos los miembros recuperados',
            data,
            ...(hayPaginacion(opts) ? { meta: metaPagina(total, opts) } : {}),
        };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.JOVEN_VIEW)
    async findOne(@Param('id') id: string, @Req() req: any) {
        const joven = await this.jovenesService.findOne(id);

        // ABAC: Validar que el usuario pueda ver esta unidad específica
        await this.unitPolicy.assertCanManageUnit(req.user, joven?.unidadId);

        return {
            success: true,
            message: 'Miembro recuperado exitosamente',
            data: joven,
        };
    }

    @Patch(':id')
    @RequirePermission(PERMISSIONS.JOVEN_UPDATE)
    async update(@Param('id') id: string, @Body() updateJovenDto: UpdateJovenDto, @Req() req: any) {
        // Primero obtenemos el joven para saber a qué unidad pertenece actualmente
        const jovenActual = await this.jovenesService.findOne(id);
        
        // ABAC: ¿Puede gestionar la unidad actual?
        await this.unitPolicy.assertCanManageUnit(req.user, jovenActual.unidadId);

        // ABAC: Si intenta cambiarlo de unidad, ¿puede gestionar la nueva unidad?
        if (updateJovenDto.unidadId && updateJovenDto.unidadId !== jovenActual.unidadId) {
            await this.unitPolicy.assertCanManageUnit(req.user, updateJovenDto.unidadId);
        }

        const joven = await this.jovenesService.updateJoven(id, updateJovenDto, req.user.id);
        return {
            success: true,
            message: 'Miembro actualizado exitosamente',
            data: joven,
        };
    }

    @Delete(':id')
    @RequirePermission(PERMISSIONS.JOVEN_DELETE)
    async remove(@Param('id') id: string, @Req() req: any) {
        const joven = await this.jovenesService.findOne(id);
        
        // ABAC: ¿Puede eliminar en esta unidad?
        await this.unitPolicy.assertCanManageUnit(req.user, joven.unidadId);

        await this.jovenesService.removeJoven(id, req.user.id);
        return {
            success: true,
            message: 'Miembro eliminado exitosamente',
            data: null,
        };
    }
}
