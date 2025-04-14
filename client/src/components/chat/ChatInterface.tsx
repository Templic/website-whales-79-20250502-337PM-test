import React, { useState, useRef, useEffect } from 'react';
import { useChat, ChatMessage } from '@/contexts/ChatContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  isWidget?: boolean;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isWidget = false,
  onClose 
}) => {
  // Get chat context
  const { 
    messages, 
    addMessage, 
    clearChat, 
    highContrastChat, 
    chatFontSize 
  } = useChat();
  
  // Get accessibility context
  const { contrast, reducedMotion } = useAccessibility();
  
  // New message state
  const [newMessage, setNewMessage] = useState('');
  
  // Auto-scroll to bottom of chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Add user message
      addMessage({
        content: newMessage,
        sender: 'user'
      });
      
      // Clear input
      setNewMessage('');

      // Simulate response from Taskade AI Agent
      // In a real implementation, this would be replaced with an actual API call to Taskade
      setTimeout(() => {
        addMessage({
          content: "I'm the Taskade AI assistant. This is a placeholder response. The actual implementation will integrate with the Taskade API.",
          sender: 'agent'
        });
      }, 1000);
    }
  };
  
  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Render timestamp in a human-readable format
  const renderTimestamp = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  // Apply accessibility settings
  const containerClasses = `
    flex flex-col ${isWidget ? 'h-[500px]' : 'h-full min-h-[600px]'} 
    ${highContrastChat ? 'bg-black text-white border-white' : 'bg-background border-border'}
    border rounded-lg shadow-lg overflow-hidden
  `;
  
  const headerClasses = `
    p-4 border-b flex justify-between items-center sticky top-0 z-10
    ${highContrastChat ? 'bg-black text-white border-white' : ''}
  `;
  
  const textareaClasses = `
    min-h-[80px] p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary
    ${highContrastChat ? 'bg-gray-900 text-white border-white' : ''}
  `;
  
  return (
    <div className={containerClasses} style={{ fontSize: `${chatFontSize}%` }}>
      {/* Chat Header */}
      <div className={headerClasses}>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/images/taskade-agent-avatar.png" alt="Taskade AI" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">Taskade AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Ready to help</p>
          </div>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearChat}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              title="Close chat"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Message Area */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="mb-2">
                <Avatar className="h-16 w-16 mx-auto mb-4">
                  <AvatarImage src="/images/taskade-agent-avatar.png" alt="Taskade AI" />
                  <AvatarFallback className="text-xl">AI</AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-lg font-medium mb-2">Welcome to Taskade AI Assistant</h3>
              <p className="text-muted-foreground max-w-md">
                Ask me anything about cosmic music, tours, or any other information about the site!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[80%] rounded-lg px-4 py-2
                  ${message.sender === 'user' 
                    ? highContrastChat 
                      ? 'bg-white text-black ml-auto' 
                      : 'bg-primary text-primary-foreground ml-auto' 
                    : highContrastChat 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-muted'
                  }
                `}>
                  <div className="flex items-center gap-2 mb-1">
                    {message.sender === 'agent' && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="/images/taskade-agent-avatar.png" alt="Taskade AI" />
                        <AvatarFallback className="text-xs">AI</AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-xs opacity-70">
                      {message.sender === 'user' ? 'You' : 'Taskade AI'} · {renderTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <div className={`border-t p-4 ${highContrastChat ? 'border-white' : ''}`}>
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className={textareaClasses}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="self-end"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;