import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { RoomValidationGuard } from '../guards/room-validation.guard';
import { LoggerService } from '../../../common/logger/logger.service';
import { createRoomId } from '../../../utils/room.utils';
import { ROOM_ERRORS } from '../constants/room.constants';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';

interface CreateRoomDto {
  name: string;
  maxParticipants?: number;
}

@Controller('rooms')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext('RoomController');
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(200)
  async createRoom(@Request() req, @Body() payload: CreateRoomDto) {
    this.logger.log('Received request to create room', { user: req.user, payload });

    const userId = req.user.id;
    this.logger.log(`User ID extracted: ${userId}`);

    try {
      const roomCode = createRoomId();
      this.logger.log(`Generated room code: ${roomCode}`);

      const room = await this.roomService.createRoom(
        roomCode,
        userId,
        payload.name,
        payload.maxParticipants
      );

      this.logger.logRoomEvent(roomCode, 'create', userId);
      this.logger.log(`Room created successfully: ${JSON.stringify(room)}`);

      return {
        success: true,
        room: {
          id: roomCode,
          name: payload.name,
          maxParticipants: payload.maxParticipants
        }
      };
    } catch (error) {
      this.logger.error('Failed to create room: ' + error.message);
      throw new HttpException(ROOM_ERRORS.ROOM_CREATION_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 