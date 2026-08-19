import { Module } from '@nestjs/common';
import { FormacionService } from './formacion.service';
import { FormacionController } from './formacion.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FormacionController],
  providers: [FormacionService]
})
export class FormacionModule {}
