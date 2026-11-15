import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaxiApp Multi-tenant API')
    .setDescription(
      'API REST Multi-tenant para SuperAdmin, Radiotaxis, Conductores y Pasajeros',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      name: 'x-tenant-id',
      in: 'header',
      required: false,
      description: 'ID del Tenant activo (Radiotaxi/Empresa)',
      schema: { type: 'string' },
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`TaxiApp Backend escuchando en http://localhost:${port}/api/v1`);
  console.log(`Swagger UI disponible en http://localhost:${port}/docs`);
}

void bootstrap();
