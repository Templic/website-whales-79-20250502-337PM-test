import { useState, useEffect } from 'react';
import { Room, RoomMessage, RoomParticipant, ProductViewHandler } from './types';
import ChatRoom from './ChatRoom';
import JoinRoomPanel from './JoinRoomPanel';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useLocation } from 'wouter';

interface CollaborativeShoppingRoomProps {
  roomId: string;
  onProductView?: ProductViewHandler;
}

// Generate a random avatar
const getRandomAvatar = () => `https://avatars.dicebear.com/api/identicon/${Math.random()}.svg`;

// Mock socket connection for demo purposes - in production would use a real socket connection
class MockSocketConnection {
  private callbacks: Record<string, Function[]> = {};
  private roomMessages: Record<string, RoomMessage[]> = {};
  private roomParticipants: Record<string, RoomParticipant[]> = {};
  
  constructor() {
    // Initialize with some mock data
    this.roomMessages = {};
    this.roomParticipants = {};
  }
  
  connect() {
    this.emit('connected', {});
  }
  
  joinRoom(roomId: string, username: string) {
    if (!this.roomParticipants[roomId]) {
      this.roomParticipants[roomId] = [];
    }
    
    if (!this.roomMessages[roomId]) {
      this.roomMessages[roomId] = [];
      
      // Add system welcome message
      this.roomMessages[roomId].push({
        id: uuidv4(),
        username: 'system',
        avatar: '',
        message: `Room created. Welcome to the shopping room!`,
        timestamp: new Date(),
        isSystem: true
      });
    }
    
    const existingParticipant = this.roomParticipants[roomId].find(
      p => p.username === username
    );
    
    if (existingParticipant) {
      existingParticipant.isActive = true;
      existingParticipant.lastActive = new Date();
    } else {
      const newParticipant: RoomParticipant = {
        id: uuidv4(),
        username,
        avatar: getRandomAvatar(),
        isActive: true,
        lastActive: new Date()
      };
      
      this.roomParticipants[roomId].push(newParticipant);
      
      // Add system message for new participant
      this.roomMessages[roomId].push({
        id: uuidv4(),
        username: 'system',
        avatar: '',
        message: `${username} has joined the room`,
        timestamp: new Date(),
        isSystem: true
      });
    }
    
    this.emit('room:joined', {
      roomId,
      messages: this.roomMessages[roomId],
      participants: this.roomParticipants[roomId]
    });
  }
  
  leaveRoom(roomId: string, username: string) {
    if (this.roomParticipants[roomId]) {
      const participantIndex = this.roomParticipants[roomId].findIndex(
        p => p.username === username
      );
      
      if (participantIndex >= 0) {
        const participant = this.roomParticipants[roomId][participantIndex];
        participant.isActive = false;
        
        // Add system message for participant leaving
        this.roomMessages[roomId].push({
          id: uuidv4(),
          username: 'system',
          avatar: '',
          message: `${username} has left the room`,
          timestamp: new Date(),
          isSystem: true
        });
        
        this.emit('room:updated', {
          roomId,
          messages: this.roomMessages[roomId],
          participants: this.roomParticipants[roomId]
        });
      }
    }
  }
  
  sendMessage(roomId: string, message: string, username: string) {
    if (this.roomMessages[roomId]) {
      const participant = this.roomParticipants[roomId].find(
        p => p.username === username
      );
      
      if (participant) {
        const newMessage: RoomMessage = {
          id: uuidv4(),
          username,
          avatar: participant.avatar,
          message,
          timestamp: new Date()
        };
        
        this.roomMessages[roomId].push(newMessage);
        
        this.emit('room:message', {
          roomId,
          messages: this.roomMessages[roomId]
        });
      }
    }
  }
  
  shareProduct(roomId: string, username: string, productId: string, productName: string) {
    if (this.roomMessages[roomId]) {
      const participant = this.roomParticipants[roomId].find(
        p => p.username === username
      );
      
      if (participant) {
        const newMessage: RoomMessage = {
          id: uuidv4(),
          username,
          avatar: participant.avatar,
          message: `Check out this product: ${productName}`,
          timestamp: new Date(),
          productRef: productId
        };
        
        this.roomMessages[roomId].push(newMessage);
        
        this.emit('room:message', {
          roomId,
          messages: this.roomMessages[roomId]
        });
      }
    }
  }
  
  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    
    this.callbacks[event].push(callback);
  }
  
  off(event: string, callback: Function) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }
  
  emit(event: string, data$2 {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        setTimeout(() => {
          callback(data);
        }, 100); // Simulate network delay
      });
    }
  }
}

const mockSocket = new MockSocketConnection();

export const CollaborativeShoppingRoom = ({ 
  roomId,
  onProductView 
}: CollaborativeShoppingRoomProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Connect to mock socket
    mockSocket.connect();
    
    const handleConnected = () => {
      setIsConnected(true);
    };
    
    const handleRoomJoined = (data$2 => {
      if (data.roomId === roomId) {
        setMessages(data.messages);
        setParticipants(data.participants);
        setIsJoined(true);
      }
    };
    
    const handleRoomUpdated = (data$2 => {
      if (data.roomId === roomId) {
        setParticipants(data.participants);
      }
    };
    
    const handleRoomMessage = (data$2 => {
      if (data.roomId === roomId) {
        setMessages(data.messages);
      }
    };
    
    mockSocket.on('connected', handleConnected);
    mockSocket.on('room:joined', handleRoomJoined);
    mockSocket.on('room:updated', handleRoomUpdated);
    mockSocket.on('room:message', handleRoomMessage);
    
    return () => {
      // Cleanup
      mockSocket.off('connected', handleConnected);
      mockSocket.off('room:joined', handleRoomJoined);
      mockSocket.off('room:updated', handleRoomUpdated);
      mockSocket.off('room:message', handleRoomMessage);
      
      if (isJoined && username) {
        mockSocket.leaveRoom(roomId, username);
      }
    };
  }, [roomId, isJoined, username]);
  
  const joinRoom = () => {
    if (username && roomId) {
      mockSocket.joinRoom(roomId, username);
    }
  };
  
  const leaveRoom = () => {
    if (username && roomId) {
      mockSocket.leaveRoom(roomId, username);
      setIsJoined(false);
      setLocation('/shop');
    }
  };
  
  const sendMessage = (message: string) => {
    if (username && roomId) {
      mockSocket.sendMessage(roomId, message, username);
    }
  };
  
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    
    toast({
      title: 'Room ID copied',
      description: 'The room ID has been copied to your clipboard. Share it with your friends!',
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  const handleProductView = (productId: string) => {
    onProductView?.(productId);
  };
  
  return (
    <div className="w-full h-full min-h-[600px]">
      {isConnected && !isJoined ? (
        <JoinRoomPanel
          roomId={roomId}
          username={username}
          setUsername={setUsername}
          joinRoom={joinRoom}
          isCopied={isCopied}
          copyRoomId={copyRoomId}
        />
      ) : isConnected && isJoined ? (
        <ChatRoom
          username={username}
          roomId={roomId}
          messages={messages}
          participants={participants}
          onSendMessage={sendMessage}
          onProductView={handleProductView}
          onLeaveRoom={leaveRoom}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p>Connecting to collaborative shopping...</p>
        </div>
      )}
    </div>
  );
};

export default CollaborativeShoppingRoom;