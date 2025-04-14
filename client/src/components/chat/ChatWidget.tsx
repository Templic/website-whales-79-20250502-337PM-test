import React, { useEffect, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import ChatInterface from './ChatInterface';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Map position string to actual position values for styling
const positionMap = {
  'bottom-right': { bottom: '1.5rem', right: '1.5rem' },
  'bottom-left': { bottom: '1.5rem', left: '1.5rem' },
  'top-right': { top: '1.5rem', right: '1.5rem' },
  'top-left': { top: '1.5rem', left: '1.5rem' }
};

const ChatWidget = () => {
  const { 
    isChatOpen, 
    openChat, 
    closeChat, 
    widgetPosition, 
    isWidgetVisible,
    highContrastChat
  } = useChat();
  
  const { reducedMotion } = useAccessibility();
  
  // Determine position styles based on widget position setting
  const positionStyles = positionMap[widgetPosition];
  
  // Support for mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount and window resize
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // If widget is hidden, don't render anything
  if (!isWidgetVisible) return null;
  
  // For mobile devices, use a Sheet component for better UX
  if (isMobile) {
    return (
      <>
        {/* Floating action button */}
        <Button
          onClick={openChat}
          className={`
            rounded-full w-14 h-14 p-0 fixed z-50 shadow-lg
            ${highContrastChat ? 'bg-white text-black hover:bg-gray-200' : ''}
            transition-all ${reducedMotion ? '' : 'duration-300 hover:scale-110'}
          `}
          style={{
            ...positionStyles,
            animation: reducedMotion ? 'none' : 'pulse 2s infinite'
          }}
          aria-label="Open chat assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        
        {/* Mobile sheet/drawer for chat */}
        <Sheet open={isChatOpen} onOpenChange={isChatOpen ? closeChat : openChat}>
          <SheetContent className="p-0 sm:max-w-md" side="bottom">
            <div className="h-[85vh]">
              <ChatInterface isWidget onClose={closeChat} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }
  
  // For desktop, render a floating widget with animation
  return (
    <>
      {/* Button to open chat */}
      {!isChatOpen && (
        <Button
          onClick={openChat}
          className={`
            rounded-full w-14 h-14 p-0 fixed z-50 shadow-lg
            ${highContrastChat ? 'bg-white text-black hover:bg-gray-200' : ''}
            transition-all ${reducedMotion ? '' : 'duration-300 hover:scale-110'}
          `}
          style={{
            ...positionStyles,
            animation: reducedMotion ? 'none' : 'pulse 2s infinite'
          }}
          aria-label="Open chat assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
      
      {/* Chat popup */}
      {isChatOpen && (
        <div 
          className={`
            fixed z-50 shadow-xl rounded-lg overflow-hidden
            transition-all ${reducedMotion ? '' : 'duration-300'}
            w-[400px] max-w-[calc(100vw-2rem)]
          `}
          style={positionStyles}
        >
          <ChatInterface isWidget onClose={closeChat} />
        </div>
      )}
    </>
  );
};

export default ChatWidget;