import { Module } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { EventosController } from './eventos.controller';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
    providers: [EventosService, UnitPolicy, NodoPolicy],
    controllers: [EventosController],
    exports: [EventosService],
})
export class EventosModule { }
