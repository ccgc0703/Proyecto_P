import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProgramasMundialesService } from './programas-mundiales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('programas-mundiales')
@UseGuards(JwtAuthGuard)
export class ProgramasMundialesController {
  constructor(private readonly programasMundialesService: ProgramasMundialesService) {}

  @Get('catalogo')
  findAllCatalog() {
    return this.programasMundialesService.findAllCatalog();
  }

  @Get('miembro/:miembroId')
  findByMiembro(@Param('miembroId') miembroId: string) {
    return this.programasMundialesService.findByMiembro(miembroId);
  }
}
