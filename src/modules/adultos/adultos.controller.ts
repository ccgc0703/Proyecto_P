import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AdultosService } from './adultos.service';
import { CreateAdultoDto } from './dto/create-adulto.dto';
import { UpdateAdultoDto } from './dto/update-adulto.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('adultos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdultosController {
  constructor(private readonly adultosService: AdultosService) {}

  @Get()
  @RequirePermission(PERMISSIONS.USER_VIEW) // Reuse users view permission for staff
  findAll() {
    return this.adultosService.findAll();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.USER_VIEW)
  findOne(@Param('id') id: string) {
    return this.adultosService.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.USER_CREATE)
  create(@Body() dto: CreateAdultoDto, @Req() req: any) {
      return this.adultosService.create(dto, req.user.id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.USER_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateAdultoDto, @Req() req: any) {
      return this.adultosService.update(id, dto, req.user.id);
  }

  @Post(':id/cuenta')
  @RequirePermission(PERMISSIONS.USER_CREATE)
  createAccount(@Param('id') id: string, @Body() dto: CreateAccountDto, @Req() req: any) {
      return this.adultosService.createAccount(id, dto, req.user.id);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.USER_DELETE)
  remove(@Param('id') id: string, @Req() req: any) {
      return this.adultosService.remove(id, req.user.id);
  }
}
