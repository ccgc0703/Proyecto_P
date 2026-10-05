import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
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
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { ProgresionModule } from './modules/progresion/progresion.module';
import { OrganizacionModule } from './modules/organizacion/organizacion.module';

// Rate limit global por IP: 600 req/min por defecto. El login aplica su
// propio límite más estricto con @Throttle (ver AuthController).
// RATE_LIMIT_GLOBAL permite subir el límite en entornos de prueba/carga.
const RATE_GLOBAL = Number.parseInt(process.env.RATE_LIMIT_GLOBAL ?? '', 10);
const rateLimitGlobal = Number.isFinite(RATE_GLOBAL) && RATE_GLOBAL > 0 ? RATE_GLOBAL : 600;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // F4.6 · Jobs programados (retención del log de auditoría a las 03:00).
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: rateLimitGlobal }],
      errorMessage: 'Demasiadas solicitudes: inténtalo de nuevo en un minuto',
    }),
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
    CatalogoModule,
    ProgresionModule,
    OrganizacionModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }

