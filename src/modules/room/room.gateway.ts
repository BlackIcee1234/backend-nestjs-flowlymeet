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
import { createRoomId } from '../../utils/room.utils';

/**
 * Gateway for handling real-time room communication and WebRTC signaling
 */
@WSGateway(WS_CONFIG)
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly signalRoutes: SignalRoutes,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext('RoomGateway');
  }

  /**
   * Handles new WebSocket connections
   * @param client Socket client instance
   */
  async handleConnection(client: Socket) {
    this.logger.logWebSocketEvent(client, 'connection');
    
    const clientInfo = {
      id: client.id,
      handshake: {
        address: client.handshake.address,
        time: client.handshake.time,
        query: client.handshake.query,
        headers: {
          origin: client.handshake.headers.origin,
          userAgent: client.handshake.headers['user-agent']
        }
      }
    };
    
    console.log('New client connected:', clientInfo);
    
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
 * Handles room creation requests
 * @param client Socket client instance
 * @param payload Room creation payload
 */
  @UseGuards(RoomValidationGuard)
  @SubscribeMessage(ROOM_EVENTS.CREATE)
  async handleCreateRoom(client: Socket, payload: { name: string; maxParticipants?: number, userId: string }) {
    // Check if user is authenticated
    const userId = payload.userId;
    if (!userId) {
      this.logger.warn('Unauthorized room creation attempt', { clientId: client.id });
      client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.UNAUTHORIZED });
      return;
    }

    try {
      const roomCode = createRoomId();
      const room = await this.roomService.createRoom(
        roomCode,
        userId,
        payload.name,
        payload.maxParticipants
      );

      this.logger.logRoomEvent(roomCode, 'create', client.id);
      console.log('Room created:', roomCode);
      this.logger.logRoomEvent(roomCode, 'join', client.id);
      console.log('Joining room:', roomCode);
      this.roomService.joinRoom(client, roomCode, this.server);
      return createEventResponse(ROOM_MESSAGES.JOINED, { room: roomCode });
    } catch (error) {
      this.logger.error('Failed to create room: ' + error.message);
      client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.ROOM_CREATION_FAILED });
      return;
    }
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

    const { room } = payload;
    this.logger.logRoomEvent(room, 'join', client.id);
    console.log('Joining room:', room);
    this.roomService.joinRoom(client, room, this.server);
    return createEventResponse(ROOM_MESSAGES.JOINED, { room });
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

    const { room } = payload;
    this.logger.logRoomEvent(room, 'leave', client.id);
    console.log('Leaving room:', room);
    this.roomService.leaveRoom(client, room, this.server);
    return createEventResponse(ROOM_MESSAGES.LEFT, { room });
  }

  /**
   * Handles broadcast messages in a room
   * @param client Socket client instance
   * @param payload Broadcast message payload
   */
  @UseGuards(RoomValidationGuard)
  @SubscribeMessage(ROOM_EVENTS.BROADCAST)
  handleBroadcastMessage(client: Socket, payload: BroadcastMessagePayload) {
    // if (!validateRoomPayload(payload)) {
    //   this.logger.warn('Invalid broadcast message payload', { payload });
    //   client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.ROOM_REQUIRED });
    //   return;
    // }

    const { room, message } = payload;
    console.log('payload', payload);
    this.logger.logRoomEvent(room, 'broadcast', client.id, { message });
    console.log('Broadcasting message in room:', room, 'Message:', message);
    this.signalRoutes.handleBroadcastMessage(client, this.server, payload);
    return createEventResponse(ROOM_MESSAGES.MESSAGE_SENT, { room });
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

    const { room, videoEnabled, sdpOffer } = payload;

    // if (!isUserInRoom(this.server, client, room)) {
    //   this.logger.warn('User not in room for video share', { room, userId: client.id });
    //   client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.NOT_IN_ROOM });
    //   return;
    // }

    // if (videoEnabled && !sdpOffer) {
    //   this.logger.warn('Missing SDP offer for video share', { room, userId: client.id });
    //   client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.SDP_OFFER_REQUIRED });
    //   return;
    // }

    if (true) {
      const otherUsers = getOtherUsersInRoom(this.server, room, client.id);
      
      client.to(room).emit('video-offer', createEventResponse('Video offer received', {
        userId: client.id,
        sdpOffer
      }));

      client.emit('existing-users', createEventResponse('Existing users', {
        users: otherUsers
      }));
    } else {
      client.to(room).emit('video-close', createEventResponse('Video closed', {
        userId: client.id
      }));
    }

    client.to(room).emit(ROOM_EVENTS.VIDEO_STATE, 
      createVideoStatePayload(client.id, videoEnabled, room)
    );

    this.logger.logRoomEvent(room, 'video-share', client.id, { videoEnabled });

    console.log(`User ${client.id} ${videoEnabled ? 'started' : 'stopped'} video sharing in room:`, room);

    return createEventResponse(
      videoEnabled ? ROOM_MESSAGES.VIDEO_ENABLED : ROOM_MESSAGES.VIDEO_DISABLED,
      { room, userId: client.id, videoEnabled }
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
    const { room, targetUserId, sdpAnswer } = payload;

    // if (!room || !targetUserId || !sdpAnswer) {
    //   this.logger.warn('Invalid video answer payload', { payload });
    //   client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.INVALID_PAYLOAD });
    //   return;
    // }

    // if (!isUserInRoom(this.server, client, room)) {
    //   this.logger.warn('User not in room for video answer', { room, userId: client.id });
    //   client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.NOT_IN_ROOM });
    //   return;
    // }

    client.to(targetUserId!).emit('video-answer-received', createEventResponse('Video answer received', {
      userId: client.id,
      sdpAnswer
    }));

    this.logger.logRoomEvent(room, 'video-answer', client.id, { targetUserId });

    console.log(`User ${client.id} sent video answer to ${targetUserId} in room:`, room);

    return createEventResponse(ROOM_MESSAGES.VIDEO_ANSWER_SENT, {
      room,
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
    const { room, targetUserId, candidate } = payload;
    console.log('payload', payload);

    // if (!room || !targetUserId || !candidate) {
    //   this.logger.warn('Invalid ICE candidate payload', { payload });
    //   client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.INVALID_PAYLOAD });
    //   return;
    // }

    // if (!isUserInRoom(this.server, client, room)) {
    //   this.logger.warn('User not in room for ICE candidate', { room, userId: client.id });
    //   client.emit(ROOM_EVENTS.ERROR, { message: ROOM_ERRORS.NOT_IN_ROOM });
    //   return;
    // }

    // client.to(targetUserId).emit('ice-candidate-received', createEventResponse('ICE candidate received', {
    //   userId: client.id,
    //   candidate
    // }));

    this.logger.logRoomEvent(room, 'ice-candidate', client.id, { targetUserId });

    return createEventResponse(ROOM_MESSAGES.ICE_CANDIDATE_SENT, {
      room,
      targetUserId
    });
  }
}