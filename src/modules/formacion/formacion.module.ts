import { Module } from '@nestjs/common';
import { FormacionService } from './formacion.service';
import { FormacionController } from './formacion.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
  imports: [PrismaModule],
  controllers: [FormacionController],
  providers: [FormacionService, SelfScopePolicy, UnitPolicy, NodoPolicy],
})
export class FormacionModule { }
