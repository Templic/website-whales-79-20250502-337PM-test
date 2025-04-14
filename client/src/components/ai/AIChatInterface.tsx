import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  RefreshCw, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Volume2,
  VolumeX,
  Copy, 
  Info, 
  HelpCircle 
} from 'lucide-react';
import { useAgents } from '@/contexts/AgentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export function AIChatInterface() {
  const { activeAgent, deactivateAgent, isLoading } = useAgents();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Add greeting message when agent changes
  useEffect(() => {
    if (activeAgent && messages.length === 0) {
      const greetingMessage: Message = {
        id: `agent-greeting-${Date.now()}`,
        sender: 'agent',
        content: activeAgent.greeting,
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
    }
  }, [activeAgent, messages.length]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeAgent) return;
    
    // Create and add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    
    // Simulate agent response (in a real app, this would call an AI service)
    setTimeout(() => {
      generateResponse(userMessage.content);
      setIsSending(false);
    }, 1500);
  };
  
  // Generate agent response (simulated)
  const generateResponse = (userQuery: string) => {
    if (!activeAgent) return;
    
    // Simple response simulation based on query content
    let responseText = '';
    
    // Basic pattern matching for demo purposes
    if (/help|assist|support/i.test(userQuery)) {
      responseText = `I'd be happy to help you! As ${activeAgent.name}, I can ${activeAgent.capabilities.join(', ')}. What specific assistance do you need?`;
    } 
    else if (/who are you|what can you do|capabilities/i.test(userQuery)) {
      responseText = `I am ${activeAgent.name}, your cosmic assistant. My capabilities include ${activeAgent.capabilities.join(', ')}. I communicate in a ${activeAgent.personality.tone} tone, with a ${activeAgent.personality.style} style.`;
    }
    else if (/thank|thanks/i.test(userQuery)) {
      responseText = "You're welcome! I'm glad I could assist you on your cosmic journey. Is there anything else you'd like to explore?";
    }
    else {
      // Default responses based on agent category
      const responses = {
        shopping: "I can help you find the perfect cosmic products for your journey. Would you like me to suggest some popular items or help you find something specific?",
        music: "Music is a gateway to cosmic consciousness. I can guide you through our frequency-attuned tracks or explain the healing properties of specific sounds. What are you interested in exploring?",
        education: "The cosmos contains infinite wisdom. I'd be happy to explain cosmic concepts, guide you through meditation techniques, or help you understand sacred geometry. Where would you like to begin?",
        general: "I'm here to guide you through Dale's cosmic universe. I can help with navigation, answer questions about the website, or direct you to specific resources. How can I assist your journey today?"
      };
      
      responseText = responses[activeAgent.category as keyof typeof responses] || 
        "I understand your question. Let me guide you through our cosmic offerings to find what resonates with your journey.";
    }
    
    const agentResponse: Message = {
      id: `agent-${Date.now()}`,
      sender: 'agent',
      content: responseText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, agentResponse]);
    
    // Text-to-speech if not muted
    if (!isMuted && 'speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(responseText);
      speech.rate = 0.9;
      speech.pitch = 1;
      window.speechSynthesis.speak(speech);
    }
  };
  
  // Reset conversation
  const handleReset = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
    
    setMessages([]);
    
    // Add greeting message after reset
    if (activeAgent) {
      setTimeout(() => {
        const greetingMessage: Message = {
          id: `agent-greeting-${Date.now()}`,
          sender: 'agent',
          content: activeAgent.greeting,
          timestamp: new Date()
        };
        setMessages([greetingMessage]);
      }, 300);
    }
    
    toast({
      title: "Conversation Reset",
      description: "Starting a new conversation with your cosmic guide.",
    });
  };
  
  // Toggle mute state
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (!isMuted && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop speech if muting
    }
    
    toast({
      title: isMuted ? "Voice Enabled" : "Voice Disabled",
      description: isMuted ? "Agent responses will now be spoken" : "Agent responses will be text only",
    });
  };
  
  // Copy conversation to clipboard
  const copyConversation = () => {
    const conversationText = messages
      .map(msg => `${msg.sender === 'user' ? 'You' : activeAgent?.name}: ${msg.content}`)
      .join('\n\n');
      
    navigator.clipboard.writeText(conversationText);
    
    toast({
      title: "Copied to Clipboard",
      description: "The entire conversation has been copied to your clipboard.",
    });
  };
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!activeAgent) return null;
  
  return (
    <Card className="h-full relative overflow-hidden cosmic-glass-card shadow-glow">
      {/* Header */}
      <div className="border-b border-white/10 p-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 cosmic-avatar">
              <AvatarImage src={activeAgent.avatar} alt={activeAgent.name} />
              <AvatarFallback className="bg-cosmic-primary text-white">
                {activeAgent.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{activeAgent.name}</h3>
              <p className="text-sm text-white/70">{activeAgent.personality.tone}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              title={isMuted ? "Enable voice" : "Disable voice"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white/70" />
              ) : (
                <Volume2 className="h-5 w-5 text-white/70" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleReset}
              title="Reset conversation"
            >
              <RefreshCw className="h-5 w-5 text-white/70" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={copyConversation}
              title="Copy conversation"
            >
              <Copy className="h-5 w-5 text-white/70" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-white/70" />
              ) : (
                <ChevronUp className="h-5 w-5 text-white/70" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={deactivateAgent}
              title="Close chat"
            >
              <X className="h-5 w-5 text-white/70" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Agent Info Banner */}
      <div className="bg-cosmic-secondary/20 px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-white/60" />
          <p className="text-xs text-white/60">
            {activeAgent.description}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          <span>Help</span>
        </Button>
      </div>
      
      {/* Chat Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "calc(100% - 142px)" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-[calc(100vh-370px)] w-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-l-2xl rounded-tr-2xl'
                            : 'bg-gradient-to-r from-slate-800/50 to-slate-700/40 rounded-r-2xl rounded-tl-2xl'
                        } p-3`}
                      >
                        {message.sender === 'agent' && (
                          <div className="flex items-center mb-2">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={activeAgent.avatar} alt={activeAgent.name} />
                              <AvatarFallback className="text-xs bg-purple-900">
                                {activeAgent.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-white/80">{activeAgent.name}</span>
                          </div>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <div
                          className={`text-xs mt-1 ${
                            message.sender === 'user' ? 'text-right' : 'text-left'
                          } text-white/50`}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="bg-white/5 border-white/10 focus:border-white/30"
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isSending || isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isSending ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}

export default AIChatInterface;