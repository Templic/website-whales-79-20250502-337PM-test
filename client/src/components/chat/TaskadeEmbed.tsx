import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Loader2, MessageSquare, User, Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface TaskadeEmbedProps {
  chatOnly?: boolean;
  className?: string;
}

// Mock conversation for demo purposes
const initialMessages = [
  {
    id: '1',
    sender: 'assistant',
    content: 'Hello! I\'m the Cosmic Taskade AI Assistant. How can I help you today?',
    timestamp: new Date(Date.now() - 5 * 60000)
  }
];

const TaskadeEmbed: React.FC<TaskadeEmbedProps> = ({ chatOnly = false, className = '' }) => {
  const { reducedMotion } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle message sending
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Simulate AI typing
    setIsTyping(true);
    
    // Generate AI response after delay
    setTimeout(() => {
      const responses = [
        "I understand your interest in cosmic consciousness. It's a fascinating concept that connects us to the universe.",
        "The whale songs in our meditation tracks represent the deep connection to oceanic wisdom.",
        "Sacred geometry patterns help visualize the interconnectedness of all things in the cosmos.",
        "Our upcoming tour includes special meditation sessions featuring binaural beats tuned to specific frequencies.",
        "The Cosmic Consciousness Portal is designed to guide you through different levels of awareness.",
        "Our newest album incorporates sounds recorded from actual celestial events, processed to be audible to humans."
      ];
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className={`relative h-full w-full overflow-hidden flex flex-col ${className}`}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading Taskade AI...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Chat messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`flex max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div>
                    <div className={`rounded-lg px-4 py-2 ${
                      message.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 text-muted-foreground ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-secondary text-secondary-foreground">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-100" />
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input area */}
          <div className="border-t p-4 bg-background/90">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button type="submit" size="icon" disabled={!input.trim()} className={`rounded-full h-9 w-9 p-0 ${!input.trim() ? 'opacity-50' : ''}`}>
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/70 to-transparent h-8 pointer-events-none" />
        </>
      )}
    </div>
  );
};

export default TaskadeEmbed;