import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ProgramasMundialesService } from './programas-mundiales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';

@Controller('programas-mundiales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProgramasMundialesController {
  constructor(
    private readonly programasMundialesService: ProgramasMundialesService,
    private readonly selfScope: SelfScopePolicy,
  ) {}

  @Get('catalogo')
  @RequirePermission(PERMISSIONS.CATALOGO_VIEW)
  findAllCatalog() {
    return this.programasMundialesService.findAllCatalog();
  }

  @Get('miembro/:miembroId')
  @RequirePermission(PERMISSIONS.JOVEN_VIEW)
  findByMiembro(@Param('miembroId') miembroId: string, @Req() req: any) {
    // Self-scope: el rol JOVEN solo lee sus propios programas
    this.selfScope.assertSelf(req.user, miembroId);
    return this.programasMundialesService.findByMiembro(miembroId);
  }
}
