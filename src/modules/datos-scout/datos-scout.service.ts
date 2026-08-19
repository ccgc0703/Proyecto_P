import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatosScoutService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.datosScout.findMany();
  }

  async findByMiembro(miembroId: string) {
    const data = await this.prisma.datosScout.findUnique({
      where: { miembroId }
    });
    if (!data) throw new NotFoundException('Datos scout no encontrados para este miembro');
    return data;
  }
}
