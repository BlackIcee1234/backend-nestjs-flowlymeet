import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomService } from './services/room.service';
import { RoomRoutes } from './routes/room.routes';
import { MediaRoutes } from './routes/media.routes';
import { SignalRoutes } from './routes/signal.routes';
import { RoomRepository } from './room.repository';
import { DatabaseConfig } from '../../config/database.config';

@Module({
  providers: [
    RoomGateway,
    RoomService,
    RoomRoutes,
    MediaRoutes,
    SignalRoutes,
    RoomRepository,
    DatabaseConfig
  ]
})
export class RoomModule {}