import React, { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from '@/contexts/ChatContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

const ChatInterface: React.FC = () => {
  const { 
    messages, 
    isTyping, 
    sendMessage,
    highContrastChat,
    chatFontSize
  } = useChat();
  
  const { reducedMotion } = useAccessibility();
  const [input, setInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [messages, isTyping, autoScroll, reducedMotion]);
  
  // Check if user has scrolled up and disable auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isScrolledToBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim()) {
      sendMessage(input);
      setInput('');
      setAutoScroll(true);
    }
  };

  // Handler for the scroll-to-bottom button
  const scrollToBottom = () => {
    setAutoScroll(true);
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };
  
  // Determine if the scroll-to-bottom button should be visible
  const showScrollButton = !autoScroll && messages.length > 3;

  // Message Bubble Component
  const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.sender === 'user';
    
    const bubbleClasses = isUser
      ? `bg-primary text-primary-foreground ${highContrastChat ? 'border-2 border-white' : ''}`
      : `bg-muted ${highContrastChat ? 'border-2 border-primary text-foreground' : 'text-muted-foreground'}`;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.3 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%] gap-2`}>
          <Avatar className={`h-8 w-8 mt-1 ${isUser ? 'order-last' : 'order-first'}`}>
            {isUser ? (
              <>
                <AvatarImage src="/assets/user-avatar.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </>
            ) : (
              <>
                <AvatarImage src="/assets/ai-avatar.png" alt="AI" />
                <AvatarFallback>AI</AvatarFallback>
              </>
            )}
          </Avatar>
          
          <div>
            <div 
              className={`rounded-lg px-4 py-2 ${bubbleClasses}`}
              style={{ fontSize: `${chatFontSize}%` }}
            >
              {message.content}
              
              {message.status === 'sending' && (
                <span className="inline-block ml-2 opacity-70 animate-pulse">...</span>
              )}
            </div>
            
            <div className={`text-xs mt-1 text-muted-foreground ${isUser ? 'text-right' : 'text-left'}`}>
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ scrollBehavior: reducedMotion ? 'auto' : 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="mb-4 opacity-50">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">Welcome to the Chat</h3>
              <p className="text-sm text-muted-foreground">
                Ask a question or start a conversation to get help.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 max-w-md">
              {['Tell me about your music', 'When is your next tour?', 'What is cosmic consciousness?', 'How do I purchase tickets?'].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  className="text-sm h-auto py-2 px-3 whitespace-normal text-left justify-start"
                  onClick={() => {
                    setInput(suggestion);
                    sendMessage(suggestion);
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-2 mb-4">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src="/assets/ai-avatar.png" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                
                <div className={`rounded-lg px-4 py-2 bg-muted ${highContrastChat ? 'border-2 border-primary' : ''}`}>
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-100" />
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Invisible element for scroll targeting */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-4"
          >
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full h-10 w-10 p-0 shadow-md"
              onClick={scrollToBottom}
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Input area */}
      <div className="border-t p-4 bg-background/60 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontSize: `${chatFontSize}%` }}
            />
          </div>
          
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim()}
            className={`rounded-full h-10 w-10 p-0 ${!input.trim() ? 'opacity-50' : ''}`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;