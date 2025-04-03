import { RoomMessage, ProductViewHandler } from './types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tag, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: RoomMessage;
  currentUsername: string;
  onProductView?: ProductViewHandler;
}

export const ChatMessage = ({ 
  message, 
  currentUsername,
  onProductView 
}: ChatMessageProps) => {
  const isCurrentUser = message.username === currentUsername;
  const isSystem = message.isSystem;
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.message}
        </span>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "flex gap-2 mb-4 transition-all",
        isCurrentUser ? "flex-row-reverse" : "",
        "cosmic-fade-in"
      )}
    >
      <Avatar className="h-8 w-8 mt-1 cosmic-avatar">
        <AvatarImage src={message.avatar} alt={message.username} />
        <AvatarFallback className="bg-cosmic-primary text-white">
          {message.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex flex-col max-w-[75%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <span className="text-xs text-muted-foreground mb-1">
          {message.username} • {format(new Date(message.timestamp), 'h:mm a')}
        </span>
        
        <Card className={cn(
          "py-2 px-3",
          isCurrentUser ? 
            "bg-cosmic-primary text-white" : 
            "bg-muted",
          message.productRef ? "cosmic-glass-card" : "",
          "cosmic-hover-glow"
        )}>
          <p className={cn(
            "text-sm",
            isCurrentUser ? "text-white" : "text-foreground"
          )}>
            {message.message}
          </p>
          
          {message.productRef && (
            <div className="mt-2 pt-2 border-t border-cosmic flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs">Shared a product</span>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-2 ml-auto"
                onClick={() => onProductView?.(message.productRef!)}
              >
                <Tag className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;