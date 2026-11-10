import { Module } from '@nestjs/common';
import { ProgramasMundialesService } from './programas-mundiales.service';
import { ProgramasMundialesController } from './programas-mundiales.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
  imports: [PrismaModule],
  controllers: [ProgramasMundialesController],
  providers: [ProgramasMundialesService, SelfScopePolicy, UnitPolicy, NodoPolicy],
})
export class ProgramasMundialesModule {}
