import { Module } from '@nestjs/common';
import { JovenesService } from './jovenes.service';
import { JovenesController } from './jovenes.controller';
import { UnitPolicy } from '../../common/policies/unit.policy';

@Module({
    providers: [JovenesService, UnitPolicy],
    controllers: [JovenesController],
    exports: [JovenesService],
})
export class JovenesModule { }

