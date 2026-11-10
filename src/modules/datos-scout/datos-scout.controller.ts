import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { DatosScoutService, Actor } from './datos-scout.service';
import { CreateDatosScoutDto } from './dto/create-datos-scout.dto';
import { UpdateDatosScoutDto } from './dto/update-datos-scout.dto';
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
  @RequirePermission(PERMISSIONS.DATOS_SCOUT_VIEW)
  findAll(@Req() req: any) {
    // Listado global: prohibido para cuentas jóvenes
    this.selfScope.assertNotJoven(req.user);
    return this.datosScoutService.findAll(req.user as Actor);
  }

  @Get('miembro/:miembroId')
  @RequirePermission(PERMISSIONS.DATOS_SCOUT_VIEW)
  findByMiembro(@Param('miembroId') miembroId: string, @Req() req: any) {
    // Self-scope: el rol JOVEN solo lee sus propios datos scout
    this.selfScope.assertSelf(req.user, miembroId);
    return this.datosScoutService.findByMiembro(miembroId, req.user as Actor);
  }

  @Post()
  @RequirePermission(PERMISSIONS.DATOS_SCOUT_MANAGE)
  async create(@Body() dto: CreateDatosScoutDto, @Req() req: any) {
    const data = await this.datosScoutService.crear(dto, req.user as Actor);
    return { success: true, message: 'Expediente scout registrado exitosamente', data };
  }

  @Patch('miembro/:miembroId')
  @RequirePermission(PERMISSIONS.DATOS_SCOUT_MANAGE)
  async update(
    @Param('miembroId') miembroId: string,
    @Body() dto: UpdateDatosScoutDto,
    @Req() req: any,
  ) {
    const data = await this.datosScoutService.actualizarPorMiembro(miembroId, dto, req.user as Actor);
    return { success: true, message: 'Expediente scout actualizado exitosamente', data };
  }
}
