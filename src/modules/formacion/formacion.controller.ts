import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { FormacionService, Actor } from './formacion.service';
import { CreateFormacionDto } from './dto/create-formacion.dto';
import { UpdateFormacionDto } from './dto/update-formacion.dto';
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
    return this.formacionService.findAll(req.user as Actor);
  }

  @Get('adultos')
  @RequirePermission(PERMISSIONS.FORMACION_VIEW)
  async listarAdultos(@Req() req: any) {
    // Selector de adulto para el alta de formaciones: no exige `user:view`
    // (hay roles con `formacion:manage` que no lo tienen).
    this.selfScope.assertNotJoven(req.user);
    const data = await this.formacionService.listarAdultos(req.user as Actor);
    return { success: true, message: 'Adultos recuperados', data };
  }

  @Get('adulto/:adultoId')
  @RequirePermission(PERMISSIONS.FORMACION_VIEW)
  findByAdulto(@Param('adultoId') adultoId: string, @Req() req: any) {
    this.selfScope.assertNotJoven(req.user);
    return this.formacionService.findByAdulto(adultoId, req.user as Actor);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.FORMACION_VIEW)
  async findOne(@Param('id') id: string, @Req() req: any) {
    this.selfScope.assertNotJoven(req.user);
    const data = await this.formacionService.obtener(id, req.user as Actor);
    return { success: true, message: 'Formación recuperada', data };
  }

  @Post()
  @RequirePermission(PERMISSIONS.FORMACION_MANAGE)
  async create(@Body() dto: CreateFormacionDto, @Req() req: any) {
    const data = await this.formacionService.crear(dto, req.user as Actor);
    return { success: true, message: 'Formación registrada exitosamente', data };
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.FORMACION_MANAGE)
  async update(@Param('id') id: string, @Body() dto: UpdateFormacionDto, @Req() req: any) {
    const data = await this.formacionService.actualizar(id, dto, req.user as Actor);
    return { success: true, message: 'Formación actualizada exitosamente', data };
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.FORMACION_MANAGE)
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.formacionService.eliminar(id, req.user as Actor);
    return { success: true, message: 'Formación eliminada exitosamente', data: null };
  }
}
