import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EventosService, Actor } from './eventos.service';
import { CreatePlanificacionDto } from './dto/create-planificacion.dto';
import { UpdatePlanificacionDto } from './dto/update-planificacion.dto';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { AsistenciaBulkDto } from './dto/asistencia-bulk.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import {
    QueryActividadesDto,
    QueryAsistenciasUnidadDto,
    QueryPlanificacionesDto,
} from './dto/query-eventos.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { resolverOpcionesLista, hayPaginacion, metaPagina } from '../../common/paginacion';

@Controller('eventos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventosController {
    constructor(private readonly eventosService: EventosService) { }

    // ── Planificaciones ───────────────────────────────────────────────

    @Get('planificaciones')
    @RequirePermission(PERMISSIONS.EVENTO_VIEW)
    async findPlanificaciones(@Query() query: QueryPlanificacionesDto, @Req() req: any) {
        const opts = resolverOpcionesLista(req.query ?? {});
        const data = await this.eventosService.findPlanificaciones(query, req.user as Actor, opts);
        if (!hayPaginacion(opts)) {
            return { success: true, message: 'Planificaciones recuperadas', data };
        }
        const total = await this.eventosService.countPlanificaciones(query, req.user as Actor, opts.q);
        return {
            success: true,
            message: 'Planificaciones recuperadas',
            data,
            meta: metaPagina(total, opts),
        };
    }

    @Get('planificaciones/:id')
    @RequirePermission(PERMISSIONS.EVENTO_VIEW)
    async findOnePlanificacion(@Param('id') id: string, @Req() req: any) {
        const data = await this.eventosService.findOnePlanificacion(id, req.user as Actor);
        return { success: true, message: 'Planificación recuperada', data };
    }

    @Post('planificaciones')
    @RequirePermission(PERMISSIONS.EVENTO_CREATE)
    async createPlanificacion(@Body() dto: CreatePlanificacionDto, @Req() req: any) {
        const data = await this.eventosService.createPlanificacion(dto, req.user as Actor);
        return { success: true, message: 'Planificación creada exitosamente', data };
    }

    @Patch('planificaciones/:id')
    @RequirePermission(PERMISSIONS.EVENTO_CREATE)
    async updatePlanificacion(
        @Param('id') id: string,
        @Body() dto: UpdatePlanificacionDto,
        @Req() req: any,
    ) {
        const data = await this.eventosService.updatePlanificacion(id, dto, req.user as Actor);
        return { success: true, message: 'Planificación actualizada exitosamente', data };
    }

    @Delete('planificaciones/:id')
    @RequirePermission(PERMISSIONS.EVENTO_CREATE)
    async removePlanificacion(@Param('id') id: string, @Req() req: any) {
        await this.eventosService.removePlanificacion(id, req.user as Actor);
        return { success: true, message: 'Planificación eliminada exitosamente', data: null };
    }

    // ── Actividades ───────────────────────────────────────────────────

    @Get('actividades')
    @RequirePermission(PERMISSIONS.EVENTO_VIEW)
    async findActividades(@Query() query: QueryActividadesDto, @Req() req: any) {
        const opts = resolverOpcionesLista(req.query ?? {});
        const data = await this.eventosService.findActividades(query, req.user as Actor, opts);
        if (!hayPaginacion(opts)) {
            return { success: true, message: 'Actividades recuperadas', data };
        }
        const total = await this.eventosService.countActividades(query, req.user as Actor, opts.q);
        return {
            success: true,
            message: 'Actividades recuperadas',
            data,
            meta: metaPagina(total, opts),
        };
    }

    @Get('actividades/:id')
    @RequirePermission(PERMISSIONS.EVENTO_VIEW)
    async findOneActividad(@Param('id') id: string, @Req() req: any) {
        const data = await this.eventosService.findOneActividad(id, req.user as Actor);
        return { success: true, message: 'Actividad recuperada', data };
    }

    @Post('planificaciones/:planificacionId/actividades')
    @RequirePermission(PERMISSIONS.EVENTO_CREATE)
    async createActividad(
        @Param('planificacionId') planificacionId: string,
        @Body() dto: CreateActividadDto,
        @Req() req: any,
    ) {
        const data = await this.eventosService.createActividad(planificacionId, dto, req.user as Actor);
        return { success: true, message: 'Actividad creada exitosamente', data };
    }

    @Patch('actividades/:id')
    @RequirePermission(PERMISSIONS.EVENTO_CREATE)
    async updateActividad(@Param('id') id: string, @Body() dto: UpdateActividadDto, @Req() req: any) {
        const data = await this.eventosService.updateActividad(id, dto, req.user as Actor);
        return { success: true, message: 'Actividad actualizada exitosamente', data };
    }

    @Delete('actividades/:id')
    @RequirePermission(PERMISSIONS.EVENTO_CREATE)
    async removeActividad(@Param('id') id: string, @Req() req: any) {
        await this.eventosService.removeActividad(id, req.user as Actor);
        return { success: true, message: 'Actividad eliminada exitosamente', data: null };
    }

    // ── Asistencias ───────────────────────────────────────────────────

    @Get('actividades/:id/asistencias')
    @RequirePermission(PERMISSIONS.ASISTENCIA_VIEW)
    async listarAsistencias(@Param('id') id: string, @Req() req: any) {
        const data = await this.eventosService.listarAsistenciasActividad(id, req.user as Actor);
        return { success: true, message: 'Planilla de asistencia recuperada', data };
    }

    @Post('actividades/:id/asistencias')
    @RequirePermission(PERMISSIONS.ASISTENCIA_MANAGE)
    async registrarAsistencias(
        @Param('id') id: string,
        @Body() dto: AsistenciaBulkDto,
        @Req() req: any,
    ) {
        const data = await this.eventosService.registrarAsistenciasBulk(id, dto, req.user as Actor);
        return { success: true, message: 'Asistencias registradas exitosamente', data };
    }

    @Patch('asistencias/:id')
    @RequirePermission(PERMISSIONS.ASISTENCIA_MANAGE)
    async updateAsistencia(@Param('id') id: string, @Body() dto: UpdateAsistenciaDto, @Req() req: any) {
        const data = await this.eventosService.updateAsistencia(id, dto, req.user as Actor);
        return { success: true, message: 'Asistencia actualizada exitosamente', data };
    }

    @Get('unidades/:unidadId/asistencias')
    @RequirePermission(PERMISSIONS.ASISTENCIA_VIEW)
    async asistenciasDeUnidad(
        @Param('unidadId') unidadId: string,
        @Query() query: QueryAsistenciasUnidadDto,
        @Req() req: any,
    ) {
        const data = await this.eventosService.asistenciasDeUnidad(unidadId, query, req.user as Actor);
        return { success: true, message: 'Asistencias de la unidad recuperadas', data };
    }
}
