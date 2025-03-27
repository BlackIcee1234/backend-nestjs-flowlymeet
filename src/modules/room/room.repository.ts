import { Injectable } from '@nestjs/common';
import { DatabaseConfig } from '../../config/database.config';

@Injectable()
export class RoomRepository {
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
    return this.dbConfig.getPrisma().room.create({
      data: {
        ...data,
        participants: {
          connect: [{ id: data.ownerId }]
        }
      },
      include: { participants: true, owner: true }
    });
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
}