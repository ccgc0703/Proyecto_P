import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { ProgresionModule } from '../progresion/progresion.module';
import { EventosModule } from '../eventos/eventos.module';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';

/**
 * Módulo de exportación PDF (Fase 7a). Reutiliza los servicios de
 * progresión y eventos para no duplicar la lógica de ABAC: el PDF sólo
 * formatea los mismos datos que ya devuelve cada endpoint de lectura.
 */
@Module({
    imports: [ProgresionModule, EventosModule],
    controllers: [PdfController],
    providers: [PdfService, UnitPolicy, NodoPolicy, SelfScopePolicy],
})
export class PdfModule { }
