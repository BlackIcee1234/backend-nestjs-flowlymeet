import { Server, Socket } from 'socket.io';

/**
 * Interface for room event payloads
 */
export interface RoomEventPayload {
  room: string;
  [key: string]: any;
}

/**
 * Interface for broadcast message payloads
 */
export interface BroadcastMessagePayload extends RoomEventPayload {
  message: string;
}

/**
 * Interface for video event payloads
 */
export interface VideoEventPayload extends RoomEventPayload {
  videoEnabled: boolean;
  sdpOffer?: any;
  sdpAnswer?: any;
  targetUserId?: string;
  candidate?: any;
}

/**
 * Validates if a user is in a specific room
 * @param server Socket.io server instance
 * @param client Socket client instance
 * @param room Room identifier
 * @returns boolean indicating if user is in room
 */
export const isUserInRoom = (server: Server, client: Socket, room: string): boolean => {
  const roomsMap = server.sockets.adapter.rooms;
  const roomClients = Array.from(roomsMap?.get(room) || []);
  return roomClients.includes(client.id);
};

/**
 * Gets all other users in a room except the current user
 * @param server Socket.io server instance
 * @param room Room identifier
 * @param currentUserId Current user's ID
 * @returns Array of user IDs
 */
export const getOtherUsersInRoom = (server: Server, room: string, currentUserId: string): string[] => {
  const roomsMap = server.sockets.adapter.rooms;
  const roomClients = Array.from(roomsMap?.get(room) || []);
  return roomClients.filter(id => id !== currentUserId);
};

/**
 * Creates a standardized event response
 * @param message Response message
 * @param data Additional data to include
 * @returns Formatted response object
 */
export const createEventResponse = (message: string, data: any = {}) => ({
  message,
  ...data,
  timestamp: new Date().toISOString()
});

/**
 * Validates room event payload
 * @param payload Event payload
 * @returns boolean indicating if payload is valid
 */
export const validateRoomPayload = (payload: RoomEventPayload): boolean => {
  return !!payload && !!payload.room;
};

/**
 * Creates a video state change event payload
 * @param userId User ID
 * @param videoEnabled Video state
 * @param room Room identifier
 * @returns Formatted video state event payload
 */
export const createVideoStatePayload = (userId: string, videoEnabled: boolean, room: string) => ({
  userId,
  videoEnabled,
  room,
  timestamp: new Date().toISOString()
}); 