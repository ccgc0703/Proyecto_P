import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';
import { CreatePatrullaDto } from './dto/create-patrulla.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

import { UnitPolicy } from '../../common/policies/unit.policy';
import { resolverOpcionesLista, hayPaginacion, metaPagina } from '../../common/paginacion';

@Controller('unidades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UnidadesController {
    constructor(
        private readonly unidadesService: UnidadesService,
        private readonly unitPolicy: UnitPolicy,
    ) { }

    @Post()
    @RequirePermission(PERMISSIONS.UNIDAD_CREATE)
    async create(@Body() createUnidadDto: CreateUnidadDto, @Req() req: any) {
        const unidad = await this.unidadesService.create(createUnidadDto, req.user.id);
        return {
            success: true,
            message: 'Unidad creada exitosamente',
            data: unidad,
        };
    }

    @Get()
    @RequirePermission(PERMISSIONS.UNIDAD_VIEW)
    async findAll(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('q') q?: string,
    ) {
        const user = req.user;
        const opts = resolverOpcionesLista({ page, limit, q });

        // ABAC: Si el usuario es restringido, solo puede ver SU unidad
        if (this.unitPolicy.isRestricted(user)) {
             if (user.unidadId) {
                const unidad = await this.unidadesService.findOne(user.unidadId);
                return { success: true, message: 'Tu unidad recuperada', data: [unidad] };
             }
             return { success: true, message: 'No tienes unidad asignada', data: [] };
        }

        // F4.3: ámbito jerárquico — null = visión global, string[] = solo esas unidades
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        if (alcance !== null) {
            const unidades = await this.unidadesService.findAll({ id: { in: alcance } }, opts);
            if (!hayPaginacion(opts)) {
                return {
                    success: true,
                    message: 'Unidades de tu ámbito recuperadas',
                    data: unidades,
                };
            }
            const totalAlcance = await this.unidadesService.count(opts, { id: { in: alcance } });
            return {
                success: true,
                message: 'Unidades de tu ámbito recuperadas',
                data: unidades,
                meta: metaPagina(totalAlcance, opts),
            };
        }

        const unidades = await this.unidadesService.findAll({}, opts);
        if (!hayPaginacion(opts)) {
            return {
                success: true,
                message: 'Todas las unidades recuperadas',
                data: unidades,
            };
        }
        const total = await this.unidadesService.count(opts);
        return {
            success: true,
            message: 'Todas las unidades recuperadas',
            data: unidades,
            meta: metaPagina(total, opts),
        };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.UNIDAD_VIEW)
    async findOne(@Param('id') id: string, @Req() req: any) {
        // ABAC: Validar acceso antes de retornar
        await this.unitPolicy.assertCanManageUnit(req.user, id);

        const unidad = await this.unidadesService.findOne(id);
        return {
            success: true,
            message: 'Unidad recuperada exitosamente',
            data: unidad,
        };
    }

    @Get(':id/patrullas')
    @RequirePermission(PERMISSIONS.UNIDAD_VIEW)
    async getPatrullas(@Param('id') id: string, @Req() req: any) {
        // ABAC: Validar acceso
        await this.unitPolicy.assertCanManageUnit(req.user, id);

        const patrullas = await this.unidadesService.getPatrullas(id);
        return {
            success: true,
            message: 'Estructuras de unidad recuperadas',
            data: patrullas,
        };
    }

    @Post(':id/patrullas')
    @RequirePermission(PERMISSIONS.UNIDAD_VIEW)
    async createPatrulla(
        @Param('id') id: string,
        @Body() dto: CreatePatrullaDto,
        @Req() req: any,
    ) {
        await this.unitPolicy.assertCanManageUnit(req.user, id);

        const patrulla = await this.unidadesService.createPatrulla(
            { ...dto, unidadId: id },
            req.user.id,
        );
        return {
            success: true,
            message: 'Patrulla creada exitosamente',
            data: patrulla,
        };
    }

    @Delete(':id')
    @RequirePermission(PERMISSIONS.UNIDAD_DELETE)
    async remove(@Param('id') id: string, @Req() req: any) {
        // ABAC: Solo el admin puede borrar unidades, pero validamos de todos modos
        await this.unitPolicy.assertCanManageUnit(req.user, id);

        await this.unidadesService.remove(id, req.user.id);
        return {
            success: true,
            message: 'Unidad eliminada exitosamente',
            data: null,
        };
    }

    @Patch(':id')
    @RequirePermission(PERMISSIONS.UNIDAD_UPDATE)
    async update(@Param('id') id: string, @Body() updateUnidadDto: UpdateUnidadDto, @Req() req: any) {
        // ABAC: Validar acceso antes de actualizar
        await this.unitPolicy.assertCanManageUnit(req.user, id);

        const unidad = await this.unidadesService.update(id, updateUnidadDto);
        return {
            success: true,
            message: 'Unidad actualizada exitosamente',
            data: unidad,
        };
    }
}
