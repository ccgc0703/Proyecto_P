import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
    providers: [DashboardService, UnitPolicy, NodoPolicy],
    controllers: [DashboardController],
})
export class DashboardModule { }
