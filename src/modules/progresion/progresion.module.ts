import { Module } from '@nestjs/common';
import { ProgresionService } from './progresion.service';
import { ExportService } from './export.service';
import { ProgresionController } from './progresion.controller';
import { UnitAccessPolicy } from '../../common/policies/unit-access.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';

@Module({
    providers: [ProgresionService, ExportService, UnitAccessPolicy, NodoPolicy, SelfScopePolicy],
    controllers: [ProgresionController],
    exports: [ProgresionService, ExportService],
})
export class ProgresionModule { }
