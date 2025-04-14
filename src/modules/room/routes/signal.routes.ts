import { Socket, Server } from 'socket.io';
import { SubscribeMessage } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { RoomService } from '../services/room.service';

@Injectable()
export class SignalRoutes {
  constructor(private readonly roomService: RoomService) {}

  @SubscribeMessage('signal')
  handleSignal(client: Socket, server: Server, data: { 
    room: string; 
    to: string; 
    signal: any;
    type: 'video' | 'screen' | 'audio';
  }) {
    const { room, to, signal, type } = data;
    if (this.roomService.isParticipantInRoom(room, to)) {
      server.to(to).emit('signal', {
        from: client.id,
        signal,
        type
      });
    }
  }

  @SubscribeMessage('broadcast-message')
  handleBroadcastMessage(client: Socket, server: Server, data: { roomCode: string; message: any }) {
    const { roomCode, message } = data;
    if (this.roomService.isParticipantInRoom(roomCode, client.id)) {
        server.to(roomCode).emit('message', {
        from: client.id,
        message: message,
        timestamp: new Date().toISOString()
      });
    }
  }
}