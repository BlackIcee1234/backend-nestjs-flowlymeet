export interface RoomParticipant {
    id: string;
    hasVideo: boolean;
    hasAudio: boolean;
    isScreenSharing: boolean;
}

export interface Room {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    ownerId: string;
    maxParticipants: number;
    participants: string[];
}