import React, { useState, useEffect, useRef } from 'react';
import { useAgents } from '@/contexts/AgentContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatInterface from './AIChatInterface';
import { Button } from '@/components/ui/button';
import { ChevronUp, MessageCircle, X } from 'lucide-react';

export function AIAgentProvider() {
  const { activeAgent, deactivateAgent } = useAgents();
  const { reducedMotion } = useAccessibility();
  const [isMinimized, setIsMinimized] = useState(false);
  const providerRef = useRef<HTMLDivElement>(null);
  
  // Handle clicking outside the chat interface to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (providerRef.current && !providerRef.current.contains(event.target as Node)) {
        // Only close if clicking outside and not minimized
        if (!isMinimized && activeAgent) {
          setIsMinimized(true);
        }
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMinimized, activeAgent]);
  
  // Minimize chat
  const handleMinimize = () => {
    setIsMinimized(true);
  };
  
  // Maximize chat
  const handleMaximize = () => {
    setIsMinimized(false);
  };
  
  // Close chat
  const handleClose = () => {
    deactivateAgent();
    setIsMinimized(false);
  };
  
  // If no active agent, don't render anything
  if (!activeAgent) return null;
  
  return (
    <div className="fixed bottom-5 right-5 z-50" ref={providerRef}>
      <AnimatePresence mode="wait">
        {isMinimized ? (
          // Minimized button
          <motion.div
            key="minimized"
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.5 }}
            transition={{ 
              duration: reducedMotion ? 0 : 0.2,
              ease: 'easeOut' 
            }}
            className="flex flex-col items-end"
          >
            <Button
              onClick={handleMaximize}
              className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg p-0 flex items-center justify-center"
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-2.5 h-2.5 border border-white"></span>
              </div>
            </Button>
            <div className="mt-2 px-3 py-1.5 bg-black/70 text-white/80 text-xs rounded-full shadow-lg backdrop-blur-sm">
              {activeAgent.name}
            </div>
          </motion.div>
        ) : (
          // Full chat interface
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ 
              duration: reducedMotion ? 0 : 0.3,
              ease: 'easeOut' 
            }}
            className="w-96 max-w-[calc(100vw-2rem)] shadow-2xl"
          >
            <div className="absolute -top-12 right-0 flex gap-2">
              <Button
                onClick={handleMinimize}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full bg-black/50 border-white/20"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleClose}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full bg-black/50 border-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AIChatInterface />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AIAgentProvider;