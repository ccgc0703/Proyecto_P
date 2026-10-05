import { Module } from '@nestjs/common';
import { AdministrativoService } from './administrativo.service';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';
import { AdministrativoController } from './administrativo.controller';

@Module({
    providers: [AdministrativoService, SelfScopePolicy],
    controllers: [AdministrativoController],
    exports: [AdministrativoService],
})
export class AdministrativoModule { }
