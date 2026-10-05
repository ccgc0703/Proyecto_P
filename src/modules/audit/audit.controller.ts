import { Controller, Get, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @RequirePermission(PERMISSIONS.RBAC_VIEW)
    async findAll(
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        const result = await this.auditService.findRecent(
            limit ? parseInt(limit, 10) : 50,
            page ? parseInt(page, 10) : 1,
        );
        return {
            success: true,
            message: 'Registros de auditoría recuperados',
            ...result,
        };
    }

    /**
     * F4.6 · Ejecuta la retención manualmente (el job automático corre a las 03:00).
     * `?dias=N` permite forzar otra ventana; sin parámetro usa AUDIT_RETENTION_DAYS.
     */
    @Post('retencion')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(PERMISSIONS.RBAC_MANAGE)
    async purgar(@Query('dias') dias?: string) {
        const diasParam = dias !== undefined ? parseInt(dias, 10) : undefined;
        const resultado = await this.auditService.purgarRetencion(
            diasParam !== undefined && Number.isFinite(diasParam)
                ? diasParam
                : this.auditService.retencionDias(),
        );

        return {
            success: true,
            message: resultado.deshabilitado
                ? 'Retención de auditoría deshabilitada'
                : `Retención aplicada: ${resultado.eliminados} registro(s) eliminados`,
            data: resultado,
        };
    }
}
