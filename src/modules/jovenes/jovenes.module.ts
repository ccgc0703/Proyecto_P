import { Module } from '@nestjs/common';
import { JovenesService } from './jovenes.service';
import { JovenesController } from './jovenes.controller';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { UnitAccessPolicy } from '../../common/policies/unit-access.policy';
import { NodoPolicy } from '../../common/policies/nodo.policy';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    providers: [JovenesService, UnitPolicy, UnitAccessPolicy, NodoPolicy, SelfScopePolicy],
    controllers: [JovenesController],
    exports: [JovenesService],
})
export class JovenesModule { }

