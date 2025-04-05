import { Injectable } from '@nestjs/common';
import { DatabaseConfig } from '../../config/database.config';
import { Room } from '../../types/room.types';

@Injectable()
export class RoomRepository {
  private rooms: Map<string, Room> = new Map();

  constructor(private readonly dbConfig: DatabaseConfig) {}

  async findById(roomId: string) {
    return this.dbConfig.getPrisma().room.findUnique({
      where: { id: roomId },
      include: { participants: true, owner: true }
    });
  }

  async findByIdWithParticipant(roomId: string, userId: string) {
    return this.dbConfig.getPrisma().room.findFirst({
      where: {
        id: roomId,
        participants: {
          some: { id: userId }
        }
      }
    });
  }

  async create(data: {
    id: string;
    name: string;
    ownerId: string;
    maxParticipants?: number;
  }) {
    const room: Room = {
      id: data.id,
      name: data.name,
      ownerId: data.ownerId,
      maxParticipants: data.maxParticipants || 10,
      isActive: true,
      participants: [data.ownerId],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.rooms.set(data.id, room);
    return room;
  }

  async getRoomParticipantsCount(roomId: string) {
    const room = await this.dbConfig.getPrisma().room.findUnique({
      where: { id: roomId },
      include: { _count: { select: { participants: true } } }
    });
    return room?._count.participants ?? 0;
  }

  async isRoomActive(roomId: string) {
    const room = await this.findById(roomId);
    return room?.isActive ?? false;
  }

  /**
   * Creates a new room
   * @param roomId Room identifier
   * @param creatorId Creator's user ID
   */
  async createRoom(roomId: string, creatorId: string): Promise<void> {
    const room: Room = {
      id: roomId,
      name: '',
      ownerId: creatorId,
      maxParticipants: 10,
      isActive: true,
      participants: [creatorId],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rooms.set(roomId, room);
  }

  /**
   * Deletes a room
   * @param roomId Room identifier
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    return this.rooms.delete(roomId);
  }

  /**
   * Gets room information
   * @param roomId Room identifier
   * @returns Room information or undefined if not found
   */
  async getRoom(roomId: string): Promise<Room | null> {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Updates room information
   * @param roomId Room identifier
   * @param data Partial room information to update
   * @returns Updated room information or null if room not found
   */
  async updateRoom(roomId: string, data: Partial<Room>): Promise<Room | null> {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const updatedRoom = {
      ...room,
      ...data,
      updatedAt: new Date()
    };

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  /**
   * Adds a participant to a room
   * @param roomId Room identifier
   * @param userId Participant's user ID
   * @returns Updated room information or null if room not found or participant already exists
   */
  async addParticipant(roomId: string, userId: string): Promise<Room | null> {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.participants.includes(userId)) {
      return room;
    }

    if (room.participants.length >= room.maxParticipants) {
      return null;
    }

    const updatedRoom = {
      ...room,
      participants: [...room.participants, userId],
      updatedAt: new Date()
    };

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  /**
   * Removes a participant from a room
   * @param roomId Room identifier
   * @param userId Participant's user ID
   * @returns Updated room information or null if room not found
   */
  async removeParticipant(roomId: string, userId: string): Promise<Room | null> {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const updatedRoom = {
      ...room,
      participants: room.participants.filter(id => id !== userId),
      updatedAt: new Date()
    };

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  /**
   * Checks if a user is in a room
   * @param roomId Room identifier
   * @param userId User ID
   * @returns boolean indicating if user is in room
   */
  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    return room?.participants.includes(userId) || false;
  }
}