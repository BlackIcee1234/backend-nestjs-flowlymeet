import { Socket, Server } from 'socket.io';
import { SubscribeMessage } from '@nestjs/websockets';
import { Injectable, UseGuards } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { RoomValidationGuard } from '../../room/guards/room-validation.guard';

@Injectable()
export class RoomRoutes {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(RoomValidationGuard)
  @SubscribeMessage('join-room')
  async handleJoinRoom(client: Socket, server: Server, data: { room: string }) {
    const { room } = data;
    console.log('join-room', room);
    this.roomService.joinRoom(client, room, server);
  }

  // @UseGuards(RoomValidationGuard)
  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, server: Server, data: { room: string }) {
    const { room } = data;
    this.roomService.leaveRoom(client, room, server);
  }
}