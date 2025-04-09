import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RoomModule } from '../room/room.module';
import { LoggerModule } from '../../common/logger/logger.module';
import { LoggerMiddleware } from '../../common/middleware/logger.middleware';
import { DatabaseModule } from '../../config/database.module';

@Module({
  imports: [
    AuthModule, 
    ConfigModule.forRoot({ isGlobal: true }), 
    RoomModule,
    LoggerModule,
    DatabaseModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}