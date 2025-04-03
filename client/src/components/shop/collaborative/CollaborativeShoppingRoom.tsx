import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Send,
  ShoppingBag,
  Clock,
  X,
  Heart,
  UserPlus,
  Share2,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RoomMessage, RoomParticipant } from './types';

// This is a placeholder for actual socket/WebSocket connection
// In a real implementation, this would be replaced with proper WebSocket setup
const useMockWebSocket = (roomId: string) => {
  // This would be replaced with actual WebSocket implementation
  const mockSendMessage = (content: string) => {
    console.log(`[MockWebSocket] Sending message to room ${roomId}:`, content);
    return {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      senderName: 'You',
      content,
      timestamp: new Date(),
      type: 'text' as const,
    };
  };

  return {
    sendMessage: mockSendMessage,
    isConnected: true,
  };
};

interface CollaborativeShoppingRoomProps {
  roomId: string;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  initialParticipants?: RoomParticipant[];
  initialMessages?: RoomMessage[];
  onShareProduct?: (productId: string) => void;
  onAddToSharedCart?: (productId: string, quantity: number) => void;
}

export default function CollaborativeShoppingRoom({
  roomId,
  onClose,
  currentUser,
  initialParticipants = [],
  initialMessages = [],
  onShareProduct,
  onAddToSharedCart,
}: CollaborativeShoppingRoomProps) {
  const [messages, setMessages] = useState<RoomMessage[]>(initialMessages);
  const [participants, setParticipants] = useState<RoomParticipant[]>(initialParticipants);
  const [inputMessage, setInputMessage] = useState('');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isConnected } = useMockWebSocket(roomId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    const newMessage = sendMessage(inputMessage);
    setMessages([...messages, newMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const inviteParticipant = () => {
    // In a real implementation, this would generate and copy an invite link
    // For now, we'll just simulate it
    
    // Generate mock room link
    const roomLink = `${window.location.origin}/shop/collaborative/join/${roomId}`;

    // Copy to clipboard
    navigator.clipboard.writeText(roomLink).then(
      () => {
        toast({
          title: 'Invite Link Copied!',
          description: 'Share this link with friends to shop together.',
        });
      },
      (err) => {
        console.error('Could not copy invite link:', err);
        toast({
          title: 'Failed to Copy Link',
          description: 'Please try again or manually share the URL.',
          variant: 'destructive',
        });
      }
    );
  };

  function ParticipantItem({ participant }: { participant: RoomParticipant }) {
    return (
      <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={participant.avatar} />
              <AvatarFallback>
                {participant.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div
              className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${
                participant.status === 'online'
                  ? 'bg-green-500'
                  : participant.status === 'away'
                  ? 'bg-yellow-500'
                  : 'bg-gray-500'
              }`}
            />
          </div>
          <div className="text-sm font-medium">{participant.username}</div>
        </div>
        {participant.isHost && (
          <Badge variant="outline" className="text-xs">
            Host
          </Badge>
        )}
      </div>
    );
  }

  function ChatMessage({ message }: { message: RoomMessage }) {
    const isCurrentUser = message.senderId === currentUser.id;
    const isSystem = message.type === 'system';
    const isProduct = message.type === 'product';

    if (isSystem) {
      return (
        <div className="my-2 px-4 py-1 text-center">
          <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {message.content}
          </span>
        </div>
      );
    }

    if (isProduct && message.productData) {
      const { productData } = message;
      return (
        <div
          className={`flex items-start gap-2 my-2 ${
            isCurrentUser ? 'justify-end' : ''
          }`}
        >
          {!isCurrentUser && (
            <Avatar className="h-6 w-6">
              <AvatarFallback>
                {message.senderName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
            {!isCurrentUser && (
              <span className="text-xs text-muted-foreground">
                {message.senderName}
              </span>
            )}
            <div className="flex flex-col p-2 rounded-lg bg-muted/30 border border-border">
              <div className="text-xs text-muted-foreground mb-1">
                Shared a product:
              </div>
              <div className="flex items-center gap-2">
                {productData.image && (
                  <img
                    src={productData.image}
                    alt={productData.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium">{productData.name}</div>
                  <div className="text-xs">{productData.price}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() =>
                      onAddToSharedCart?.(productData.id, 1)
                    }
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex items-start gap-2 my-2 ${
          isCurrentUser ? 'justify-end' : ''
        }`}
      >
        {!isCurrentUser && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={""} />
            <AvatarFallback>
              {message.senderName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : ''}`}>
          {!isCurrentUser && (
            <span className="text-xs text-muted-foreground">
              {message.senderName}
            </span>
          )}
          <div
            className={`px-3 py-2 rounded-lg ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted border border-border'
            }`}
          >
            {message.content}
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    );
  }

  // Dummy data for demonstration purposes
  useEffect(() => {
    if (initialParticipants.length === 0) {
      // Add some sample participants if none were provided
      setParticipants([
        {
          id: currentUser.id,
          username: currentUser.name,
          avatar: currentUser.avatar,
          isHost: true,
          joinedAt: new Date(),
          status: 'online',
        },
        {
          id: 'user2',
          username: 'Cosmic Friend',
          isHost: false,
          joinedAt: new Date(Date.now() - 300000), // 5 minutes ago
          status: 'online',
        },
      ]);
    }

    if (initialMessages.length === 0) {
      // Add a welcome message if no messages were provided
      setMessages([
        {
          id: 'welcome',
          senderId: 'system',
          senderName: 'System',
          content: 'Welcome to the collaborative shopping room! Share products and shop together.',
          timestamp: new Date(),
          type: 'system',
        },
      ]);
    }
  }, [currentUser, initialParticipants, initialMessages]);

  return (
    <Card className="w-full max-w-md h-[600px] flex flex-col">
      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Shopping Room</CardTitle>
          <Badge variant="secondary" className="ml-1">
            {participants.length}
          </Badge>
        </div>
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={inviteParticipant}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Invite Friends</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Room Settings</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close Room</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Participants List */}
        <div className="w-1/3 border-r border-border">
          <div className="p-3 border-b border-border">
            <div className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4" /> Participants
            </div>
          </div>
          <ScrollArea className="h-[calc(600px-117px)]">
            <div className="py-2 px-1">
              {participants.map((participant) => (
                <ParticipantItem
                  key={participant.id}
                  participant={participant}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-1">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* Message Input */}
          <div className="p-3 flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !isConnected}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}