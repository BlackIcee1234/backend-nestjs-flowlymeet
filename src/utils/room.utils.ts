import { RoomErrors } from 'src/common/errors/room.errors';
import { RoomRepository } from '../modules/room/room.repository';
import { Room } from '../types/room.types';
import { Logger } from '@nestjs/common'; // Importing Logger

const logger = new Logger('RoomUtils'); // Creating a logger instance

export const isValidRoomId = (roomId: string): boolean => {
    logger.log(`Validating room ID: ${roomId}`); // Logging the room ID being validated
    if (!roomId || typeof roomId !== 'string') {
        logger.warn('Invalid room ID: Input is not a string or is empty');
        return false;
    }

    if (roomId.length !== 7) {
        logger.warn('Invalid room ID: Length is not 7');
        return false;
    }

    const ROOM_ID_PATTERN = /^[a-z]{3}-[a-z]{3}$/;
    const isValid = ROOM_ID_PATTERN.test(roomId);
    logger.log(`Room ID ${roomId} is ${isValid ? 'valid' : 'invalid'}`);
    return isValid;
};

export const createRoomId = (): string => {
    const generateRandomLetters = (length: number): string => {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
    };

    const roomId = `${generateRandomLetters(3)}-${generateRandomLetters(3)}`;
    logger.log(`Created new room ID: ${roomId}`);
    return roomId;
};

export const doesRoomExist = async (roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    logger.log(`Checking if room exists: ${roomId}`);
    try {
        const room = await roomRepository.getRoom(roomId);
        const exists = !!room;
        logger.log(`Room existence check for ${roomId}: ${exists}`);
        return exists;
    } catch (error) {
        logger.error('Error checking room existence:', error);
        return false;
    }
};

export const isRoomActive = async (roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    logger.log(`Checking if room is active: ${roomId}`);
    try {
        const room = await roomRepository.getRoom(roomId);
        const isActive = room?.isActive || false;
        logger.log(`Room ${roomId} is ${isActive ? 'active' : 'not active'}`);
        return isActive;
    } catch (error) {
        logger.error('Error checking room status:', error);
        return false;
    }
};

export const hasUserAccessToRoom = async (userId: string, roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    logger.log(`Checking if user ${userId} has access to room ${roomId}`);
    try {
        const hasAccess = await roomRepository.isUserInRoom(roomId, userId);
        logger.log(`User ${userId} access to room ${roomId}: ${hasAccess}`);
        return hasAccess;
    } catch (error) {
        logger.error('Error checking room access:', error);
        return false;
    }
};

export const isRoomFull = async (roomId: string, roomRepository: RoomRepository): Promise<boolean> => {
    logger.log(`Checking if room is full: ${roomId}`);
    try {
        const room = await roomRepository.getRoom(roomId);
        if (!room) {
            logger.warn(`Room ${roomId} does not exist, considering it full`);
            return true;
        }
        const isFull = room.participants.length >= room.maxParticipants;
        logger.log(`Room ${roomId} is ${isFull ? 'full' : 'not full'}`);
        return isFull;
    } catch (error) {
        logger.error('Error checking room capacity:', error);
        return true;
    }
};

export const createRoom = async (roomData: Partial<Room>): Promise<Room | null> => {
    logger.log('Creating a new room with data:', roomData);
    try {
        // Implement your room creation logic here
        // Example: const newRoom = await RoomModel.create(roomData);
        // return newRoom;
        return null; // Placeholder
    } catch (error) {
        logger.error('Error creating room:', error);
        return null;
    }
};

export const validateRoomAccess = async (
    roomCode: string,
    userId: string,
    roomRepository: RoomRepository
): Promise<{ isValid: boolean; error?: string }> => {
    logger.log(`Validating access for user ${userId} to room ${roomCode}`);
    if (!isValidRoomId(roomCode)) {
        logger.warn(`Invalid room ID format for room: ${roomCode}`);
        return { isValid: false, error: RoomErrors.INVALID_ROOM_ID_FORMAT };
    }

    const roomExists = await doesRoomExist(roomCode, roomRepository);
    if (!roomExists) {
        logger.warn(`Room ${roomCode} does not exist`);
        return { isValid: false, error: RoomErrors.ROOM_DOES_NOT_EXIST };
    }

    const isActive = await isRoomActive(roomCode, roomRepository);
    if (!isActive) {
        logger.warn(`Room ${roomCode} is not active`);
        return { isValid: false, error: RoomErrors.ROOM_NOT_ACTIVE };
    }

    const hasAccess = await hasUserAccessToRoom(userId, roomCode, roomRepository);
    if (!hasAccess) {
        logger.warn(`User ${userId} does not have access to room ${roomCode}`);
        return { isValid: false, error: RoomErrors.USER_NO_ACCESS };
    }

    const isFull = await isRoomFull(roomCode, roomRepository);
    if (isFull) {
        logger.warn(`Room ${roomCode} is full`);
        return { isValid: false, error: RoomErrors.ROOM_FULL };
    }

    logger.log(`User ${userId} has valid access to room ${roomCode}`);
    return { isValid: true };
};
