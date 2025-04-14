import React, { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { Send, X, RefreshCcw, User, Bot } from 'lucide-react';

interface ChatInterfaceProps {
  isWidget?: boolean;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isWidget = false, onClose }) => {
  const { messages, addMessage, clearChat, highContrastChat, chatFontSize } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Form submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (inputValue.trim() === '') return;
    
    addMessage(inputValue, 'user');
    setInputValue('');
    
    // Refocus input after submission
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle enter key (shift+enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div className={`flex flex-col h-full relative ${isWidget ? 'p-0' : 'p-4'}`}>
      {/* Chat Header - Only shown in widget mode */}
      {isWidget && onClose && (
        <div className="flex justify-between items-center p-2 border-b bg-muted/30">
          <h3 className="text-sm font-medium">AI Assistant</h3>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearChat}
              className="h-8 w-8 p-0"
              aria-label="Clear chat history"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Messages Container */}
      <div 
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          highContrastChat ? 'bg-black text-white' : 'bg-muted/20'
        }`}
        style={{ fontSize: `${chatFontSize}%` }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p>No messages yet. Start a conversation!</p>
            <p className="text-sm mt-2">
              Ask me anything about our music, events, or services.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              highContrast={highContrastChat} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className={`p-2 border-t bg-card ${highContrastChat ? 'border-white/20' : ''}`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className={`min-h-[60px] max-h-[120px] resize-none ${
              highContrastChat ? 'bg-gray-900 text-white border-white/20' : ''
            }`}
            style={{ fontSize: `${chatFontSize}%` }}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={inputValue.trim() === ''}
            className={highContrastChat ? 'bg-white text-black hover:bg-gray-200' : ''}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

// Message bubble component
interface MessageBubbleProps {
  message: ChatMessage;
  highContrast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, highContrast }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex items-start gap-2 max-w-[80%]">
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="h-4 w-4" />
          </div>
        )}
        
        <div className={`
          rounded-lg p-3 ${isUser 
            ? highContrast 
              ? 'bg-white text-black' 
              : 'bg-primary text-primary-foreground'
            : highContrast 
              ? 'bg-gray-800 text-white border border-white/20' 
              : 'bg-muted'
          }
        `}>
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          <div className={`text-xs mt-1 ${isUser 
            ? highContrast 
              ? 'text-gray-800' 
              : 'text-primary-foreground/70'
            : highContrast 
              ? 'text-gray-300' 
              : 'text-muted-foreground'
          }`}>
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </div>
        </div>
        
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;