import React, { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskadeWidgetProps {
  enabled?: boolean;
}

// Our custom chat widget instead of using Taskade's widget
const TaskadeWidget: React.FC<TaskadeWidgetProps> = ({ enabled = true }) => {
  const { reducedMotion } = useAccessibility();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // The Taskade ID
  const taskadeId = '01JRV02MYWJW6VJS9XGR1VB5J4';
  
  // Use our custom embed page
  const embedUrl = `/taskade-embed?id=${taskadeId}`;
  
  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };
  
  // Clean up any existing Taskade widgets that might have been created
  useEffect(() => {
    if (!enabled) return;
    
    return () => {
      // Remove any Taskade widget elements that might have been created by the original widget
      const widgetElements = document.querySelectorAll('[id^="taskade-agent-widget"]');
      widgetElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [enabled]);
  
  if (!enabled) return null;
  
  // Create our own widget UI instead of using Taskade's
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      {!isOpen && (
        <Button 
          onClick={toggleWidget} 
          className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg bg-primary hover:bg-primary/90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </Button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div className="w-[350px] h-[500px] bg-background rounded-lg shadow-xl border overflow-hidden flex flex-col">
          <div className="p-3 bg-primary text-primary-foreground flex justify-between items-center">
            <h3 className="font-medium">Cosmic Assistant</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleWidget} 
              className="h-8 w-8 rounded-full hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1">
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title="Taskade AI Chat"
              className="w-full h-full border-0"
              style={{
                transition: reducedMotion ? 'none' : 'opacity 0.3s ease'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskadeWidget;