import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskadeEmbed from './TaskadeEmbed';

interface TaskadeWidgetProps {
  enabled?: boolean;
  taskadeId?: string;
  theme?: 'light' | 'dark' | 'system';
  enableMemory?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showBranding?: boolean;
}

/**
 * Enhanced floating chat widget component using TaskadeEmbed
 * 
 * This widget provides a fixed position chat bubble that opens
 * into a fully-featured Taskade AI assistant chat window.
 */
const TaskadeWidget: React.FC<TaskadeWidgetProps> = ({
  enabled = true,
  taskadeId = '01JRV02MYWJW6VJS9XGR1VB5J4',
  theme = 'system',
  enableMemory = true,
  position = 'bottom-right',
  showBranding = false
}) => {
  const { reducedMotion } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }[position];
  
  const toggleWidget = () => {
    setIsOpen(prev => !prev);
    
    if (!isOpen) {
      setLoading(true);
      // Loading will be handled by TaskadeEmbed component
    }
  };
  
  // Handle window message events from TaskadeEmbed
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        if (event.data.type === 'taskade-loaded') {
          setLoading(false);
        } else if (event.data.type === 'taskade-close') {
          setIsOpen(false);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Clean up any existing Taskade widgets that might have been created
  useEffect(() => {
    if (!enabled) return;
    
    return () => {
      // Remove any Taskade widget elements that might have been auto-injected
      const widgetElements = document.querySelectorAll('[id^="taskade-agent-widget"]');
      widgetElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [enabled]);
  
  // Handle keyboard shortcuts (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  
  if (!enabled) return null;
  
  return (
    <div className={`fixed ${positionClasses} z-50`} ref={containerRef}>
      {/* Chat button */}
      {!isOpen && (
        <Button 
          onClick={toggleWidget} 
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg bg-primary hover:bg-primary/90 ${
            reducedMotion ? '' : 'animate-pulse-subtle'
          }`}
          title="Open AI Chat Assistant"
        >
          <MessageSquare className="h-6 w-6 text-primary-foreground" />
          {showBranding && (
            <span className="absolute -top-10 whitespace-nowrap bg-background/90 px-2 py-1 rounded text-xs font-medium shadow">
              Powered by Taskade AI
            </span>
          )}
        </Button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div 
          className="w-[350px] md:w-[400px] h-[500px] bg-background rounded-lg shadow-xl border overflow-hidden flex flex-col"
          style={{
            transition: reducedMotion ? 'none' : 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
            opacity: isOpen ? 1 : 0
          }}
        >
          <div className="p-3 bg-primary text-primary-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <h3 className="font-medium text-sm">Cosmic Assistant</h3>
              {loading && <Loader2 className="h-3 w-3 ml-2 animate-spin" />}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleWidget} 
              className="h-8 w-8 rounded-full hover:bg-primary-foreground/20"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <TaskadeEmbed 
              className="w-full h-full"
              taskadeId={taskadeId}
              view="widget" 
              showToolbar={false}
              enableMemory={enableMemory}
              theme={theme}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskadeWidget;