import { Module } from '@nestjs/common';
import { ProgramasMundialesService } from './programas-mundiales.service';
import { ProgramasMundialesController } from './programas-mundiales.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgramasMundialesController],
  providers: [ProgramasMundialesService]
})
export class ProgramasMundialesModule {}
