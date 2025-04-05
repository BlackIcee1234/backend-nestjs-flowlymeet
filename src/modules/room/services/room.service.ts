import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomParticipant, Room } from '../../../types/room.types';
import { RoomRepository } from '../room.repository';
import { validateRoomAccess, createRoomId } from '../../../utils/room.utils';
import { createEventResponse } from '../utils/room.utils';
import { ROOM_EVENTS, ROOM_MESSAGES } from '../constants/room.constants';

@Injectable()
export class RoomService {
  private rooms: Map<string, Map<string, RoomParticipant>> = new Map();

  constructor(private readonly roomRepository: RoomRepository) {}

  /**
   * Gets room information
   * @param roomId Room identifier
   * @returns Room information or null if not found
   */
  async getRoomInfo(roomId: string): Promise<Room | null> {
    return this.roomRepository.getRoom(roomId);
  }

  /**
   * Creates a new room
   * @param roomId Room identifier
   * @param creatorId Creator's user ID
   * @param name Room name
   * @param maxParticipants Maximum number of participants
   * @returns Created room information
   */
  async createRoom(
    roomId: string,
    creatorId: string,
    name: string,
    maxParticipants: number = 10
  ): Promise<Room> {
    const room = await this.roomRepository.create({
      id: roomId,
      name,
      ownerId: creatorId,
      maxParticipants
    });

    if (!room) {
      throw new Error('Failed to create room');
    }

    // Convert Prisma room to our Room type
    return {
      id: room.id,
      name: room.name,
      createdBy: room.createdBy || '',
      maxParticipants: room.maxParticipants,
      isActive: room.isActive,
      participants: room.participants.map(p => p.userId),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
    };
  }

  /**
   * Joins a room
   * @param client Socket client instance
   * @param roomId Room identifier
   * @param server Socket.io server instance
   */
  async joinRoom(client: Socket, roomId: string, server: Server): Promise<void> {
    // const validation = await validateRoomAccess(roomId, client.id, this.roomRepository);
    // if (!validation.isValid) {
    //   client.emit(ROOM_EVENTS.ERROR, { message: validation.error });
    //   return;
    // }

    // const room = await this.roomRepository.addParticipant(roomId, client.id);
    // if (!room) {
    //   client.emit(ROOM_EVENTS.ERROR, { message: 'Failed to join room' });
    //   return;
    // }

    await client.join(roomId);
    client.to(roomId).emit(ROOM_EVENTS.USER_JOINED, createEventResponse('User joined', {
      userId: client.id,
      roomId
    }));
  }

  /**
   * Leaves a room
   * @param client Socket client instance
   * @param roomId Room identifier
   * @param server Socket.io server instance
   */
  async leaveRoom(client: Socket, roomId: string, server: Server): Promise<void> {
    const room = await this.roomRepository.removeParticipant(roomId, client.id);
    if (!room) {
      client.emit(ROOM_EVENTS.ERROR, { message: 'Failed to leave room' });
      return;
    }

    await client.leave(roomId);
    client.to(roomId).emit(ROOM_EVENTS.USER_LEFT, createEventResponse('User left', {
      userId: client.id,
      roomId
    }));

    // If room is empty, delete it
    if (room.participants.length === 0) {
      await this.roomRepository.deleteRoom(roomId);
    }
  }

  /**
   * Handles user leaving all rooms
   * @param client Socket client instance
   * @param server Socket.io server instance
   */
  async handleUserLeaveRooms(client: Socket, server: Server): Promise<void> {
    const rooms = Array.from(client.rooms);
    for (const roomId of rooms) {
      if (roomId !== client.id) { // Skip the default room (socket ID)
        await this.leaveRoom(client, roomId, server);
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