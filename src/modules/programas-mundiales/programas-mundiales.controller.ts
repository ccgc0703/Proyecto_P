import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProgramasMundialesService, Actor } from './programas-mundiales.service';
import { CreateProgramaMiembroDto } from './dto/create-programa-miembro.dto';
import { UpdateProgramaMiembroDto } from './dto/update-programa-miembro.dto';
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

  @Get()
  @RequirePermission(PERMISSIONS.PROGRAMA_MUNDIAL_VIEW)
  findAll(@Req() req: any) {
    // Listado global: prohibido para cuentas jóvenes
    this.selfScope.assertNotJoven(req.user);
    return this.programasMundialesService.findAll(req.user as Actor);
  }

  @Get('catalogo')
  @RequirePermission(PERMISSIONS.PROGRAMA_MUNDIAL_VIEW)
  findAllCatalog() {
    return this.programasMundialesService.findAllCatalog();
  }

  @Get('miembro/:miembroId')
  @RequirePermission(PERMISSIONS.PROGRAMA_MUNDIAL_VIEW)
  findByMiembro(@Param('miembroId') miembroId: string, @Req() req: any) {
    // Self-scope: el rol JOVEN solo lee sus propios programas
    this.selfScope.assertSelf(req.user, miembroId);
    return this.programasMundialesService.findByMiembro(miembroId, req.user as Actor);
  }

  @Post()
  @RequirePermission(PERMISSIONS.PROGRAMA_MUNDIAL_MANAGE)
  async create(@Body() dto: CreateProgramaMiembroDto, @Req() req: any) {
    const data = await this.programasMundialesService.crear(dto, req.user as Actor);
    return { success: true, message: 'Programa mundial enlazado exitosamente', data };
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PROGRAMA_MUNDIAL_MANAGE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProgramaMiembroDto,
    @Req() req: any,
  ) {
    const data = await this.programasMundialesService.actualizar(id, dto, req.user as Actor);
    return { success: true, message: 'Programa mundial actualizado exitosamente', data };
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.PROGRAMA_MUNDIAL_MANAGE)
  async remove(@Param('id') id: string, @Req() req: any) {
    const data = await this.programasMundialesService.eliminar(id, req.user as Actor);
    return { success: true, message: 'Programa mundial eliminado exitosamente', data };
  }
}
