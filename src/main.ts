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
  await app.listen(process.env.PORT ?? 2000);
}
bootstrap();
