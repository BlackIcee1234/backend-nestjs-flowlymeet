import { 
  WebSocketGateway as WSGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from './services/room.service';
import { SignalRoutes } from './routes/signal.routes';
import { RoomValidationGuard } from './guards/room-validation.guard';
import { LoggerService } from '../../common/logger/logger.service';
import { 
  ROOM_EVENTS, 
  ROOM_ERRORS, 
  ROOM_MESSAGES, 
  WS_CONFIG 
} from './constants/room.constants';
import {
  RoomEventPayload,
  VideoEventPayload,
  BroadcastMessagePayload,
  isUserInRoom,
  getOtherUsersInRoom,
  createEventResponse,
  validateRoomPayload,
  createVideoStatePayload
} from './utils/room.utils';
import { getClientInfo } from './utils/room.utils';
import { RoomWsService } from './services/room.ws.service';
/**
 * Gateway for handling real-time room communication and WebRTC signaling
 */
@WSGateway(WS_CONFIG)
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly signalRoutes: SignalRoutes,
    private readonly logger: LoggerService,
    private readonly roomWsService: RoomWsService
  ) {
    this.logger.setContext('RoomGateway');
  }

  /**
   * Handles new WebSocket connections
   * @param client Socket client instance
   */
  async handleConnection(client: Socket) {   
    this.roomWsService.handleConnection(client);
    return client.emit(ROOM_EVENTS.CONNECTION_STATUS, createEventResponse('Connected', { 
      connected: true,
      clientId: client.id
    }));
  }

  /**
   * Handles client disconnections
   * @param client Socket client instance
   */
  handleDisconnect(client: Socket) {
    this.logger.logWebSocketEvent(client, 'disconnection');
    console.log(`Client disconnected: ${client.id}`);
    this.roomService.handleUserLeaveRooms(client, this.server);
    client.removeAllListeners();
  }

  /**
   * Handles room join requests
   * @param client Socket client instance
   * @param payload Room join payload
   */
  @UseGuards(RoomValidationGuard)
  @SubscribeMessage(ROOM_EVENTS.JOIN)
  handleJoinRoom(client: Socket, payload: RoomEventPayload) {
    if (!validateRoomPayload(payload)) {
      this.logger.warn('Invalid join room payload', { payload });
      client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.ROOM_REQUIRED });
      return;
    }

    const { roomCode } = payload;
    this.logger.logRoomEvent(roomCode, 'join', client.id);
    console.log('Joining room:', roomCode);
    this.roomService.joinRoom(client, roomCode, this.server);
    return createEventResponse(ROOM_MESSAGES.JOINED, { roomCode });
  }

  /**
   * Handles room leave requests
   * @param client Socket client instance
   * @param payload Room leave payload
   */
  @UseGuards(RoomValidationGuard)
  @SubscribeMessage(ROOM_EVENTS.LEAVE)
  handleLeaveRoom(client: Socket, payload: RoomEventPayload) {
    if (!validateRoomPayload(payload)) {
      this.logger.warn('Invalid leave room payload', { payload });
      client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.ROOM_REQUIRED });
      return;
    }

    const { roomCode } = payload;
    this.logger.logRoomEvent(roomCode, 'leave', client.id);
    console.log('Leaving room:', roomCode);
    this.roomService.leaveRoom(client, roomCode, this.server);
    return createEventResponse(ROOM_MESSAGES.LEFT, { roomCode });
  }

  /**
   * Handles broadcast messages in a room
   * @param client Socket client instance
   * @param payload Broadcast message payload
   */
  @UseGuards(RoomValidationGuard)
  @SubscribeMessage(ROOM_EVENTS.BROADCAST)
  handleBroadcastMessage(client: Socket, payload: BroadcastMessagePayload) {
    const { roomCode, message } = payload;

    this.logger.logRoomEvent(roomCode, 'Broadcast message', client.id, { payload });
    this.signalRoutes.handleBroadcastMessage(client, this.server, payload);
    return createEventResponse(ROOM_MESSAGES.MESSAGE_SENT, { roomCode });  
  }

  /**
   * Handles video sharing requests
   * @param client Socket client instance
   * @param payload Video share payload
   */
  @UseGuards(RoomValidationGuard)
  @SubscribeMessage(ROOM_EVENTS.VIDEO_SHARE)
  async handleVideoShare(client: Socket, payload: VideoEventPayload) {
    if (!validateRoomPayload(payload)) {
      this.logger.warn('Invalid video share payload', { payload });
      client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.ROOM_REQUIRED });
      return;
    }

    const { roomCode, videoEnabled, sdpOffer } = payload;

    if (true) {
      const otherUsers = getOtherUsersInRoom(this.server, roomCode, client.id);
      
      client.to(roomCode).emit('video-offer', createEventResponse('Video offer received', {
        userId: client.id,
        sdpOffer
      }));

      client.emit('existing-users', createEventResponse('Existing users', {
        users: otherUsers
      }));
    } else {
      client.to(roomCode).emit('video-close', createEventResponse('Video closed', {
        userId: client.id
      }));
    }

    client.to(roomCode).emit(ROOM_EVENTS.VIDEO_STATE, 
      createVideoStatePayload(client.id, videoEnabled, roomCode)
    );

    this.logger.logRoomEvent(roomCode, 'video-share', client.id, { videoEnabled });

    console.log(`User ${client.id} ${videoEnabled ? 'started' : 'stopped'} video sharing in room:`, roomCode);

    return createEventResponse(
      videoEnabled ? ROOM_MESSAGES.VIDEO_ENABLED : ROOM_MESSAGES.VIDEO_DISABLED,
      { roomCode, userId: client.id, videoEnabled }
    );
  }

  /**
   * Handles video answer responses
   * @param client Socket client instance
   * @param payload Video answer payload
   */
  @UseGuards(RoomValidationGuard)
  @SubscribeMessage(ROOM_EVENTS.VIDEO_ANSWER)
  async handleVideoAnswer(client: Socket, payload: VideoEventPayload) {
    const { roomCode, targetUserId, sdpAnswer } = payload;

    client.to(targetUserId!).emit('video-answer-received', createEventResponse('Video answer received', {
      userId: client.id,
      sdpAnswer
    }));

    this.logger.logRoomEvent(roomCode, 'video-answer', client.id, { targetUserId });

    console.log(`User ${client.id} sent video answer to ${targetUserId} in room:`, roomCode);

    return createEventResponse(ROOM_MESSAGES.VIDEO_ANSWER_SENT, {
      roomCode,
      targetUserId
    });
  }

  /**
   * Handles ICE candidate exchanges
   * @param client Socket client instance
   * @param payload ICE candidate payload
   */
  @UseGuards(RoomValidationGuard)
  @SubscribeMessage(ROOM_EVENTS.ICE_CANDIDATE)
  async handleIceCandidate(client: Socket, payload: VideoEventPayload) {
    const { roomCode, targetUserId, candidate } = payload;
    console.log('payload', payload);

    this.logger.logRoomEvent(roomCode, 'ice-candidate', client.id, { targetUserId });

    return createEventResponse(ROOM_MESSAGES.ICE_CANDIDATE_SENT, {
      roomCode,
      targetUserId
    });
  }
}