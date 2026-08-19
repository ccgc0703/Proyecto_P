import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UnidadesModule } from './modules/unidades/unidades.module';
import { JovenesModule } from './modules/jovenes/jovenes.module';
import { AdministrativoModule } from './modules/administrativo/administrativo.module';
import { ScoutModule } from './modules/scout/scout.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AuditModule } from './modules/audit/audit.module';
import { FichaMedicaModule } from './modules/ficha-medica/ficha-medica.module';
import { AdultosModule } from './modules/adultos/adultos.module';
import { DatosScoutModule } from './modules/datos-scout/datos-scout.module';
import { FormacionModule } from './modules/formacion/formacion.module';
import { ProgramasMundialesModule } from './modules/programas-mundiales/programas-mundiales.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    UnidadesModule,
    JovenesModule,
    AdministrativoModule,
    ScoutModule,
    RbacModule,
    FichaMedicaModule,
    AdultosModule,
    DatosScoutModule,
    FormacionModule,
    ProgramasMundialesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

