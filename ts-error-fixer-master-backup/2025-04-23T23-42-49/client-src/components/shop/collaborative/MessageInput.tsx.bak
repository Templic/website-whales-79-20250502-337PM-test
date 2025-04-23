import React from "react";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageHandler } from './types';
import { SendHorizontal } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: MessageHandler;
}

export const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && message.trim()) {
      handleSendMessage();
    }
  };
  
  return (
    <div className="p-4 border-t cosmic-glass flex items-center gap-2">
      <Input
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="cosmic-glass-field border-0"
      />
      <Button
        onClick={handleSendMessage}
        disabled={!message.trim()}
        size="icon"
        className="cosmic-hover-glow"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MessageInput;