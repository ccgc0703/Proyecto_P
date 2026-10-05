import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { DatosScoutService } from './datos-scout.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';

@Controller('datos-scout')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DatosScoutController {
  constructor(
    private readonly datosScoutService: DatosScoutService,
    private readonly selfScope: SelfScopePolicy,
  ) {}

  @Get()
  @RequirePermission(PERMISSIONS.JOVEN_VIEW)
  findAll(@Req() req: any) {
    // Listado global: prohibido para cuentas jóvenes
    this.selfScope.assertNotJoven(req.user);
    return this.datosScoutService.findAll();
  }

  @Get('miembro/:miembroId')
  @RequirePermission(PERMISSIONS.JOVEN_VIEW)
  findByMiembro(@Param('miembroId') miembroId: string, @Req() req: any) {
    // Self-scope: el rol JOVEN solo lee sus propios datos scout
    this.selfScope.assertSelf(req.user, miembroId);
    return this.datosScoutService.findByMiembro(miembroId);
  }
}
