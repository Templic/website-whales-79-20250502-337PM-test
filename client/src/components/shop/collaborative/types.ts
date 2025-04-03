// Collaborative Shopping Types

export interface RoomMessage {
  id: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
  productRef?: string;
}

export interface RoomParticipant {
  id: string;
  username: string;
  avatar: string;
  isActive: boolean;
  lastActive: Date;
}

export interface Room {
  id: string;
  name: string;
  participants: RoomParticipant[];
  createdAt: Date;
  createdBy: string;
  isPrivate: boolean;
}

export type MessageHandler = (message: string) => void;
export type ProductViewHandler = (productId: string) => void;
export type RoomJoinHandler = (roomId: string) => void;