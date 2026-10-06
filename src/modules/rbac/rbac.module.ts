import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { RolesService } from './roles.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [RbacService, RolesService],
    controllers: [RbacController],
    exports: [RbacService, RolesService],
})
export class RbacModule { }
