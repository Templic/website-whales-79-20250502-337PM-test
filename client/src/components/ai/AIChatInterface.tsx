import React, { useState, useRef, useEffect } from 'react';
import { useAgents } from '@/contexts/AgentContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizontal, X, Volume2, MicOff, RefreshCw, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIChatInterface() {
  const { activeAgent, messages, sendMessage, deactivateAgent } = useAgents();
  const { voiceEnabled, reducedMotion } = useAccessibility();
  const [messageText, setMessageText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };
  
  // Focus input when agent is activated
  useEffect(() => {
    if (activeAgent && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeAgent]);

  // Speech synthesis
  useEffect(() => {
    if (voiceEnabled && messages.length > 0 && messages[messages.length - 1].role === 'agent') {
      speakMessage(messages[messages.length - 1].content);
    }
  }, [messages, voiceEnabled]);
  
  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      setIsSpeaking(true);
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  
  // Send message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && activeAgent) {
      sendMessage(messageText);
      setMessageText('');
    }
  };
  
  // Close chat handler
  const handleCloseChat = () => {
    stopSpeaking();
    deactivateAgent();
  };
  
  // Early return if no active agent
  if (!activeAgent) {
    return null;
  }
  
  return (
    <Card className="border border-white/10 overflow-hidden rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-white/10 p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activeAgent.avatar} alt={activeAgent.name} />
            <AvatarFallback className="bg-purple-900 text-white">
              {activeAgent.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{activeAgent.name}</h3>
            <p className="text-xs text-white/60">{activeAgent.category}</p>
          </div>
        </div>
        <div className="flex items-center">
          {voiceEnabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isSpeaking ? stopSpeaking : () => {
                if (messages.length > 0 && messages[messages.length - 1].role === 'agent') {
                  speakMessage(messages[messages.length - 1].content);
                }
              }}
              title={isSpeaking ? "Stop speaking" : "Speak last message"}
              className="mr-1"
            >
              {isSpeaking ? <MicOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseChat}
            title="Close chat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Message Area */}
      <ScrollArea className="h-[350px] p-4">
        <div className="space-y-4">
          {messages.filter(m => m.role !== 'system').map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-black/30 border border-white/10'
                }`}
              >
                {message.role === 'agent' && (
                  <div className="flex items-center mb-1">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={activeAgent.avatar} alt={activeAgent.name} />
                      <AvatarFallback className="bg-purple-900 text-white text-xs">
                        {activeAgent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-white/80">{activeAgent.name}</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                <div className="mt-1 text-right">
                  <span className="text-xs text-white/60">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            ref={inputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Ask ${activeAgent.name} a question...`}
            className="flex-1 bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <Button 
            type="submit"
            disabled={!messageText.trim()}
            className="shrink-0"
          >
            <SendHorizontal className="h-4 w-4 mr-1" />
            Send
          </Button>
        </form>
        <div className="mt-2 flex items-center text-xs text-white/50">
          <Info className="h-3 w-3 mr-1" />
          <span>
            {activeAgent.id === 'harmonic-helper'
              ? 'For sound-related questions & frequency guidance'
              : activeAgent.id === 'cosmic-guide'
              ? 'For spiritual guidance & meditation support'
              : activeAgent.id === 'shop-oracle'
              ? 'For product recommendations & shop assistance'
              : 'For wisdom & information about our practices'}
          </span>
        </div>
      </div>
    </Card>
  );
}