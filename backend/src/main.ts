import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { static as expressStatic } from 'express';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable compression for all responses
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({ origin: true, credentials: true });

  // Serve uploaded files with long-term caching
  app.use(
    '/uploads',
    expressStatic(join(process.cwd(), 'uploads'), {
      maxAge: '365d',
      immutable: true,
      etag: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`WriteSpace API running on http://localhost:${port}`);
}
bootstrap();
