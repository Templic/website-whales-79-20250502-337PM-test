import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, Minimize, Maximize, ChevronDown, ChevronUp } from 'lucide-react';
import { useAgents, Agent } from '@/contexts/AgentContext';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface AIChatInterfaceProps {
  isPopup?: boolean;
  onClose?: () => void;
}

export function AIChatInterface({ isPopup = false, onClose }: AIChatInterfaceProps) {
  const { activeAgent, deactivateAgent } = useAgents();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message when agent changes
  useEffect(() => {
    if (activeAgent) {
      const welcomeMessage = {
        id: `welcome-${Date.now()}`,
        content: `Hello! I'm ${activeAgent.name}. ${activeAgent.description} How can I help you today?`,
        sender: 'agent' as const,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [activeAgent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when the chat opens
  useEffect(() => {
    if (isPopup) {
      inputRef.current?.focus();
    }
  }, [isPopup]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      deactivateAgent();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeAgent) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate agent response
    // In a real implementation, this would connect to the Taskade agent API
    setTimeout(() => {
      const agentResponse: Message = {
        id: `agent-${Date.now()}`,
        content: getSimulatedResponse(input, activeAgent),
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 1000);
  };

  // Temporary function to generate simulated responses
  // This would be replaced with actual API calls to the Taskade agent
  const getSimulatedResponse = (userInput: string, agent: Agent): string => {
    const lowercaseInput = userInput.toLowerCase();
    
    // Generic responses based on the agent type
    if (agent.category === 'shopping') {
      if (lowercaseInput.includes('product') || lowercaseInput.includes('recommend')) {
        return "I'd recommend checking out our cosmic crystal pendants or sound healing bowls. They're currently our most popular items!";
      } else if (lowercaseInput.includes('discount') || lowercaseInput.includes('sale')) {
        return "We currently have a special promotion on our meditation bundles. Use code COSMIC15 for 15% off!";
      }
    } else if (agent.category === 'music') {
      if (lowercaseInput.includes('recommend') || lowercaseInput.includes('suggestion')) {
        return "Based on our latest releases, I think you might enjoy 'Celestial Harmonies' or 'Quantum Resonance'. Both feature binaural beats that are perfect for deep meditation.";
      } else if (lowercaseInput.includes('album') || lowercaseInput.includes('track')) {
        return "Our most popular album right now is 'Cosmic Frequencies Vol. 3'. It features a blend of ambient sounds and healing frequencies.";
      }
    } else if (agent.category === 'education') {
      if (lowercaseInput.includes('learn') || lowercaseInput.includes('teach')) {
        return "I recommend starting with our 'Introduction to Sacred Geometry' or 'Beginner's Guide to Sound Healing'. Both are excellent resources for beginners.";
      } else if (lowercaseInput.includes('meditation') || lowercaseInput.includes('technique')) {
        return "The 432Hz meditation technique is particularly powerful for aligning with the natural frequency of the universe. Would you like me to explain more about it?";
      }
    }
    
    // Default responses
    const defaultResponses = [
      `Thank you for your message. I'm here to help with any questions about ${agent.category}.`,
      `I'm processing your request about "${userInput}". Is there anything specific you'd like to know?`,
      `That's an interesting question! Let me guide you through what we offer related to ${agent.category}.`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  if (!activeAgent) return null;

  return (
    <Card 
      className={cn(
        "cosmic-glass-card cosmic-scale shadow-lg",
        isPopup ? "fixed bottom-20 right-4 z-40 w-full max-w-md" : "w-full h-full"
      )}
    >
      <CardHeader className="p-4 border-b space-y-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 cosmic-avatar">
            <AvatarImage src={activeAgent.avatar} alt={activeAgent.name} />
            <AvatarFallback className="bg-cosmic-primary text-white">
              {activeAgent.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-md cosmic-gradient-text">{activeAgent.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {isPopup && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              {isExpanded ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
              <span className="sr-only">{isExpanded ? "Minimize" : "Maximize"}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-7 w-7 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        "p-0",
        isPopup ? (isExpanded ? "h-[400px]" : "h-[300px]") : "h-[calc(100%-110px)]"
      )}>
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={cn(
                  "flex",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2",
                    message.sender === 'user' 
                      ? "bg-cosmic-primary text-white" 
                      : "bg-white/10 backdrop-blur-md"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow bg-white/5 border-white/10 focus-visible:ring-cosmic-primary"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim()}
            className="cosmic-button"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}