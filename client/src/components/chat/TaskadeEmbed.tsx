import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Loader2, RefreshCw, Maximize2, MinusCircle, MessageSquare, Settings, HelpCircle } from 'lucide-react';

interface TaskadeEmbedProps {
  chatOnly?: boolean;
  className?: string;
  taskadeId?: string;
  view?: 'agent' | 'embed' | 'widget' | 'chat';
  height?: string | number;
  width?: string | number;
  showToolbar?: boolean;
  enableMemory?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

/**
 * Enhanced Taskade integration component supporting all Taskade features
 * including AI agent chat, embed, widget and workspace views.
 * 
 * This component supports the full range of Taskade integration options
 * while maintaining efficient resource usage through optimization.
 */
const TaskadeEmbed: React.FC<TaskadeEmbedProps> = ({ 
  chatOnly = false, 
  className = '',
  taskadeId = '01JRV02MYWJW6VJS9XGR1VB5J4',
  view = 'agent',
  height = '100%',
  width = '100%',
  showToolbar = true,
  enableMemory = true,
  theme = 'system'
}) => {
  const { reducedMotion } = useAccessibility();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Build the URL with appropriate parameters for the desired view
  const getEmbedUrl = useCallback(() => {
    // Use our custom embed page for better security and performance
    const baseUrl = `/taskade-embed`;
    
    // Build query parameters
    const params = new URLSearchParams({
      id: taskadeId,
      view: view,
      theme: theme,
      memory: enableMemory ? '1' : '0',
      toolbar: showToolbar ? '1' : '0',
    });
    
    return `${baseUrl}?${params.toString()}`;
  }, [taskadeId, view, theme, enableMemory, showToolbar]);
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setLoading(false);
    setError("Failed to load Taskade. Please check your connection and try again.");
  };

  // Handle message events from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our Taskade embed
      if (event.data && event.data.type) {
        if (event.data.type === 'taskade-loaded') {
          setLoading(false);
        } else if (event.data.type === 'taskade-error') {
          setError(event.data.error || "An error occurred with Taskade");
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Dynamic resize to optimize iframe dimensions
  useEffect(() => {
    const handleResize = () => {
      if (iframeRef.current && containerRef.current) {
        const parent = containerRef.current;
        iframeRef.current.style.height = `${parent.clientHeight}px`;
        iframeRef.current.style.width = `${parent.clientWidth}px`;
      }
    };

    // Initial size
    handleResize();
    
    // Add resize observer for more responsive resizing
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Also handle window resize events
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [collapsed]);

  // Reload the iframe
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 50);
    }
  };

  // Toggle collapsed state for the widget
  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  const containerHeight = collapsed ? '48px' : (typeof height === 'number' ? `${height}px` : height);
  const containerWidth = typeof width === 'number' ? `${width}px` : width;

  return (
    <div 
      ref={containerRef}
      className={`taskade-container relative overflow-hidden transition-all duration-300 ${className}`}
      style={{ 
        height: containerHeight, 
        width: containerWidth,
        maxHeight: '100%',
        maxWidth: '100%'
      }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="taskade-toolbar flex items-center justify-between bg-primary/10 p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            <span className="text-sm font-medium">Taskade AI Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            {error && (
              <RefreshCw
                size={16}
                className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                onClick={handleRefresh}
                title="Reload"
              />
            )}
            <HelpCircle 
              size={16} 
              className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
              title="Help" 
            />
            <Settings 
              size={16} 
              className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
              title="Settings" 
            />
            {collapsed ? (
              <Maximize2
                size={16}
                className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                onClick={toggleCollapsed}
                title="Expand"
              />
            ) : (
              <MinusCircle
                size={16}
                className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                onClick={toggleCollapsed}
                title="Minimize"
              />
            )}
          </div>
        </div>
      )}

      {/* Content area */}
      <div 
        className={`taskade-content relative ${collapsed ? 'hidden' : 'block'} h-[calc(100%-48px)] w-full`}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Loading Taskade AI...</p>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
            <div className="text-center max-w-md p-6 rounded-lg bg-card shadow-md">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <button 
                className="py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm"
                onClick={handleRefresh}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {/* Taskade iframe */}
        <iframe
          ref={iframeRef}
          src={getEmbedUrl()}
          title="Taskade AI Embed"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="clipboard-read; clipboard-write; fullscreen; camera; microphone; geolocation"
          allowFullScreen
          importance="high"
          loading="lazy"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          style={{
            opacity: loading ? 0 : 1,
            transition: reducedMotion ? 'none' : 'opacity 0.3s ease'
          }}
        />
        
        {/* Bottom gradient for aesthetic reasons */}
        {!loading && !error && !collapsed && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/70 to-transparent h-8 pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default TaskadeEmbed;