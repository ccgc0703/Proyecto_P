import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FormacionService } from './formacion.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('formacion')
@UseGuards(JwtAuthGuard)
export class FormacionController {
  constructor(private readonly formacionService: FormacionService) {}

  @Get()
  findAll() {
    return this.formacionService.findAll();
  }

  @Get('adulto/:adultoId')
  findByAdulto(@Param('adultoId') adultoId: string) {
    return this.formacionService.findByAdulto(adultoId);
  }
}
