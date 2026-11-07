import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService, Actor } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

/**
 * DashboardController — resumen ejecutivo de una sola llamada (Fase 2).
 *
 * Autorización en capas: JwtAuthGuard → PermissionsGuard (`joven:view`:
 * el dashboard es una vista agregada del módulo de jóvenes) → alcance por
 * unidad resuelto dentro del servicio con UnitPolicy.
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    /** Resumen ejecutivo: población, progresión, asistencia y alertas. */
    @Get('resumen')
    @RequirePermission(PERMISSIONS.JOVEN_VIEW)
    async getResumen(@Req() req: any) {
        const user: Actor = req.user;
        const data = await this.dashboardService.getResumen(user);
        return {
            success: true,
            message: 'Resumen del dashboard obtenido',
            data,
        };
    }
}
