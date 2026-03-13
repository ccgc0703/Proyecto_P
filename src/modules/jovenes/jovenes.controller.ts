/**
 * Controlador para la gestión de jóvenes.
 *
 * Arquitectura de autorización en capas:
 *   JwtAuthGuard       → (401) verifica JWT y tokenVersion
 *   PermissionsGuard   → (403) verifica permisos RBAC desde JWT (sin DB)
 *   UnitPolicy         → (403) ABAC: aislamiento por unidad (inyectado, centralizado)
 *   Handler            → lógica de negocio
 */
import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { JovenesService } from './jovenes.service';
import { CreateJovenDto } from './dto/create-joven.dto';
import { UpdateJovenDto } from './dto/update-joven.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { UnitPolicy } from '../../common/policies/unit.policy';

@Controller('jovenes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class JovenesController {
    constructor(
        private readonly jovenesService: JovenesService,
        private readonly unitPolicy: UnitPolicy,     // ABAC centralizado
    ) { }

    @Post()
    @RequirePermission(PERMISSIONS.JOVEN_CREATE)
    async create(@Body() createJovenDto: CreateJovenDto, @Req() req: any) {
        // ABAC: el adulto solo puede crear jóvenes en su propia unidad
        this.unitPolicy.assertCanManageUnit(req.user, createJovenDto.unidadId);

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
    async findAll(@Req() req: any, @Query('unidadId') queryUnidadId?: string) {
        const user = req.user;

        // ABAC: si el usuario está restringido a su unidad, forzamos el filtro.
        // Se pasa user.unidadId directamente (puede ser null): si es null, canManageUnit
        // retorna true (sin restricción), evitando el bug de `?? 'any'` que bloqueaba
        // a usuarios sin unidad asignada.
        if (!this.unitPolicy.canManageUnit(user, user.unidadId ?? undefined)) {
            const jovenes = await this.jovenesService.findAllByUnit(user.unidadId);
            return { success: true, message: 'Jóvenes de tu unidad recuperados', data: jovenes };
        }

        // Si el usuario puede ver todo y quiere filtrar por unidad
        if (queryUnidadId) {
            const jovenes = await this.jovenesService.findAllByUnit(queryUnidadId);
            return { success: true, message: `Jóvenes de la unidad ${queryUnidadId} recuperados`, data: jovenes };
        }

        const jovenes = await this.jovenesService.findAll();
        return {
            success: true,
            message: 'Todos los jóvenes recuperados',
            data: jovenes,
        };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.JOVEN_VIEW)
    async findOne(@Param('id') id: string, @Req() req: any) {
        const joven = await this.jovenesService.findOne(id);

        // ABAC: el adulto solo puede ver jóvenes de su propia unidad
        this.unitPolicy.assertCanManageUnit(req.user, joven?.unidadId);

        return {
            success: true,
            message: 'Joven recuperado exitosamente',
            data: joven,
        };
    }

    @Patch(':id')
    @RequirePermission(PERMISSIONS.JOVEN_UPDATE)
    async update(@Param('id') id: string, @Body() updateJovenDto: UpdateJovenDto, @Req() req: any) {
        const joven = await this.jovenesService.updateJoven(id, updateJovenDto, req.user.id);
        return {
            success: true,
            message: 'Joven actualizado exitosamente',
            data: joven,
        };
    }

    @Delete(':id')
    @RequirePermission(PERMISSIONS.JOVEN_DELETE)
    async remove(@Param('id') id: string, @Req() req: any) {
        await this.jovenesService.removeJoven(id, req.user.id);
        return {
            success: true,
            message: 'Joven eliminado exitosamente',
            data: null,
        };
    }
}
