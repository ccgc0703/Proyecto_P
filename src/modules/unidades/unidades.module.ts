import { Module } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { UnidadesController } from './unidades.controller';
import { UnitPolicy } from '../../common/policies/unit.policy';

@Module({
    providers: [UnidadesService, UnitPolicy],
    controllers: [UnidadesController],
    exports: [UnidadesService],
})
export class UnidadesModule { }
