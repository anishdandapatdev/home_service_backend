import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Global API Prefix
  app.setGlobalPrefix('api/v1');

  // 2. Security Middleware (Helmet + CORS)
  app.use(helmet());

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // 3. Global Input Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. OpenAPI / Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Home Maintenance Membership Platform API')
    .setDescription(
      'REST API powering Customer App (Flutter), Technician App (Flutter), Admin Panel (React), and Public Website.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'OTP authentication, JWT tokens & technician/admin logins')
    .addTag('Users', 'Customer profile & address management')
    .addTag('Membership Plans', 'Public tier catalog & admin pricing management')
    .addTag('Memberships', 'Subscription purchase, confirmation & renewal')
    .addTag('Inspections', 'Preventive home inspection auto-scheduling & reports')
    .addTag('Service Requests', 'Customer repair requests & technician job execution')
    .addTag('Technician Jobs', 'Field technician daily queue, photo upload, and digital sign-off')
    .addTag('Spare Parts Approval', 'Technician spare parts estimation & customer approval')
    .addTag('Invoices', 'Labour covered billing & tax invoices')
    .addTag('Payments', 'Razorpay payment orders & webhooks')
    .addTag('Rewards Program', 'No-waste reward points, catalog & voucher redemption')
    .addTag('Complaints', 'Customer complaint submission & admin resolution queue')
    .addTag('Admin Panel', 'Dashboard metrics, customer/tech management & reports')
    .addTag('Public Website Endpoints', 'Service catalog, leads & service area info')
    .addTag('Uploads', 'S3 file uploads & presigned URLs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`===========================================================`);
  logger.log(`🚀 Home Maintenance Backend Server running on port ${port}`);
  logger.log(`📚 Swagger available at /api/docs`);
  logger.log(`===========================================================`);
}

bootstrap();
