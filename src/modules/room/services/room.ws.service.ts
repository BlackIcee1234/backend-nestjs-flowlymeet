import { Injectable } from "@nestjs/common";
import { ROOM_EVENTS } from "../constants/room.constants";
import { createEventResponse } from "../utils/room.utils";
import { getClientInfo } from "../utils/room.utils";
import { RoomService } from "./room.service";
import { Socket } from "socket.io";
import { LoggerService } from "../../../common/logger/logger.service";

export interface ClientInfo {
    id: string;
    handshake: {
      address: string;
      time: string;
      query: any;
      headers: {
        origin: string;
        userAgent: string;
      };
    };
}

@Injectable()
export class RoomWsService {
  constructor(private readonly roomService: RoomService, private readonly logger: LoggerService) {}


  async handleConnection(client: Socket): Promise<ClientInfo> {
    const clientInfo = getClientInfo(client);
    this.logger.logWebSocketEvent(client, 'New client connected:', clientInfo);
    return clientInfo;
  }

  async handleDisconnect(client: Socket) {
    this.logger.logWebSocketEvent(client, 'disconnection');
    console.log(`Client disconnected: ${client.id}`);
    this.roomService.handleUserLeaveRooms(client, this.server);
  }
}
