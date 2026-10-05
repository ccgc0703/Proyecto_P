import { Module } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { UnidadesController } from './unidades.controller';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
    providers: [UnidadesService, UnitPolicy, NodoPolicy],
    controllers: [UnidadesController],
    exports: [UnidadesService],
})
export class UnidadesModule { }
