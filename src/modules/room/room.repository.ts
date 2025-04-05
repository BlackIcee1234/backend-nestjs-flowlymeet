import { Injectable } from '@nestjs/common';
import { DatabaseConfig } from '../../config/database.config';
import { Room } from '../../types/room.types';
import { createRoomId } from '../../utils/room.utils';

@Injectable()
export class RoomRepository {
  constructor(private readonly dbConfig: DatabaseConfig) {}

  async findById(roomId: string) {
    return this.dbConfig.getPrisma().room.findUnique({
      where: { code: roomId },
      include: { participants: true, creator: true }
    });
  }

  async findByIdWithParticipant(roomId: string, userId: string) {
    return this.dbConfig.getPrisma().room.findFirst({
      where: {
        code: roomId,
        participants: {
          some: { userId: userId }
        }
      }
    });
  }

  async create(data: {
    id?: string;
    name: string;
    ownerId: string;
    maxParticipants?: number;
  }) {
    const roomCode = data.id || createRoomId();
    
    return this.dbConfig.getPrisma().room.create({
      data: {
        code: roomCode,
        name: data.name,
        createdBy: data.ownerId,
        maxParticipants: data.maxParticipants || 10,
        isActive: true,
        participants: {
          create: {
            userId: data.ownerId,
            isActive: true
          }
        }
      },
      include: {
        participants: true,
        creator: true
      }
    });
  }

  async getRoomParticipantsCount(roomId: string) {
    const room = await this.dbConfig.getPrisma().room.findUnique({
      where: { code: roomId },
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
  async createRoom(roomId: string, creatorId: string, name: string = '', maxParticipants: number = 10): Promise<void> {
    await this.dbConfig.getPrisma().room.create({
      data: {
        code: roomId,
        name,
        createdBy: creatorId,
        maxParticipants,
        isActive: true,
        participants: {
          create: {
            userId: creatorId,
            isActive: true
          }
        }
      }
    });
  }

  /**
   * Deletes a room
   * @param roomId Room identifier
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      await this.dbConfig.getPrisma().room.delete({
        where: { code: roomId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets room information
   * @param roomId Room identifier
   * @returns Room information or undefined if not found
   */
  async getRoom(roomId: string): Promise<Room | null> {
    const room = await this.findById(roomId);
    if (!room) return null;

    return {
      id: room.code,
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
   * Updates room information
   * @param roomId Room identifier
   * @param data Partial room information to update
   * @returns Updated room information or null if room not found
   */
  async updateRoom(roomId: string, data: Partial<Room>): Promise<Room | null> {
    const updatedRoom = await this.dbConfig.getPrisma().room.update({
      where: { code: roomId },
      data: {
        name: data.name,
        maxParticipants: data.maxParticipants,
        isActive: data.isActive,
        updatedAt: new Date()
      },
      include: {
        participants: true,
        creator: true
      }
    });

    if (!updatedRoom) return null;

    return {
      id: updatedRoom.code,
      name: updatedRoom.name,
      createdBy: updatedRoom.createdBy || '',
      maxParticipants: updatedRoom.maxParticipants,
      isActive: updatedRoom.isActive,
      participants: updatedRoom.participants.map(p => p.userId),
      createdAt: updatedRoom.createdAt,
      updatedAt: updatedRoom.updatedAt
    };
  }

  /**
   * Adds a participant to a room
   * @param roomId Room identifier
   * @param userId Participant's user ID
   * @returns Updated room information or null if room not found or participant already exists
   */
  async addParticipant(roomId: string, userId: string): Promise<Room | null> {
    try {
      const room = await this.dbConfig.getPrisma().room.update({
        where: { code: roomId },
        data: {
          participants: {
            create: {
              userId: userId,
              isActive: true
            }
          }
        },
        include: {
          participants: true,
          creator: true
        }
      });

      return {
        id: room.code,
        name: room.name,
        createdBy: room.createdBy || '',
        maxParticipants: room.maxParticipants,
        isActive: room.isActive,
        participants: room.participants.map(p => p.userId),
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Removes a participant from a room
   * @param roomId Room identifier
   * @param userId Participant's user ID
   * @returns Updated room information or null if room not found
   */
  async removeParticipant(roomId: string, userId: string): Promise<Room | null> {
    try {
      const room = await this.dbConfig.getPrisma().room.findUnique({
        where: { code: roomId },
        include: { participants: true }
      });

      if (!room) return null;

      await this.dbConfig.getPrisma().roomParticipant.updateMany({
        where: {
          roomId: room.id,
          userId: userId
        },
        data: {
          isActive: false,
          leftAt: new Date()
        }
      });

      return this.getRoom(roomId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks if a user is in a room
   * @param roomId Room identifier
   * @param userId User ID
   * @returns boolean indicating if user is in room
   */
  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await this.dbConfig.getPrisma().room.findUnique({
      where: { code: roomId },
      include: {
        participants: {
          where: {
            userId: userId,
            isActive: true
          }
        }
      }
    });
    return (room?.participants.length ?? 0) > 0;
  }
}