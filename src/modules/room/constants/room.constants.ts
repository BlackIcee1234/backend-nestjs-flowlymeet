/**
 * Room-related event names
 */
export const ROOM_EVENTS = {
  CREATE: 'create-room',
  JOIN: 'join-room',
  LEAVE: 'leave-room',
  BROADCAST: 'broadcast-message',
  VIDEO_SHARE: 'share-video',
  VIDEO_ANSWER: 'video-answer',
  ICE_CANDIDATE: 'ice-candidate',
  VIDEO_RECONNECT: 'video-reconnect',
  VIDEO_STATE: 'video-state',
  CONNECTION_STATUS: 'connection-status',
  ERROR: 'error',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  USER_DISCONNECTED: 'user-disconnected'
} as const;

/**
 * Room-related error messages
 */
export const ROOM_ERRORS = {
  ROOM_REQUIRED: 'Room id is required',
  NOT_IN_ROOM: 'You must be in the room to perform this action',
  SDP_OFFER_REQUIRED: 'SDP offer is required to start video',
  INVALID_PAYLOAD: 'Invalid payload provided',
  UNAUTHORIZED: 'You must be authenticated to create a room',
  ROOM_CREATION_FAILED: 'Failed to create room'
} as const;

/**
 * Room-related success messages
 */
export const ROOM_MESSAGES = {
  CREATED: 'Room created successfully',
  JOINED: 'Joined room successfully',
  LEFT: 'Left room successfully',
  MESSAGE_SENT: 'Message sent successfully',
  VIDEO_ENABLED: 'Video enabled successfully',
  VIDEO_DISABLED: 'Video disabled successfully',
  VIDEO_ANSWER_SENT: 'Video answer sent successfully',
  ICE_CANDIDATE_SENT: 'ICE candidate sent successfully'
} as const;

/**
 * WebSocket configuration
 */
export const WS_CONFIG = {
  CORS: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST']
  },
  NAMESPACE: '/',
  TRANSPORTS: ['websocket', 'polling'],
  PATH: '/socket.io',
  ALLOW_EIO3: true,
  PING_INTERVAL: 10000,
  PING_TIMEOUT: 5000
} as const; 