import { Module } from '@nestjs/common';
import { DatosScoutService } from './datos-scout.service';
import { DatosScoutController } from './datos-scout.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';

@Module({
  imports: [PrismaModule],
  controllers: [DatosScoutController],
  providers: [DatosScoutService, SelfScopePolicy]
})
export class DatosScoutModule {}
