import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  
  // Enable CORS for all environments
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://flowlymeet.com' 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Set swagger for production
  const config = new DocumentBuilder()
    .setTitle('FlowlyMeet API')
    .setDescription('API documentation for FlowlyMeet')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Set global validation for production
  if (process.env.NODE_ENV === 'production') {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
  }

  const port = process.env.PORT || 2000;
  await app.listen(port, '0.0.0.0', () => {
    if (process.env.NODE_ENV === 'production') {
      logger.log(`Application is running on: https://api.flowlymeet.com`);
      logger.log(`Swagger documentation available at: https://api.flowlymeet.com/api`);
    } else {
      logger.log(`Application is running on: http://0.0.0.0:${port}`);
      logger.log(`Swagger documentation available at: http://0.0.0.0:${port}/api`);
    }
  });
}
bootstrap();
