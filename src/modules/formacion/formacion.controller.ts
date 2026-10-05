import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { FormacionService } from './formacion.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';

@Controller('formacion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FormacionController {
  constructor(
    private readonly formacionService: FormacionService,
    private readonly selfScope: SelfScopePolicy,
  ) {}

  @Get()
  @RequirePermission(PERMISSIONS.FORMACION_VIEW)
  findAll(@Req() req: any) {
    // Listado global: prohibido para cuentas jóvenes
    this.selfScope.assertNotJoven(req.user);
    return this.formacionService.findAll();
  }

  @Get('adulto/:adultoId')
  @RequirePermission(PERMISSIONS.FORMACION_VIEW)
  findByAdulto(@Param('adultoId') adultoId: string, @Req() req: any) {
    this.selfScope.assertNotJoven(req.user);
    return this.formacionService.findByAdulto(adultoId);
  }
}
