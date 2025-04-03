import { useState, FormEvent } from 'react';
import { MessageHandler } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageInputProps {
  onSendMessage: MessageHandler;
  disabled?: boolean;
}

export const MessageInput = ({ 
  onSendMessage,
  disabled = false
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;
    
    onSendMessage(message);
    setMessage('');
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-center space-x-2 p-4 border-t cosmic-glass-field"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            type="button" 
            size="icon" 
            variant="ghost"
            className="h-9 w-9 rounded-full cosmic-hover-glow"
            disabled={disabled}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>
            Share Current Product
          </DropdownMenuItem>
          <DropdownMenuItem>
            Share Shopping Cart
          </DropdownMenuItem>
          <DropdownMenuItem>
            Send Emoji
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 cosmic-glass-field"
        disabled={disabled}
      />
      
      <Button 
        type="submit" 
        size="icon"
        className="cosmic-btn h-9 w-9 rounded-full"
        disabled={disabled || message.trim() === ''}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default MessageInput;