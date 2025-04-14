import React, { useState, useRef, useEffect } from 'react';
import { useAgents } from '@/contexts/AgentContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  X, 
  ChevronUp, 
  ChevronDown, 
  Send, 
  RefreshCw, 
  Copy, 
  Info, 
  HelpCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
// Define common toast variant types
type ToastVariant = 'default' | 'success' | 'error' | 'warning';

// Message interface
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

// AIChatInterface component
function AIChatInterface() {
  const { activeAgent, deactivateAgent } = useAgents();
  const { reducedMotion, voiceEnabled } = useAccessibility();
  const { toast } = useToast();
  
  // State for the chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: activeAgent ? `Hello! I'm ${activeAgent.name}. ${activeAgent.description}. How can I help you today?` : '',
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(!voiceEnabled);
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [messages, reducedMotion]);
  
  // Initialize text-to-speech
  useEffect(() => {
    setIsMuted(!voiceEnabled);
  }, [voiceEnabled]);
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    
    // Simulate API delay for demo
    try {
      setIsLoading(true);
      
      // In a real implementation, this would be a call to an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate agent response based on personality
      let response = '';
      
      if (activeAgent) {
        // Simulate different responses based on agent personality
        if (activeAgent.category === 'shopping') {
          response = `I'd be happy to help you find some cosmic products! Based on your interests, I recommend exploring our celestial collection.`;
        } else if (activeAgent.category === 'music') {
          response = `The cosmic frequencies you're looking for can be found in our latest album releases. Would you like me to suggest some tracks that align with your energy?`;
        } else if (activeAgent.category === 'education') {
          response = `That's a fascinating question about cosmic consciousness. The concept relates to our interconnectedness with the universe and higher states of awareness.`;
        } else {
          response = `I'm here to assist with your cosmic journey. Could you tell me more about what you're looking for today?`;
        }
      } else {
        response = 'I apologize, but I cannot provide assistance at the moment. Please try again later.';
      }
      
      // Add agent response
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'agent',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // Text-to-speech for agent response
      if (!isMuted && window.speechSynthesis) {
        const speech = new SpeechSynthesisUtterance(response);
        speech.rate = 1;
        speech.pitch = 1;
        window.speechSynthesis.speak(speech);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  };
  
  // Reset the conversation
  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        content: activeAgent ? `Hello! I'm ${activeAgent.name}. ${activeAgent.description}. How can I help you today?` : '',
        sender: 'agent',
        timestamp: new Date()
      }
    ]);
    toast({
      title: 'Conversation Reset',
      description: 'Started a new conversation',
    });
  };
  
  // Copy conversation to clipboard
  const copyConversation = () => {
    const text = messages.map(msg => 
      `${msg.sender === 'user' ? 'You' : activeAgent?.name}: ${msg.content}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: 'Copied to Clipboard',
          description: 'Conversation copied successfully',
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast({
          title: 'Copy Failed',
          description: 'Could not copy conversation to clipboard',
          variant: 'destructive'
        });
      });
  };
  
  // Toggle mute status
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (isMuted) {
      toast({
        title: 'Voice Enabled',
        description: 'Agent responses will be spoken aloud',
      });
    } else {
      // Stop any current speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      toast({
        title: 'Voice Disabled',
        description: 'Agent responses will not be spoken',
      });
    }
  };
  
  // If no active agent, don't render
  if (!activeAgent) return null;
  
  return (
    <Card className="border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activeAgent.avatar} alt={activeAgent.name} />
              <AvatarFallback className="bg-purple-900 text-white">
                {activeAgent.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-white">{activeAgent.name}</h3>
              <p className="text-xs text-white/60">{activeAgent.category}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
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