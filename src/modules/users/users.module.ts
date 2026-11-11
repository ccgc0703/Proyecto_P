import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { NodoPolicy } from '../../common/policies/nodo.policy';

@Module({
    imports: [NotificacionesModule],
    providers: [UsersService, NodoPolicy],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule { }
