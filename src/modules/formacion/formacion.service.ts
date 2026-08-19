import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FormacionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.formacion.findMany({ include: { Adulto: true } });
  }

  async findByAdulto(adultoId: string) {
    return this.prisma.formacion.findMany({
      where: { adultoId }
    });
  }
}
