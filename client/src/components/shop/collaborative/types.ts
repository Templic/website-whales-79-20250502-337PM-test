export interface RoomParticipant {
  id: string;
  username: string;
  avatar?: string;
  isHost: boolean;
  joinedAt: Date;
  status: 'online' | 'away' | 'busy';
}

export interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'product';
  productData?: {
    id: string;
    name: string;
    image?: string;
    price: string;
  };
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  participantCount: number;
  createdAt: Date;
  isPrivate: boolean;
  password?: string;
  description?: string;
}

export interface SharedCart {
  id: string;
  roomId: string;
  items: SharedCartItem[];
  lastUpdated: Date;
}

export interface SharedCartItem {
  productId: string;
  quantity: number;
  addedBy: string;
  addedAt: Date;
}