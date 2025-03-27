import { RoomErrors } from 'src/common/errors/room.errors';
import { RoomRepository } from '../modules/room/room.repository';

export const isValidRoomId = (roomId: string): boolean => {
    // Early return for invalid input
    if (!roomId || typeof roomId !== 'string') {
        return false;
    }

    // Check if length is exactly 7 (3 letters + hyphen + 3 letters)
    if (roomId.length !== 7) {
        return false;
    }

    // Validate room ID format:
    // - Must have exactly 3 lowercase letters
    // - Must have a hyphen in the middle
    // - Must have exactly 3 lowercase letters after hyphen
    const ROOM_ID_PATTERN = /^[a-z]{3}-[a-z]{3}$/;
    
    return ROOM_ID_PATTERN.test(roomId);
};

interface Room {
    id: string;
    name: string;
    createdAt: Date;
    participants: string[]; // Array of user IDs
    isActive: boolean;
}

interface User {
    id: string;
    name: string;
    email: string;
}

/**
 * Checks if a room exists in the database
 */
export const doesRoomExist = async (roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    try {
        const room = await roomRepository.findById(roomId);
        return !!room;
    } catch (error) {
        console.error('Error checking room existence:', error);
        return false;
    }
};

/**
 * Validates if a user has access to a specific room
 */
export const hasUserAccessToRoom = async (userId: string, roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    try {
        const room = await roomRepository.findByIdWithParticipant(roomId, userId);
        return !!room;
    } catch (error) {
        console.error('Error checking user access:', error);
        return false;
    }
};

/**
 * Checks if a room has reached its maximum capacity
 */
export const isRoomFull = async (roomId: string, roomRepository: RoomRepository, maxParticipants: number = 10): Promise<boolean> => {
    try {
        const participantsCount = await roomRepository.getRoomParticipantsCount(roomId);
        return participantsCount >= maxParticipants;
    } catch (error) {
        console.error('Error checking room capacity:', error);
        return false;
    }
};

/**
 * Creates a new room in the database
 */
export const createRoom = async (roomData: Partial<Room>): Promise<Room | null> => {
    try {
        // Implement your room creation logic here
        // Example: const newRoom = await RoomModel.create(roomData);
        // return newRoom;
        return null; // Placeholder
    } catch (error) {
        console.error('Error creating room:', error);
        return null;
    }
};

/**
 * Validates if a room is still active and not expired
 */
export const isRoomActive = async (roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    try {
        return await roomRepository.isRoomActive(roomId);
    } catch (error) {
        console.error('Error checking room status:', error);
        return false;
    }
};

/**
 * Comprehensive room validation that combines multiple checks
 */
export const validateRoomAccess = async (
    roomId: string,
    userId: string,
    roomRepository: RoomRepository
): Promise<{ isValid: boolean; error?: string }> => {
    // First check if the room ID format is valid
    if (!isValidRoomId(roomId)) {
        return { isValid: false, error: RoomErrors.INVALID_ROOM_ID_FORMAT  };
    }

    // Check if room exists
    const roomExists = await doesRoomExist(roomId, roomRepository);
    if (!roomExists) {
        return { isValid: false, error: RoomErrors.ROOM_DOES_NOT_EXIST  };
    }

    // Check if room is active
    const isActive = await isRoomActive(roomId, roomRepository);
    if (!isActive) {
        return { isValid: false, error: RoomErrors.ROOM_NOT_ACTIVE };
    }

    // Check if user has access
    const hasAccess = await hasUserAccessToRoom(userId, roomId, roomRepository);
    if (!hasAccess) {
        return { isValid: false, error: RoomErrors.USER_NO_ACCESS };
    }

    // Check if room is full
    const isFull = await isRoomFull(roomId, roomRepository)
    if (isFull) {
        return { isValid: false, error: 'Room is at maximum capacity' };
    }

    return { isValid: true };
};
