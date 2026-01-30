import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { static as expressStatic } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({ origin: true, credentials: true });
  // Serve uploaded files (avatars, etc.) at /uploads
  app.use('/uploads', expressStatic(join(process.cwd(), 'uploads')));
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`WriteSpace API running on http://localhost:${port}`);
}
bootstrap();
