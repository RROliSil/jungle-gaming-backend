import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { AppModule } from './app.module';
import { startEmbeddedPostgresIfNeeded } from './database/embedded-postgres';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 1. Inicia o PostgreSQL embutido caso USE_EMBEDDED_POSTGRES=true
  await startEmbeddedPostgresIfNeeded();

  // 2. Cria a aplicação NestJS
  const app = await NestFactory.create(AppModule);

  // 3. Habilita CORS e validação global de DTOs (class-validator)
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT || 3333);
  await app.listen(port);
  logger.log(`🚀 Servidor Jungle Gaming rodando em: http://localhost:${port}`);
  logger.log(`🩺 Healthcheck do Banco: http://localhost:${port}/health`);
}

bootstrap();
