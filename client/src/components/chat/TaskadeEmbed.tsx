import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { 
  Loader2, RefreshCw, Maximize2, MinusCircle, MessageSquare, 
  Settings, HelpCircle, ExternalLink, Copy, ChevronDown, SendIcon
} from 'lucide-react';

interface TaskadeEmbedProps {
  chatOnly?: boolean;
  className?: string;
  taskadeId?: string;
  title?: string;
  view?: 'agent' | 'embed' | 'widget' | 'chat';
  height?: string | number;
  width?: string | number;
  showToolbar?: boolean;
  enableMemory?: boolean;
  theme?: 'light' | 'dark' | 'system';
  style?: 'basic' | 'taskade' | 'oceanic';
  showCapabilities?: boolean;
}

interface CapabilityProps {
  icon: React.ReactNode;
  title: string;
  description: string;
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
  title = 'Cosmic Assistant',
  view = 'agent',
  height = '100%',
  width = '100%',
  showToolbar = true,
  enableMemory = true,
  theme = 'system',
  style = 'taskade',
  showCapabilities = true
}) => {
  const { reducedMotion } = useAccessibility();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [capabilitiesVisible, setCapabilitiesVisible] = useState(true);
  
  // Predefined Taskade agent capabilities based on reference images
  const capabilities: CapabilityProps[] = [
    {
      icon: <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white">1</div>,
      title: "Knowledge Access",
      description: "Access cosmic consciousness insights and sacred geometry meanings"
    },
    {
      icon: <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white">2</div>,
      title: "Creative Assistance",
      description: "Help with visualization techniques and meditation guidance"
    },
    {
      icon: <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">3</div>,
      title: "Music Exploration",
      description: "Discover music aligned with cosmic frequencies and intentions"
    }
  ];
  
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
      style: style,
    });
    
    return `${baseUrl}?${params.toString()}`;
  }, [taskadeId, view, theme, enableMemory, showToolbar, style]);
  
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

  // Toggle capabilities display
  const toggleCapabilities = () => {
    setCapabilitiesVisible(prev => !prev);
  };

  const containerHeight = collapsed ? '48px' : (typeof height === 'number' ? `${height}px` : height);
  const containerWidth = typeof width === 'number' ? `${width}px` : width;

  // Get style classes based on the selected style
  const getStyleClasses = () => {
    switch (style) {
      case 'basic':
        return {
          border: "border border-border dark:border-border rounded-xl overflow-hidden",
          background: view === 'agent' || view === 'chat' 
            ? "bg-card dark:bg-card"
            : "bg-background dark:bg-background",
          toolbarBg: "bg-muted/50 dark:bg-muted/50",
          toolbarBorder: "border-border dark:border-border",
          iconBg: "bg-primary dark:bg-primary",
          capabilitiesBg: "bg-card dark:bg-card",
          capabilitiesItemHover: "hover:bg-muted/50 dark:hover:bg-muted/50",
          inputBg: "bg-muted/50 dark:bg-muted/50 border-border dark:border-border",
          buttonBg: "bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90",
          loaderBorder: "border-muted dark:border-muted border-t-primary dark:border-t-primary",
          loadingBg: "bg-background/90 dark:bg-background/90",
          errorBg: "bg-card dark:bg-card border-border dark:border-border",
          footerBg: "bg-muted/20 dark:bg-muted/20 border-border dark:border-border"
        };
      case 'oceanic':
        return {
          border: "border border-slate-800 dark:border-slate-800 rounded-xl overflow-hidden",
          background: view === 'agent' || view === 'chat' 
            ? "bg-slate-900 dark:bg-gradient-to-br from-slate-900 via-blue-900/40 to-slate-900"
            : "bg-slate-800 dark:bg-slate-800",
          toolbarBg: "bg-slate-900 dark:bg-slate-900",
          toolbarBorder: "border-slate-800 dark:border-slate-800",
          iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
          capabilitiesBg: "bg-slate-900 dark:bg-slate-900",
          capabilitiesItemHover: "hover:bg-slate-800 dark:hover:bg-slate-800",
          inputBg: "bg-slate-800 dark:bg-slate-800 border-slate-700 dark:border-slate-700",
          buttonBg: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
          loaderBorder: "border-slate-800 border-t-cyan-500",
          loadingBg: "bg-slate-900/90 backdrop-blur-sm",
          errorBg: "bg-slate-800 dark:bg-slate-800 border-slate-700 dark:border-slate-700",
          footerBg: "bg-slate-900 dark:bg-slate-900 border-slate-800 dark:border-slate-800"
        };
      case 'taskade':
      default:
        return {
          border: "border border-neutral-800 dark:border-neutral-700 rounded-xl overflow-hidden",
          background: view === 'agent' || view === 'chat' 
            ? "bg-black dark:bg-gradient-to-br from-black via-gray-900 to-gray-900"
            : "bg-background",
          toolbarBg: "bg-black dark:bg-black",
          toolbarBorder: "border-neutral-800 dark:border-neutral-800",
          iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
          capabilitiesBg: "bg-black dark:bg-black",
          capabilitiesItemHover: "hover:bg-neutral-900 dark:hover:bg-neutral-900",
          inputBg: "bg-neutral-900 dark:bg-neutral-900 border-neutral-800 dark:border-neutral-800",
          buttonBg: "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700",
          loaderBorder: "border-neutral-800 border-t-indigo-500",
          loadingBg: "bg-black/90 backdrop-blur-sm",
          errorBg: "bg-neutral-900 dark:bg-neutral-900 border-neutral-800 dark:border-neutral-800",
          footerBg: "bg-black dark:bg-black border-neutral-800 dark:border-neutral-800"
        };
    }
  };
  
  const styles = getStyleClasses();

  return (
    <div 
      ref={containerRef}
      className={`taskade-container relative overflow-hidden transition-all duration-300 ${styles.border} ${className}`}
      style={{ 
        height: containerHeight, 
        width: containerWidth,
        maxHeight: '100%',
        maxWidth: '100%'
      }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className={`taskade-toolbar flex items-center justify-between ${styles.toolbarBg} py-3 px-4 border-b ${styles.toolbarBorder} shadow-sm`}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 flex items-center justify-center rounded-lg ${styles.iconBg}`}>
              <MessageSquare size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-white">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors"
                onClick={handleRefresh}
                title="Reload"
                aria-label="Reload Taskade"
              >
                <RefreshCw size={14} className="text-white" />
              </button>
            )}
            <button 
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors"
              title="Open in new window" 
              aria-label="Open in new window"
              onClick={() => window.open(`https://www.taskade.com/a/${taskadeId}`, '_blank')}
            >
              <ExternalLink size={14} className="text-neutral-400" />
            </button>
            {collapsed ? (
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors"
                onClick={toggleCollapsed}
                title="Expand"
                aria-label="Expand chat"
              >
                <Maximize2 size={14} className="text-neutral-400" />
              </button>
            ) : (
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-800 transition-colors"
                onClick={toggleCollapsed}
                title="Minimize"
                aria-label="Minimize chat"
              >
                <MinusCircle size={14} className="text-neutral-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content area */}
      <div 
        className={`taskade-content relative ${collapsed ? 'hidden' : 'flex flex-col'} h-[calc(100%-48px)] w-full ${styles.background}`}
      >
        {/* Capabilities section - shown while loading or when agent view is first opened */}
        {showCapabilities && !error && (view === 'agent' || view === 'chat') && capabilitiesVisible && (
          <div className={`taskade-capabilities px-4 py-5 flex flex-col ${styles.capabilitiesBg} text-white`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Start a conversation</h3>
              <button
                onClick={toggleCapabilities}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Hide capabilities"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Ask questions to get insights based on your agent's description, persona, tone, and access to knowledge.
            </p>
            
            <div className="grid gap-2 mb-4">
              {capabilities.map((capability, index) => (
                <div key={index} className={`flex items-start gap-3 p-2 rounded-lg ${styles.capabilitiesItemHover} transition-colors`}>
                  {capability.icon}
                  <div>
                    <h4 className="text-sm font-medium text-white">{capability.title}</h4>
                    <p className="text-xs text-neutral-400">{capability.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Example questions input field (non-functional, just for UI) */}
            <div className="relative mt-auto">
              <div className="flex w-full items-center space-x-2 relative">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    className={`w-full rounded-lg ${styles.inputBg} py-2 px-4 text-sm text-white focus:ring-1 focus:ring-indigo-500 placeholder:text-neutral-500`}
                    readOnly
                    onClick={() => setCapabilitiesVisible(false)}
                  />
                </div>
                <button 
                  className={`rounded-lg ${styles.buttonBg} p-2 text-white transition-colors`}
                  onClick={() => setCapabilitiesVisible(false)}
                  aria-label="Send message"
                >
                  <SendIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className={`absolute inset-0 flex items-center justify-center ${styles.loadingBg} z-10`}>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full border-2 ${styles.loaderBorder} animate-spin mx-auto mb-4`}></div>
              <p className="text-sm text-neutral-400">Loading Taskade AI...</p>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && !loading && (
          <div className={`absolute inset-0 flex items-center justify-center ${styles.loadingBg} z-10`}>
            <div className={`text-center max-w-md p-6 rounded-lg ${styles.errorBg} shadow-xl`}>
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <button 
                className={`py-2 px-4 ${styles.buttonBg} text-white rounded-lg text-sm transition-colors`}
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
          className={`w-full border-0 ${capabilitiesVisible ? 'hidden' : 'block'} flex-1`}
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
        
        {/* Powered by Taskade footer */}
        {!loading && !error && !collapsed && (view === 'agent' || view === 'chat') && (
          <div className={`py-2 px-3 ${styles.footerBg} text-center text-xs text-neutral-500 border-t`}>
            Powered by <span className="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#9CA3AF"/>
                <path d="M8 12L11 15L16 9" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Taskade
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskadeEmbed;