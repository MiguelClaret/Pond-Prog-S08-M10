import { NestFactory } from '@nestjs/core';
import { loadEnvFile } from 'node:process';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    loadEnvFile();
  } catch {}

  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EntreSessoes API')
    .setDescription('API backend do projeto EntreSessoes')
    .setVersion('1.0')
    .addTag('auth')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
