import { Socket, Server } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { validateRoomAccess } from 'src/utils/room.utils';
import { RoomRepository } from 'src/modules/room/room.repository';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class RoomValidationGuard implements CanActivate {
  constructor(private readonly roomRepository: RoomRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      if (!client)
        throw new WsException('Invalid client');
      const data = context.switchToWs().getData();
      if(!data)
        throw new WsException('Invalid data');
      // if (!data.room)
      //   throw new WsException('Invalid room');
      // const { isValid, error } = await validateRoomAccess(
      //   room,
      //   client.id,
      //   this.roomRepository,
      // );
      // if (!isValid && error) {
      //   throw new WsException(error);
      // }
      // return Boolean(isValid);
      return data;
    } catch (ex) {
      throw new WsException(ex.message);
    }
  }
}
