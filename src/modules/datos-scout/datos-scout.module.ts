import { Module } from '@nestjs/common';
import { DatosScoutService } from './datos-scout.service';
import { DatosScoutController } from './datos-scout.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DatosScoutController],
  providers: [DatosScoutService]
})
export class DatosScoutModule {}
