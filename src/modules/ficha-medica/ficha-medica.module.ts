import { Module } from '@nestjs/common';
import { FichaMedicaService } from './ficha-medica.service';
import { FichaMedicaController } from './ficha-medica.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FichaMedicaController],
    providers: [FichaMedicaService],
    exports: [FichaMedicaService],
})
export class FichaMedicaModule {}
