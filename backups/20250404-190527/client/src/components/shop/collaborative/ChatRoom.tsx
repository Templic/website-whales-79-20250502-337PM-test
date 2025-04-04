import { RoomMessage, RoomParticipant, MessageHandler, ProductViewHandler } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, X, Info } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatRoomProps {
  username: string;
  roomId: string;
  messages: RoomMessage[];
  participants: RoomParticipant[];
  onSendMessage: MessageHandler;
  onProductView?: ProductViewHandler;
  onLeaveRoom?: () => void;
}

export const ChatRoom = ({
  username,
  roomId,
  messages,
  participants,
  onSendMessage,
  onProductView,
  onLeaveRoom
}: ChatRoomProps) => {
  const activeParticipants = participants.filter(p => p.isActive);
  
  return (
    <Card className="h-full cosmic-glass-card cosmic-scale in overflow-hidden">
      <CardHeader className="p-4 border-b space-y-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <span className="cosmic-gradient-text">Shopping Room</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-2">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Room ID: {roomId}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 cosmic-hover-glow">
                <Users className="h-4 w-4" />
                <span>{activeParticipants.length}</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Participants</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <ScrollArea className="h-[400px]">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 cosmic-avatar">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback className="bg-cosmic-primary text-white">
                            {participant.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={participant.username === username ? "font-medium" : ""}>
                          {participant.username} {participant.username === username && "(You)"}
                        </span>
                      </div>
                      
                      <Badge variant={participant.isActive ? "default" : "outline"}>
                        {participant.isActive ? "Active" : "Away"}
                      </Badge>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
          
          {onLeaveRoom && (
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive cosmic-hover-glow"
              onClick={onLeaveRoom}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-60px)]">
        <MessageList 
          messages={messages} 
          username={username} 
          onProductView={onProductView}
        />
        <MessageInput onSendMessage={onSendMessage} />
      </CardContent>
    </Card>
  );
};

export default ChatRoom;