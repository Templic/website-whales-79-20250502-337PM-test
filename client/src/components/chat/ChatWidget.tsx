import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/contexts/ChatContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OceanicPortal from './OceanicPortal';

interface ChatWidgetProps {}

const ChatWidget: React.FC<ChatWidgetProps> = () => {
  const { 
    isWidgetVisible, 
    isWidgetOpen, 
    openWidget, 
    closeWidget,
    widgetPosition,
    autoOpenOnNewPage
  } = useChat();

  const { reducedMotion } = useAccessibility();
  const [hasRendered, setHasRendered] = useState(false);
  const mountedRef = useRef(false);

  // Handle auto opening on page load
  useEffect(() => {
    if (!mountedRef.current && autoOpenOnNewPage) {
      mountedRef.current = true;
      // Small delay to ensure smooth animation after page load
      const timer = setTimeout(() => {
        openWidget();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoOpenOnNewPage, openWidget]);

  // Handle initial render
  useEffect(() => {
    setHasRendered(true);
  }, []);

  // Don't render anything if widget not visible
  if (!isWidgetVisible || !hasRendered) {
    return null;
  }

  // Position classes based on widgetPosition
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }[widgetPosition];

  return (
    <div className={`fixed ${positionClasses} z-40`}>
      {/* Floating chat button */}
      <AnimatePresence>
        {!isWidgetOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <Button
              onClick={openWidget}
              className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              aria-label="Open chat widget"
            >
              <MessageCircle size={24} className="text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat widget */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 shadow-xl sm:rounded-xl overflow-hidden"
            style={{ width: 'min(100%, 400px)', height: 'min(90vh, 600px)' }}
          >
            <OceanicPortal isWidget={true} onClose={closeWidget} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;