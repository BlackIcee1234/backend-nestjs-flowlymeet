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
import { RoomRoutes } from './routes/room.routes';
import { MediaRoutes } from './routes/media.routes';
import { SignalRoutes } from './routes/signal.routes';
import { RoomValidationGuard } from '../room/guards/room-validation.guard';

@WSGateway({
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST']
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  allowEIO3: true,
  pingInterval: 10000,
  pingTimeout: 5000
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly roomRoutes: RoomRoutes,
    private readonly mediaRoutes: MediaRoutes,
    private readonly signalRoutes: SignalRoutes
  ) {}

  async handleConnection(client: Socket) {
    // Log connection details
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
    
    // Initialize routes after successful connection
    // client.on('join-room', (data) => this.roomRoutes.handleJoinRoom(client, this.server, data));
    // client.on('leave-room', (data) => this.roomRoutes.handleLeaveRoom(client, this.server, data));
    // client.on('media-state-change', (data) => this.mediaRoutes.handleMediaStateChange(client, this.server, data));
    // client.on('start-screen-share', (data) => this.mediaRoutes.handleStartScreenShare(client, this.server, data));
    // client.on('stop-screen-share', (data) => this.mediaRoutes.handleStopScreenShare(client, this.server, data));
    // client.on('signal', (data) => this.signalRoutes.handleSignal(client, this.server, data));
    // client.on('broadcast-message', (data) => this.signalRoutes.handleBroadcastMessage(client, this.server, data));
    
    // Emit connection status to client
    return client.emit('connection-status', { 
      connected: true,
      clientId: client.id,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Handle user leaving rooms
    this.roomService.handleUserLeaveRooms(client, this.server);
    
    // Clean up any remaining listeners
    client.removeAllListeners();
  }

  @UseGuards(RoomValidationGuard)
  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, payload: any) {
    if (!payload || !payload.room) {
      client.emit('error', { message: 'Room id is required' });
      return;
    }

    const { room } = payload;
    console.log('Joining room:', room);
    this.roomService.joinRoom(client, room, this.server);
    return {
      message: 'Joined room',
      room
    };
  }

  @UseGuards(RoomValidationGuard)
  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, server: Server, payload: any) {
    if (!payload || !payload.room) {
      client.emit('error', { message: 'Room id is required' });
      return;
    }

    const { room } = payload;
    console.log('Leaving room:', room);
    this.roomService.leaveRoom(client, room, server);
    return {
      message: 'Left room',
      room
    }
  }

  @UseGuards(RoomValidationGuard)
  @SubscribeMessage('broadcast-message')
  handleBroadcastMessage(client: Socket, payload: any) {
    if (!payload || !payload.room) {
      client.emit('error', { message: 'Room id is required' });
      return;
    }
    const { room, message } = payload;
    console.log('Broadcasting message in room:', room, 'Message:', message);
    this.signalRoutes.handleBroadcastMessage(client, this.server, payload);
    return {
      message: 'Message broadcasted successfully',
      room,
      timestamp: new Date().toISOString()
    }
  }

@UseGuards(RoomValidationGuard)
@SubscribeMessage('share-video')
async handleVideoShare(client: Socket, payload: any) {
  if (!payload || !payload.room) {
    client.emit('error', { message: 'Room id is required' });
    return;
  }

  const { room, videoEnabled, sdpOffer } = payload;

  // Check if user is in the specified room
  const roomsMap = this.server.sockets.adapter.rooms;
  const roomClients = Array.from(roomsMap?.get(room) || []);
  if (!roomClients.includes(client.id)) {
    client.emit('error', { message: 'You must be in the room to share video' });
    return;
  }

  if (videoEnabled && !sdpOffer) {
    client.emit('error', { message: 'SDP offer is required to start video' });
    return;
  }

  // Handle WebRTC signaling
  if (videoEnabled) {
    // Get all other users in the room
    const otherUsers = Array.from(roomClients).filter(id => id !== client.id);

    // Broadcast the offer to other peers in the room
    client.to(room).emit('video-offer', {
      userId: client.id,
      sdpOffer,
      timestamp: new Date().toISOString()
    });

    // Send list of existing users to the new participant
    client.emit('existing-users', {
      users: otherUsers,
      timestamp: new Date().toISOString()
    });
  } else {
    // Notify peers to close video connection
    client.to(room).emit('video-close', {
      userId: client.id,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast video state change to all users in the room
  client.to(room).emit('user-video-state', {
    userId: client.id,
    videoEnabled,
    timestamp: new Date().toISOString()
  });

  console.log(`User ${client.id} ${videoEnabled ? 'started' : 'stopped'} video sharing in room:`, room);

  return {
    message: `Video ${videoEnabled ? 'enabled' : 'disabled'} successfully`,
    room,
    userId: client.id,
    videoEnabled,
    timestamp: new Date().toISOString()
  }
}

@UseGuards(RoomValidationGuard)
@SubscribeMessage('video-answer')
async handleVideoAnswer(client: Socket, payload: any) {
  const { room, targetUserId, sdpAnswer } = payload;

  if (!room || !targetUserId || !sdpAnswer) {
    client.emit('error', { message: 'Invalid video answer payload' });
    return;
  }

  // Check if user is in the specified room
  const roomsMap = this.server.sockets.adapter.rooms;
  const roomClients = Array.from(roomsMap?.get(room) || []);
  if (!roomClients.includes(client.id)) {
    client.emit('error', { message: 'You must be in the room to send video answer' });
    return;
  }

  // Forward the answer to the specific peer
  client.to(targetUserId).emit('video-answer-received', {
    userId: client.id,
    sdpAnswer,
    timestamp: new Date().toISOString()
  });

  console.log(`User ${client.id} sent video answer to ${targetUserId} in room:`, room);

  return {
    message: 'Video answer sent successfully',
    room,
    targetUserId,
    timestamp: new Date().toISOString()
  };
}

@UseGuards(RoomValidationGuard)
@SubscribeMessage('ice-candidate')
async handleIceCandidate(client: Socket, payload: any) {
  const { room, targetUserId, candidate } = payload;

  if (!room || !targetUserId || !candidate) {
    client.emit('error', { message: 'Invalid ICE candidate payload' });
    return;
  }

  // Check if user is in the specified room
  const roomsMap = this.server.sockets.adapter.rooms;
  const roomClients = Array.from(roomsMap?.get(room) || []);
  if (!roomClients.includes(client.id)) {
    client.emit('error', { message: 'You must be in the room to send ICE candidates' });
    return;
  }

  // Forward the ICE candidate to the specific peer
  client.to(targetUserId).emit('ice-candidate-received', {
    userId: client.id,
    candidate,
    timestamp: new Date().toISOString()
  });

  console.log(`User ${client.id} sent ICE candidate to ${targetUserId} in room:`, room);

  return {
    message: 'ICE candidate sent successfully',
    room,
    targetUserId,
    timestamp: new Date().toISOString()
  };
}

  @UseGuards(RoomValidationGuard)
  @SubscribeMessage('reconnect-video')
  async handleVideoReconnect(client: Socket, payload: any) {
    const { room } = payload;

    if (!room) {
      client.emit('error', { message: 'Room id is required' });
      return;
    }

    // Check if user is in the specified room
    const roomClients = Array.from(this.server.sockets.adapter.rooms.get(room) || []);
    if (!roomClients.includes(client.id)) {
      client.emit('error', { message: 'You must be in the room to reconnect video' });
      return;
    }

    // Get all other users in the room
    const otherUsers = Array.from(roomClients).filter(id => id !== client.id);

    // Notify other users about reconnection attempt
    client.to(room).emit('peer-reconnecting', {
      userId: client.id,
      timestamp: new Date().toISOString()
    });

    return {
      message: 'Video reconnection initiated',
      room,
      users: otherUsers,
      timestamp: new Date().toISOString()
    };
  }

  @UseGuards(RoomValidationGuard)
  @SubscribeMessage('video-state')
  async handleVideoState(client: Socket, payload: any) {
    const { room, videoEnabled, audioEnabled } = payload;

    if (!room) {
      client.emit('error', { message: 'Room id is required' });
      return;
    }

    // Check if user is in the specified room
    const roomClients = Array.from(this.server.sockets.adapter.rooms.get(room) || []);
    if (!roomClients.includes(client.id)) {
      client.emit('error', { message: 'You must be in the room to update video state' });
      return;
    }

    // Broadcast video/audio state change to all users in the room
    client.to(room).emit('peer-media-state-changed', {
      userId: client.id,
      videoEnabled,
      audioEnabled,
      timestamp: new Date().toISOString()
    });

    console.log(`User ${client.id} updated media state in room:`, room, { videoEnabled, audioEnabled });

    return {
      message: 'Media state updated successfully',
      room,
      videoEnabled,
      audioEnabled,
      timestamp: new Date().toISOString()
    };
  }
}