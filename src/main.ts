// DEBE ser el primer import: carga .env antes de que se evalúen los módulos.
// Si no, constantes.ts leería un process.env vacío y firmaría los JWT con un
// secreto por defecto en lugar del definido en .env.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

// Arranque con entorno validado: sin JWT_SECRET el servicio no debe subir.
function validarEntorno(): void {
  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length === 0) {
    console.error(
      '[FATAL] Falta JWT_SECRET. Define la variable en .env (ver .env.example); ' +
        'el servicio no puede firmar ni validar tokens sin ella.',
    );
    process.exit(1);
  }
  if (secret.length < 32) {
    console.warn(
      `[AVISO] JWT_SECRET tiene ${secret.length} caracteres (< 32). ` +
        'Recomendado: claves aleatorias de 32+ caracteres (p.ej. `openssl rand -base64 48`).',
    );
  }
}

async function bootstrap() {
  validarEntorno();
  const app = await NestFactory.create(AppModule);

  // Configuración global
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // F4.5 · Seguridad de cabeceras HTTP (API JSON: sin CSP/COEP).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Habilitar CORS para el frontend
  app.enableCors();

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
