import { Module } from '@nestjs/common';
import { FichaMedicaService } from './ficha-medica.service';
import { FichaMedicaController } from './ficha-medica.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';

@Module({
    imports: [PrismaModule],
    controllers: [FichaMedicaController],
    providers: [FichaMedicaService, SelfScopePolicy],
    exports: [FichaMedicaService],
})
export class FichaMedicaModule {}
