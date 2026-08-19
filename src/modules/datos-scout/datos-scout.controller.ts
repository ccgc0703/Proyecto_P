import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DatosScoutService } from './datos-scout.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('datos-scout')
@UseGuards(JwtAuthGuard)
export class DatosScoutController {
  constructor(private readonly datosScoutService: DatosScoutService) {}

  @Get()
  findAll() {
    return this.datosScoutService.findAll();
  }

  @Get('miembro/:miembroId')
  findByMiembro(@Param('miembroId') miembroId: string) {
    return this.datosScoutService.findByMiembro(miembroId);
  }
}
