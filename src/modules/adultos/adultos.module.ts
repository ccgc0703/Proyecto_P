import { Module } from '@nestjs/common';
import { AdultosService } from './adultos.service';
import { AdultosController } from './adultos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, AuditModule, UsersModule],
  controllers: [AdultosController],
  providers: [AdultosService]
})
export class AdultosModule {}
