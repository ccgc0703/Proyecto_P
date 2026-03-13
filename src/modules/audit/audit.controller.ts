import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
