import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomParticipant } from '../../../types/room.types';
import { RoomRepository } from '../room.repository';
import { validateRoomAccess } from '../../../utils/room.utils';

@Injectable()
export class RoomService {
  private rooms: Map<string, Map<string, RoomParticipant>> = new Map();
  constructor(private readonly roomRepository: RoomRepository) {}

  handleUserLeaveRooms(client: Socket, server: Server) {
    this.rooms.forEach((participants, room) => {
      if (participants.has(client.id)) {
        participants.delete(client.id);
        client.leave(room);
        if (participants.size === 0) {
          this.rooms.delete(room);
        } else {
          server.to(room).emit('user-disconnected', { userId: client.id });
        }
      }
    });
  }

  joinRoom(client: Socket, room: string, server: Server) {
    client.join(room);
    
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Map());
    }
    
    const participant: RoomParticipant = {
      id: client.id,
      hasVideo: false,
      hasAudio: false,
      isScreenSharing: false
    };
    
    this.rooms.get(room)?.set(client.id, participant);

    const participants = Array.from(this.rooms.get(room)?.values() || []);
    server.to(room).emit('user-joined', { 
      userId: client.id,
      participants
    });
  }

  leaveRoom(client: Socket, room: string, server: Server) {
    if (this.rooms.has(room)) {
      const participants = this.rooms.get(room);
      if (participants) {
        participants.delete(client.id);
      }
      client.leave(room);
      
      if (participants?.size === 0) {
        this.rooms.delete(room);
      } else {
        server.to(room).emit('user-left', { userId: client.id });
      }
    }
  }

  updateMediaState(client: Socket, room: string, hasVideo: boolean, hasAudio: boolean, server: Server) {
    const participants = this.rooms.get(room);
    const participant = participants?.get(client.id);
    
    if (participant) {
      participant.hasVideo = hasVideo;
      participant.hasAudio = hasAudio;
      
      server.to(room).emit('participant-media-change', {
        userId: client.id,
        hasVideo,
        hasAudio
      });
    }
  }

  updateScreenShareState(client: Socket, room: string, isSharing: boolean, server: Server) {
    const participants = this.rooms.get(room);
    const participant = participants?.get(client.id);
    
    if (participant) {
      participant.isScreenSharing = isSharing;
      server.to(room).emit(
        isSharing ? 'screen-share-started' : 'screen-share-stopped',
        { userId: client.id }
      );
    }
  }

  isParticipantInRoom(room: string, userId: string): boolean {
    return this.rooms.has(room) && this.rooms.get(room)?.has(userId) || false;
  }
  async createRoom(data: {
    id: string;
    name: string;
    ownerId: string;
    maxParticipants?: number;
  }) {
    return this.roomRepository.create(data);
  }

  async validateRoomAccess(roomId: string, userId: string) {
    return validateRoomAccess(roomId, userId, this.roomRepository);
  }

  async getRoomWithParticipants(roomId: string) {
    return this.roomRepository.findById(roomId);
  }

  async getRoomParticipantsCount(roomId: string) {
    return this.roomRepository.getRoomParticipantsCount(roomId);
  }

  async isRoomActive(roomId: string) {
    return this.roomRepository.isRoomActive(roomId);
  }
}