import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [RbacService, RolesService],
    controllers: [RbacController, RolesController],
    exports: [RbacService, RolesService],
})
export class RbacModule { }
