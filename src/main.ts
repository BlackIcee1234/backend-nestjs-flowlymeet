import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { setupSwagger } from './swagger/config';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      timestamp: true,
      json: true,
      colors: true,
      prefix: 'FlowlyMeet',
      logLevels: ['debug', 'log', 'warn', 'error', 'verbose'],
    }),
  });
  
  setupSwagger(app);
  
  // Enable CORS
  app.enableCors();
  
  // Get port from environment variable or use default
  const port = process.env.PORT || 3000;
  
  // Listen on all network interfaces
  await app.listen(port, '0.0.0.0');
}
bootstrap();
