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
    
    @Get('stats')
    @RequirePermission(PERMISSIONS.JOVEN_VIEW)
    async getStats() {
        const stats = await this.jovenesService.getStats();
        return {
            success: true,
            data: stats,
        };
    }

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

        // ABAC: Si el usuario es restringido (Adulto de Unidad), solo puede ver su unidad
        if (this.unitPolicy.isRestricted(user)) {
            if (!user.unidadId) {
                return {
                    success: true,
                    message: 'No tienes una unidad asignada',
                    data: []
                };
            }
            const jovenes = await this.jovenesService.findAllByUnit(user.unidadId);
            return {
                success: true,
                message: 'Miembros de tu unidad recuperados',
                data: jovenes
            };
        }

        // Si el usuario tiene visión global (Admin/Jefe) y pide una unidad específica
        if (queryUnidadId) {
            const jovenes = await this.jovenesService.findAllByUnit(queryUnidadId);
            return {
                success: true,
                message: `Miembros de la unidad recuperados`,
                data: jovenes
            };
        }

        // Visión global: todos los miembros
        const jovenes = await this.jovenesService.findAll();
        return {
            success: true,
            message: 'Todos los miembros recuperados',
            data: jovenes,
        };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.JOVEN_VIEW)
    async findOne(@Param('id') id: string, @Req() req: any) {
        const joven = await this.jovenesService.findOne(id);

        // ABAC: Validar que el usuario pueda ver esta unidad específica
        this.unitPolicy.assertCanManageUnit(req.user, joven?.unidadId);

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
        this.unitPolicy.assertCanManageUnit(req.user, jovenActual.unidadId);

        // ABAC: Si intenta cambiarlo de unidad, ¿puede gestionar la nueva unidad?
        if (updateJovenDto.unidadId && updateJovenDto.unidadId !== jovenActual.unidadId) {
            this.unitPolicy.assertCanManageUnit(req.user, updateJovenDto.unidadId);
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
        this.unitPolicy.assertCanManageUnit(req.user, joven.unidadId);

        await this.jovenesService.removeJoven(id, req.user.id);
        return {
            success: true,
            message: 'Miembro eliminado exitosamente',
            data: null,
        };
    }
}
