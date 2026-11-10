import { Module } from '@nestjs/common';
import { DatosScoutService } from './datos-scout.service';
import { DatosScoutController } from './datos-scout.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
  imports: [PrismaModule],
  controllers: [DatosScoutController],
  providers: [DatosScoutService, SelfScopePolicy, UnitPolicy, NodoPolicy],
})
export class DatosScoutModule { }
