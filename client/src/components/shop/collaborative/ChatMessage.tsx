import { RoomMessage, ProductViewHandler } from './types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ShoppingCart } from 'lucide-react';

interface ChatMessageProps {
  message: RoomMessage;
  isCurrentUser: boolean;
  onProductView?: ProductViewHandler;
}

export const ChatMessage = ({ 
  message, 
  isCurrentUser,
  onProductView
}: ChatMessageProps) => {
  const { username, message: content, timestamp, avatar, isSystem, productRef } = message;
  
  const handleProductView = () => {
    if (productRef && onProductView) {
      onProductView(productRef);
    }
  };
  
  // For system messages
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="inline-block px-4 py-2 rounded-full bg-muted/30 text-sm text-muted-foreground">
          {content}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mt-1 cosmic-avatar">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-cosmic-primary text-white">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[75%] space-y-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && (
          <p className="text-xs text-muted-foreground">{username}</p>
        )}
        
        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-4 py-2 rounded-lg ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground cosmic-glass-primary'
                : 'bg-muted cosmic-glass'
            } ${productRef ? 'cursor-pointer cosmic-hover-glow' : ''}`}
            onClick={productRef ? handleProductView : undefined}
          >
            <p>{content}</p>
            {productRef && (
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <ShoppingCart className="h-3 w-3 mr-1" />
                <span>Click to view product</span>
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {format(new Date(timestamp), 'HH:mm')}
          </span>
        </div>
      </div>
      
      {isCurrentUser && (
        <Avatar className="h-8 w-8 mt-1 cosmic-avatar">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-cosmic-primary text-white">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;