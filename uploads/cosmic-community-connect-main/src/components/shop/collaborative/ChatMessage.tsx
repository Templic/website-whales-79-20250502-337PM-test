
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoomMessage } from "./types";

interface ChatMessageProps {
  message: RoomMessage;
  currentUsername: string;
  onProductView?: (productId: string) => void;
}

const ChatMessage = ({ message, currentUsername, onProductView }: ChatMessageProps) => {
  if (message.isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-muted/30 text-muted-foreground text-xs py-1 px-3 rounded-full">
          {message.message}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${message.username === currentUsername ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${message.username === currentUsername ? 'bg-cosmic-primary/20 text-primary' : 'bg-muted text-foreground'} rounded-lg p-3`}>
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="h-5 w-5">
            <AvatarImage src={message.avatar} alt={message.username} />
            <AvatarFallback>{message.username.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{message.username}</span>
        </div>
        <p className="text-sm">{message.message}</p>
        {message.productRef && onProductView && (
          <Button 
            variant="link" 
            size="sm" 
            className="h-auto p-0 text-xs mt-1"
            onClick={() => onProductView(message.productRef!)}
          >
            View Product
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
