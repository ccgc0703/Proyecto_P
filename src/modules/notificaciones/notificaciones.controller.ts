import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { QueryNotificacionesDto } from './dto/query-notificaciones.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { SelfScope } from '../../common/decorators/permissions.decorator';
import { resolverOpcionesLista, metaPagina } from '../../common/paginacion';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificacionesController {
    constructor(private readonly notificacionesService: NotificacionesService) { }

    // ── Self-scope: cada usuario solo ve y marca sus propias notificaciones ──
    // (sin @RequirePermission: el alcance lo define el id del JWT)

    @SelfScope()
    @Get()
    async listar(@Query() query: QueryNotificacionesDto, @Req() req: any) {
        const opts = resolverOpcionesLista({ page: query.page, limit: query.limit });
        const { items, total, noLeidas } = await this.notificacionesService.listar(
            req.user.id,
            { ...opts, soloNoLeidas: query.soloNoLeidas === 'true' },
        );
        return {
            success: true,
            message: 'Notificaciones recuperadas exitosamente',
            data: items,
            // `noLeidas` alimenta el badge del shell sin una llamada extra.
            meta: { ...metaPagina(total, opts), noLeidas },
        };
    }

    @SelfScope()
    @Post('leer-todas')
    async marcarTodas(@Req() req: any) {
        const count = await this.notificacionesService.marcarTodas(req.user.id);
        return {
            success: true,
            message: `${count} notificación(es) marcada(s) como leída(s)`,
            data: null,
        };
    }

    @SelfScope()
    @Post(':id/leer')
    async marcarLeida(@Param('id') id: string, @Req() req: any) {
        const notificacion = await this.notificacionesService.marcarLeida(req.user.id, id);
        return {
            success: true,
            message: 'Notificación marcada como leída',
            data: notificacion,
        };
    }
}
