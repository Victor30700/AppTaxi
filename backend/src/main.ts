import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`TaxiApp Backend escuchando en http://localhost:${port}/api/v1`);
}

void bootstrap();
