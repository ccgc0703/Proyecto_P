import { Module } from '@nestjs/common';
import { NormativaService } from './normativa.service';
import { NormativaController } from './normativa.controller';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
    controllers: [NormativaController],
    providers: [NormativaService, UnitPolicy, NodoPolicy],
    exports: [NormativaService],
})
export class NormativaModule { }
