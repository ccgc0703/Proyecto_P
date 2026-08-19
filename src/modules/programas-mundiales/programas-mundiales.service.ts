import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramasMundialesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCatalog() {
    return this.prisma.programaMundial.findMany({ where: { activo: true, deletedAt: null } });
  }

  async findByMiembro(miembroId: string) {
    return this.prisma.miembroProgramaMundial.findMany({
      where: { miembroId, deletedAt: null },
      include: { ProgramaMundial: true }
    });
  }
}
