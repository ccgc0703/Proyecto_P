import { Controller, Get, Param, Req, StreamableFile, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';
import { PdfService, Actor } from './pdf.service';
import { ProgresionService, Actor as ActorProgresion } from '../progresion/progresion.service';
import { EventosService, Actor as ActorEventos } from '../eventos/eventos.service';

const MIME_PDF = 'application/pdf';

/**
 * Exportación de documentos PDF (Fase 7a):
 * - `GET /pdf/constancia/:miembroId` — constancia de progresión.
 * - `GET /pdf/carnet/:miembroId` — carnet del miembro (tarjeta).
 * - `GET /pdf/asistencia/:actividadId` — listado de asistencia de la actividad.
 *
 * Los permisos/ABAC son idénticos a sus contrapartes de lectura (xlsx /
 * datos-scout / planilla), de modo que generar un PDF no amplía el alcance
 * de nadie.
 */
@Controller('pdf')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PdfController {
    constructor(
        private readonly pdfService: PdfService,
        private readonly progresionService: ProgresionService,
        private readonly eventosService: EventosService,
        private readonly selfScope: SelfScopePolicy,
    ) { }

    @Get('constancia/:miembroId')
    @RequirePermission(PERMISSIONS.PROGRESION_VIEW)
    async constancia(@Param('miembroId') miembroId: string, @Req() req: any): Promise<StreamableFile> {
        this.selfScope.assertSelf(req.user, miembroId);
        const datos = await this.progresionService.getDatosExportJoven(miembroId, req.user as ActorProgresion);
        const buffer = await this.pdfService.renderConstancia(datos);
        const nombre = `constancia-progresion-${this.slug(`${datos.apellidos} ${datos.nombres}`)}.pdf`;
        return this.archivo(buffer, nombre);
    }

    @Get('carnet/:miembroId')
    @RequirePermission(PERMISSIONS.DATOS_SCOUT_VIEW)
    async carnet(@Param('miembroId') miembroId: string, @Req() req: any): Promise<StreamableFile> {
        // Self-scope: el rol JOVEN sólo lee su propio carnet.
        this.selfScope.assertSelf(req.user, miembroId);
        const datos = await this.pdfService.getDatosCarnet(miembroId, req.user as Actor);
        const buffer = await this.pdfService.renderCarnet(datos);
        const nombre = `carnet-${this.slug(`${datos.apellidos} ${datos.nombres}`)}.pdf`;
        return this.archivo(buffer, nombre);
    }

    @Get('asistencia/:actividadId')
    @RequirePermission(PERMISSIONS.ASISTENCIA_VIEW)
    async asistencia(@Param('actividadId') actividadId: string, @Req() req: any): Promise<StreamableFile> {
        // `listarAsistenciasActividad` aplica el ABAC por unidad internamente.
        const planilla = await this.eventosService.listarAsistenciasActividad(
            actividadId,
            req.user as ActorEventos,
        );
        const buffer = await this.pdfService.renderAsistencia(planilla);
        const nombre = `asistencia-${this.slug(planilla.actividad.titulo)}.pdf`;
        return this.archivo(buffer, nombre);
    }

    private archivo(buffer: Buffer, filename: string): StreamableFile {
        return new StreamableFile(buffer, {
            type: MIME_PDF,
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
        return s || 'documento';
    }
}
