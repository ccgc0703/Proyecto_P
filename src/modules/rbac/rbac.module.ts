import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { RolesService } from './roles.service';
import { AuthModule } from '../auth/auth.module';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
    imports: [AuthModule],
    providers: [RbacService, RolesService, NodoPolicy],
    controllers: [RbacController],
    exports: [RbacService, RolesService],
})
export class RbacModule { }
