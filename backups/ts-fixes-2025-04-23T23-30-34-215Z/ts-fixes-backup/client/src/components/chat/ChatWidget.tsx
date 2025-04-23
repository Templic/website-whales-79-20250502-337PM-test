import React, { useState, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OceanicPortal from './OceanicPortal';

const ChatWidget: React.FC = () => {
  const { 
    isOpen, 
    openChat, 
    closeChat, 
    toggleChat, 
    isWidgetVisible,
    widgetPosition 
  } = useChat();
  
  const { reducedMotion } = useAccessibility();
  const [firstLoad, setFirstLoad] = useState(true);
  
  // Remove first load state after initial animation
  useEffect(() => {
    if (firstLoad) {
      const timer = setTimeout(() => setFirstLoad(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [firstLoad]);
  
  // Don't render anything if widget isn't visible
  if (!isWidgetVisible) return null;
  
  // Determine position classes based on widget position setting
  const getPositionClasses = () => {
    switch(widgetPosition) {
      case 'bottom-right': 
        return 'bottom-4 right-4';
      case 'bottom-left': 
        return 'bottom-4 left-4';
      case 'top-right': 
        return 'top-4 right-4';
      case 'top-left': 
        return 'top-4 left-4';
      default: 
        return 'bottom-4 right-4';
    }
  };
  
  return (
    <>
      {/* Floating button */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="chat-widget-button"
            initial={firstLoad ? { scale: 0, opacity: 0 } : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: reducedMotion ? 0.1 : 0.5 }}
            className={`fixed z-50 ${getPositionClasses()}`}
          >
            <Button
              onClick={openChat}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all group"
            >
              <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              <span className="sr-only">Open Chat</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-widget-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.3 }}
            className={`fixed z-50 ${widgetPosition.includes('top') ? 'top-4' : 'bottom-4'} ${widgetPosition.includes('right') ? 'right-4' : 'left-4'}`}
          >
            <div className="relative w-[380px] h-[600px] rounded-xl overflow-hidden shadow-2xl border border-blue-500/30 bg-background/80 backdrop-blur-sm">
              <OceanicPortal isWidget={true} onClose={closeChat} />
              
              {/* Close button outside of OceanicPortal */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeChat}
                className="absolute top-3 right-3 z-[51] h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm text-muted-foreground hover:bg-background/70 hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;