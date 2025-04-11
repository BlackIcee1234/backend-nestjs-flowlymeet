import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomService } from './services/room.service';
import { RoomRepository } from './room.repository';
import { SignalRoutes } from './routes/signal.routes';
import { LoggerModule } from '../../common/logger/logger.module';
import { DatabaseModule } from '../../config/database.module';
import { RoomController } from './room.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthModule
  ],
  controllers: [RoomController],
  providers: [
    RoomGateway,
    RoomService,
    RoomRepository,
    SignalRoutes
  ],
  exports: [RoomService]
})
export class RoomModule {}