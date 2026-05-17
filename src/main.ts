import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  // Set timezone to UTC+1 (e.g. West Africa Time) to fix 1-hour lag
  process.env.TZ = process.env.TZ || 'Africa/Lagos';
  
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', 1); // Trust the first proxy (e.g. Render)
  
  const configService = app.get(ConfigService);

  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Attendance Management System')
    .setDescription('Production-ready REST API for managing staff attendance, users, notifications, and reports.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'Staff user management (Admin only)')
    .addTag('Attendance', 'Attendance check-in/check-out')
    .addTag('Dashboard', 'Admin analytics dashboard')
    .addTag('Notifications', 'System notifications')
    .addTag('Reports', 'Attendance reports and exports')
    .addTag('Profile', 'Staff profile management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('port') || Number(process.env['PORT']) || 3000;

  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`Swagger docs available at /api/docs`);
}

bootstrap();
