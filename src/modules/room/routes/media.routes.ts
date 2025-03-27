import { Socket, Server } from 'socket.io';
import { SubscribeMessage } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { RoomService } from '../services/room.service';

@Injectable()
export class MediaRoutes {
  constructor(private readonly roomService: RoomService) {}

  @SubscribeMessage('media-state-change')
  handleMediaStateChange(client: Socket, server: Server, data: { 
    room: string;
    hasVideo: boolean;
    hasAudio: boolean;
  }) {
    const { room, hasVideo, hasAudio } = data;
    this.roomService.updateMediaState(client, room, hasVideo, hasAudio, server);
  }

  @SubscribeMessage('start-screen-share')
  handleStartScreenShare(client: Socket, server: Server, data: { room: string }) {
    const { room } = data;
    this.roomService.updateScreenShareState(client, room, true, server);
  }

  @SubscribeMessage('stop-screen-share')
  handleStopScreenShare(client: Socket, server: Server, data: { room: string }) {
    const { room } = data;
    this.roomService.updateScreenShareState(client, room, false, server);
  }
}