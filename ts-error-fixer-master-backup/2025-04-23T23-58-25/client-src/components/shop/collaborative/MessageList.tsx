import React from "react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <ScrollArea className="flex-1 h-[calc(100%-80px)]">
      <div className="p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isCurrentUser={message.username === username}
            onProductView={onProductView}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;