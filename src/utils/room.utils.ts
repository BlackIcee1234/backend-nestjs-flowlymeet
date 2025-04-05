import { RoomErrors } from 'src/common/errors/room.errors';
import { RoomRepository } from '../modules/room/room.repository';
import { Room } from '../types/room.types';

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

/**
 * Checks if a room exists in the database
 */
export const doesRoomExist = async (roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    try {
        const room = await roomRepository.getRoom(roomId);
        return !!room;
    } catch (error) {
        console.error('Error checking room existence:', error);
        return false;
    }
};

/**
 * Checks if a room is active
 */
export const isRoomActive = async (roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    try {
        const room = await roomRepository.getRoom(roomId);
        return room?.isActive || false;
    } catch (error) {
        console.error('Error checking room status:', error);
        return false;
    }
};

/**
 * Checks if a user has access to a room
 */
export const hasUserAccessToRoom = async (userId: string, roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    try {
        return await roomRepository.isUserInRoom(roomId, userId);
    } catch (error) {
        console.error('Error checking room access:', error);
        return false;
    }
};

/**
 * Checks if a room is at maximum capacity
 */
export const isRoomFull = async (roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    try {
        const room = await roomRepository.getRoom(roomId);
        if (!room) return true;
        return room.participants.length >= room.maxParticipants;
    } catch (error) {
        console.error('Error checking room capacity:', error);
        return true;
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
 * Comprehensive room validation that combines multiple checks
 */
export const validateRoomAccess = async (
    roomId: string,
    userId: string,
    roomRepository: RoomRepository
): Promise<{ isValid: boolean; error?: string }> => {
    // First check if the room ID format is valid
    // if (!isValidRoomId(roomId)) {
    //     return { isValid: false, error: RoomErrors.INVALID_ROOM_ID_FORMAT };
    // }

    // // Check if room exists
    // const roomExists = await doesRoomExist(roomId, roomRepository);
    // if (!roomExists) {
    //     return { isValid: false, error: RoomErrors.ROOM_DOES_NOT_EXIST };
    // }

    // // Check if room is active
    // const isActive = await isRoomActive(roomId, roomRepository);
    // if (!isActive) {
    //     return { isValid: false, error: RoomErrors.ROOM_NOT_ACTIVE };
    // }

    // // Check if user has access
    // const hasAccess = await hasUserAccessToRoom(userId, roomId, roomRepository);
    // if (!hasAccess) {
    //     return { isValid: false, error: RoomErrors.USER_NO_ACCESS };
    // }

    // // Check if room is full
    // const isFull = await isRoomFull(roomId, roomRepository);
    // if (isFull) {
    //     return { isValid: false, error: RoomErrors.ROOM_FULL };
    // }

    return { isValid: true };
};
