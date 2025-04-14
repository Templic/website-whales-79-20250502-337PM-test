import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Send, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SacredGeometry from '@/components/ui/sacred-geometry';

// Sample initial messages
const INITIAL_MESSAGES = [
  {
    role: 'assistant' as const,
    content: 'Hello! I\'m your cosmic guide. How can I assist you on your journey today?'
  }
];

interface ChatInterfaceProps {
  isEmbedded?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isEmbedded = false }) => {
  const {
    chatHistory,
    addMessage,
    clearChat,
    highContrastChat,
    chatFontSize
  } = useChat();
  
  const { reducedMotion } = useAccessibility();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // If chat history is empty, initialize with sample messages
  useEffect(() => {
    if (chatHistory.length === 0) {
      INITIAL_MESSAGES.forEach(msg => addMessage(msg));
    }
  }, [chatHistory.length, addMessage]);
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [chatHistory, autoScrollEnabled, reducedMotion]);
  
  // Handler for sending messages
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    addMessage({
      role: 'user',
      content: input
    });
    
    setInput('');
    setIsTyping(true);
    
    // Simulate a response after a delay
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: 'I understand your interest in our cosmic offerings. I\'m here to provide guidance about our music, events, and spiritual journeys. Is there something specific you\'d like to know about?'
      });
      setIsTyping(false);
    }, 1500);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };
  
  // Handle enter key (submit on Enter, new line on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Detect scroll position to show/hide scroll button
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setAutoScrollEnabled(isAtBottom);
  };
  
  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      setAutoScrollEnabled(true);
    }
  };
  
  return (
    <div className={`flex flex-col h-full ${isEmbedded ? 'border rounded-md shadow-md' : ''}`}>
      {/* Message list */}
      <div className="relative flex-1 overflow-hidden">
        <ScrollArea 
          className="h-full pr-4" 
          onScroll={handleScroll}
          ref={scrollAreaRef as any}
        >
          <div 
            className="space-y-4 p-4"
            style={{ fontSize: `${chatFontSize}%` }}
          >
            {chatHistory.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    flex items-start max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} 
                    ${message.role === 'user' ? 'pr-1' : 'pl-1'}
                  `}
                >
                  {/* Avatar for assistant messages */}
                  {message.role === 'assistant' && (
                    <Avatar className="mt-1 mr-2 h-8 w-8 border border-cyan-500/30">
                      <AvatarImage src="/cosmic-whale-avatar.png" alt="AI" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-900 to-purple-900 text-cyan-300">
                        <SacredGeometry variant="star" size={16} className="text-cyan-300" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {/* Message bubble */}
                  <div
                    className={`
                      py-2 px-3 rounded-lg 
                      ${message.role === 'user' 
                        ? highContrastChat 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                        : highContrastChat 
                          ? 'bg-muted' 
                          : 'bg-gradient-to-r from-blue-900 to-purple-900 text-cyan-50 border border-cyan-500/30'
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Avatar for user messages */}
                  {message.role === 'user' && (
                    <Avatar className="mt-1 ml-2 h-8 w-8 bg-primary/10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        You
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[85%] pl-1">
                  <Avatar className="mt-1 mr-2 h-8 w-8 border border-cyan-500/30">
                    <AvatarFallback className="bg-gradient-to-br from-blue-900 to-purple-900 text-cyan-300">
                      <SacredGeometry variant="star" size={16} className="text-cyan-300" />
                    </AvatarFallback>
                  </Avatar>
                  <div className={`
                    py-2 px-3 rounded-lg 
                    ${highContrastChat 
                      ? 'bg-muted' 
                      : 'bg-gradient-to-r from-blue-900 to-purple-900 text-cyan-50 border border-cyan-500/30'
                    }
                  `}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-75"></div>
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* End of messages marker */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Scroll to bottom button */}
        {!autoScrollEnabled && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4 rounded-full shadow-md opacity-80 hover:opacity-100"
            onClick={scrollToBottom}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Input area */}
      <div className="p-3 border-t">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="relative flex-1">
            <Textarea
              placeholder="Ask about our music, events, or spiritual practices..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] resize-none pr-10"
              rows={1}
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="absolute bottom-1 right-1 text-muted-foreground"
              disabled={!input.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Clear chat button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={clearChat}
            title="Clear chat history"
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </form>
        
        {/* Chat privacy notice */}
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Messages are stored locally in your browser and not shared with third parties.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;