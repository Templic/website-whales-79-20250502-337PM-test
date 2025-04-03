import { useEffect, useRef } from 'react';
import { RoomMessage, ProductViewHandler } from './types';
import ChatMessage from './ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageListProps {
  messages: RoomMessage[];
  username: string;
  onProductView?: ProductViewHandler;
}

export const MessageList = ({ 
  messages, 
  username,
  onProductView 
}: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  return (
    <ScrollArea 
      className="h-[calc(100%-100px)] py-4 px-4 mt-2 cosmic-stagger-children in"
      ref={scrollRef}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            currentUsername={username}
            onProductView={onProductView}
          />
        ))
      )}
    </ScrollArea>
  );
};

export default MessageList;