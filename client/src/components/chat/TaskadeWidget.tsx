import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { X, MessageSquare, Loader2, SendIcon, ChevronUp, ExternalLink } from 'lucide-react';
import TaskadeEmbed from './TaskadeEmbed';

interface TaskadeWidgetProps {
  enabled?: boolean;
  taskadeId?: string;
  title?: string;
  theme?: 'light' | 'dark' | 'system';
  style?: 'basic' | 'taskade' | 'oceanic';
  enableMemory?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showBranding?: boolean;
  greetingMessage?: string;
}

/**
 * Enhanced floating chat widget component using TaskadeEmbed
 * 
 * This widget provides a fixed position chat bubble that opens
 * into a fully-featured Taskade AI assistant chat window.
 * 
 * Supports three different style modes:
 * - basic: Simple, minimal styling
 * - taskade: Styled to match Taskade's native UI (default)
 * - oceanic: Ocean-themed styling with blue gradients
 */
const TaskadeWidget: React.FC<TaskadeWidgetProps> = ({
  enabled = true,
  taskadeId = '01JRV02MYWJW6VJS9XGR1VB5J4',
  title = 'Cosmic Assistant',
  theme = 'system',
  style = 'taskade',
  enableMemory = true,
  position = 'bottom-right',
  showBranding = true,
  greetingMessage = "Ask me about cosmic consciousness and sacred geometry."
}) => {
  const { reducedMotion } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
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
    } else {
      // When closing, reset the greeting to be shown next time
      setTimeout(() => {
        setShowGreeting(true);
      }, 300);
    }
  };
  
  // Handle window message events from TaskadeEmbed
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        if (event.data.type === 'taskade-loaded') {
          setLoading(false);
        } else if (event.data.type === 'taskade-error') {
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

  // Dismiss the greeting bubble
  const dismissGreeting = () => {
    setShowGreeting(false);
  };
  
  if (!enabled) return null;
  
  // Button & gradient styles based on the selected style mode
  const getStyleClasses = () => {
    switch (style) {
      case 'basic':
        return {
          button: "bg-primary hover:bg-primary/90",
          gradient: "",
          loaderBorder: "border-primary",
          greetingBg: "bg-background border-border",
          windowBg: "bg-background border-border",
          headerBg: "bg-muted/50",
          iconBg: "bg-primary"
        };
      case 'oceanic':
        return {
          button: "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600",
          gradient: "bg-gradient-to-br from-blue-600 to-cyan-500",
          loaderBorder: "border-cyan-500",
          greetingBg: "bg-slate-900 border-slate-800",
          windowBg: "bg-slate-900 border-slate-800",
          headerBg: "bg-slate-900 border-slate-800",
          iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500"
        };
      case 'taskade':
      default:
        return {
          button: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95",
          gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
          loaderBorder: "border-indigo-500",
          greetingBg: "bg-black border-neutral-800",
          windowBg: "bg-black border-neutral-800",
          headerBg: "bg-black border-neutral-800",
          iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600"
        };
    }
  };

  const styles = getStyleClasses();
  
  return (
    <div className={`fixed ${positionClasses} z-50`} ref={containerRef}>
      {/* Chat button */}
      {!isOpen && (
        <div className="relative">
          {/* Greeting bubble */}
          {showGreeting && (
            <div 
              className={`absolute bottom-16 right-0 w-64 ${styles.greetingBg} text-white rounded-lg shadow-lg p-3 mb-2 animate-fade-in-slide-up`}
              style={{
                transition: reducedMotion ? 'none' : 'all 0.2s ease',
              }}
            >
              <button 
                className="absolute top-2 right-2 text-neutral-400 hover:text-white" 
                onClick={dismissGreeting}
                aria-label="Dismiss greeting"
              >
                <X size={14} />
              </button>
              <p className="text-sm pr-4">{greetingMessage}</p>
              <div className={`absolute -bottom-2 right-5 w-4 h-4 ${styles.greetingBg} border-r border-b transform rotate-45`}></div>
            </div>
          )}
          
          {/* Chat button */}
          <button
            onClick={toggleWidget}
            className={`h-14 w-14 rounded-full flex items-center justify-center shadow-xl ${styles.button} ${
              reducedMotion ? '' : 'animate-pulse-subtle'
            }`}
            title="Open AI Chat Assistant"
            aria-label="Open AI Chat"
          >
            <MessageSquare className="h-6 w-6 text-white" />
            
            {/* Brand label (optional) */}
            {showBranding && (
              <span className={`absolute -top-10 right-0 whitespace-nowrap ${style === 'basic' ? 'bg-background/90' : 'bg-black/80 backdrop-blur-sm'} px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg border ${style === 'basic' ? 'border-border' : 'border-neutral-800'}`}>
                Powered by Taskade AI
              </span>
            )}
          </button>
        </div>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div 
          className={`w-[350px] md:w-[400px] h-[520px] overflow-hidden rounded-xl shadow-2xl border ${styles.windowBg}`}
          style={{
            transition: reducedMotion ? 'none' : 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
            opacity: isOpen ? 1 : 0
          }}
        >
          {/* Chat header */}
          <div className={`py-3 px-4 ${styles.headerBg} text-white border-b flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 flex items-center justify-center rounded-lg ${styles.iconBg}`}>
                <MessageSquare size={14} className="text-white" />
              </div>
              <span className="text-sm font-medium">{title}</span>
              {loading && (
                <div className={`w-3 h-3 rounded-full border border-neutral-800 ${style === 'basic' ? 'border-t-primary' : style === 'oceanic' ? 'border-t-cyan-500' : 'border-t-white'} animate-spin ml-2`}></div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors"
                onClick={() => window.open(`https://www.taskade.com/a/${taskadeId}`, '_blank')}
                title="Open in new window"
                aria-label="Open in new window"
              >
                <ExternalLink size={14} className="text-neutral-400" />
              </button>
              
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors"
                onClick={toggleWidget}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={14} className="text-neutral-400" />
              </button>
            </div>
          </div>
          
          {/* Main chat area */}
          <div className="flex-1 relative h-[calc(100%-48px)]">
            {/* Use the enhanced TaskadeEmbed component */}
            <TaskadeEmbed 
              className="w-full h-full"
              taskadeId={taskadeId}
              title={title}
              view="widget" 
              showToolbar={false}
              enableMemory={enableMemory}
              theme={theme === 'system' ? 'dark' : theme} 
              style={style}
              showCapabilities={true}
            />
            
            {/* Loading overlay */}
            {loading && (
              <div className={`absolute inset-0 flex items-center justify-center ${
                style === 'basic' 
                  ? 'bg-background/90' 
                  : style === 'oceanic' 
                  ? 'bg-slate-900/90 backdrop-blur-sm' 
                  : 'bg-black/80 backdrop-blur-sm'
              } z-50`}>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full border-2 ${
                    style === 'basic' 
                      ? 'border-background border-t-primary' 
                      : style === 'oceanic' 
                      ? 'border-slate-800 border-t-cyan-500' 
                      : 'border-neutral-800 border-t-indigo-500'
                  } animate-spin mx-auto mb-4`}></div>
                  <p className="text-sm text-neutral-400">Loading {title}...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskadeWidget;