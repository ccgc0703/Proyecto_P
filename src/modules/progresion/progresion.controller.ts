import { Body, Controller, Get, Param, Patch, Post, Query, Req, StreamableFile, UseGuards } from '@nestjs/common';
import { ProgresionService, Actor } from './progresion.service';
import { ExportService } from './export.service';
import { ActualizarEstadoIndicadorDto } from './dto/actualizar-estado-indicador.dto';
import { RechazarProgresionDto } from './dto/rechazar-progresion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';
import { resolverOpcionesLista, hayPaginacion, metaPagina } from '../../common/paginacion';

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller('progresion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProgresionController {
    constructor(
        private readonly progresionService: ProgresionService,
        private readonly exportService: ExportService,
        private readonly selfScope: SelfScopePolicy,
    ) { }

    @Get('jovenes/:miembroId/resumen')
    @RequirePermission(PERMISSIONS.PROGRESION_VIEW)
    async getResumen(@Param('miembroId') miembroId: string, @Req() req: any) {
        this.selfScope.assertSelf(req.user, miembroId);
        const data = await this.progresionService.getResumen(miembroId, req.user as Actor);
        return { success: true, message: 'Resumen de progresión recuperado', data };
    }

    @Get('jovenes/:miembroId/indicadores')
    @RequirePermission(PERMISSIONS.PROGRESION_VIEW)
    async getIndicadores(@Param('miembroId') miembroId: string, @Req() req: any) {
        this.selfScope.assertSelf(req.user, miembroId);
        const data = await this.progresionService.getIndicadores(miembroId, req.user as Actor);
        return { success: true, message: 'Indicadores del joven recuperados', data };
    }

    @Patch('jovenes/:miembroId/indicadores/:indicadorId')
    @RequirePermission(PERMISSIONS.PROGRESION_UPDATE)
    async actualizarEstado(
        @Param('miembroId') miembroId: string,
        @Param('indicadorId') indicadorId: string,
        @Body() dto: ActualizarEstadoIndicadorDto,
        @Req() req: any,
    ) {
        // Los indicadores los evalúa la adulta/o responsable, nunca el joven
        this.selfScope.assertNotJoven(req.user);
        const data = await this.progresionService.actualizarEstado(miembroId, indicadorId, dto, req.user as Actor);
        return { success: true, message: 'Estado del indicador actualizado', data };
    }

    @Post('jovenes/:miembroId/adelantos/:adelantoId/iniciar')
    @RequirePermission(PERMISSIONS.PROGRESION_CREATE)
    async iniciarAdelanto(
        @Param('miembroId') miembroId: string,
        @Param('adelantoId') adelantoId: string,
        @Req() req: any,
    ) {
        this.selfScope.assertSelf(req.user, miembroId);
        const data = await this.progresionService.iniciarAdelanto(miembroId, adelantoId, req.user as Actor);
        return { success: true, message: 'Adelanto iniciado', data };
    }

    @Post('progresiones/:id/solicitar')
    @RequirePermission(PERMISSIONS.PROGRESION_UPDATE)
    async solicitar(@Param('id') id: string, @Req() req: any) {
        // Self-scope: resuelto en el service (el dueño se conoce recién al cargar la progresión)
        const data = await this.progresionService.solicitar(id, req.user as Actor);
        return {
            success: true,
            message: data.apto ? 'Ascenso solicitado' : 'Aún no se cumplen los requisitos',
            data,
        };
    }

    @Post('progresiones/:id/aprobar')
    @RequirePermission(PERMISSIONS.PROGRESION_APROBAR)
    async aprobar(@Param('id') id: string, @Req() req: any) {
        this.selfScope.assertNotJoven(req.user);
        const data = await this.progresionService.aprobar(id, req.user as Actor);
        return { success: true, message: 'Ascenso aprobado', data };
    }

    @Post('progresiones/:id/rechazar')
    @RequirePermission(PERMISSIONS.PROGRESION_APROBAR)
    async rechazar(@Param('id') id: string, @Body() dto: RechazarProgresionDto, @Req() req: any) {
        this.selfScope.assertNotJoven(req.user);
        const data = await this.progresionService.rechazar(id, dto, req.user as Actor);
        return { success: true, message: 'Ascenso rechazado', data };
    }

    @Get('unidades/:unidadId/jovenes')
    @RequirePermission(PERMISSIONS.PROGRESION_VIEW)
    async listarJovenes(
        @Param('unidadId') unidadId: string,
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('q') q?: string,
    ) {
        this.selfScope.assertNotJoven(req.user);
        const opts = resolverOpcionesLista({ page, limit, q });
        const data = await this.progresionService.listarJovenesDeUnidad(unidadId, req.user as Actor, opts);
        if (!hayPaginacion(opts)) {
            return { success: true, message: 'JA3venes de la unidad recuperados', data };
        }
        const total = await this.progresionService.countJovenesDeUnidad(unidadId, opts);
        return {
            success: true,
            message: 'JA3venes de la unidad recuperados',
            data,
            meta: metaPagina(total, opts),
        };
    }

    // ── §10.3 Reporte ────────────────────────────────────────────────────

    @Get('jovenes/:miembroId/export.xlsx')
    @RequirePermission(PERMISSIONS.PROGRESION_VIEW)
    async exportarJoven(@Param('miembroId') miembroId: string, @Req() req: any): Promise<StreamableFile> {
        this.selfScope.assertSelf(req.user, miembroId);
        const datos = await this.progresionService.getDatosExportJoven(miembroId, req.user as Actor);
        const buffer = await this.exportService.renderJoven(datos);
        const nombre = `cuadro-adelanto-${this.slug(`${datos.apellidos} ${datos.nombres}`)}.xlsx`;
        return this.archivo(buffer, nombre);
    }

    @Get('unidades/:unidadId/export.xlsx')
    @RequirePermission(PERMISSIONS.PROGRESION_VIEW)
    async exportarUnidad(@Param('unidadId') unidadId: string, @Req() req: any): Promise<StreamableFile> {
        this.selfScope.assertNotJoven(req.user);
        const datos = await this.progresionService.getDatosExportUnidad(unidadId, req.user as Actor);
        const buffer = await this.exportService.renderUnidad(datos);
        const nombre = `cuadro-adelanto-${this.slug(datos.unidad.nombre)}.xlsx`;
        return this.archivo(buffer, nombre);
    }

    private archivo(buffer: Buffer, filename: string): StreamableFile {
        return new StreamableFile(buffer, {
            type: MIME_XLSX,
            disposition: `attachment; filename="${filename}"`,
            length: buffer.length,
        });
    }

    private slug(texto: string): string {
        const s = texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return s || 'reporte';
    }
}
