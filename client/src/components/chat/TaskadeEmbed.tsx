import React, { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Loader2 } from 'lucide-react';

interface TaskadeEmbedProps {
  chatOnly?: boolean;
  className?: string;
}

const TaskadeEmbed: React.FC<TaskadeEmbedProps> = ({ chatOnly = false, className = '' }) => {
  const { reducedMotion } = useAccessibility();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  
  // You would replace this with your actual Taskade AI Agent URL
  const taskadeUrl = 'https://app.taskade.com/embed/agent/YOUR_AGENT_ID';
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Handle resize to ensure iframe takes full space
  useEffect(() => {
    const handleResize = () => {
      if (iframeRef.current && iframeRef.current.parentElement) {
        const parent = iframeRef.current.parentElement;
        iframeRef.current.style.height = `${parent.clientHeight}px`;
        iframeRef.current.style.width = `${parent.clientWidth}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading Taskade AI...</p>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={taskadeUrl}
        title="Taskade AI Embed"
        className="w-full h-full border-0"
        onLoad={handleIframeLoad}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        allow="accelerometer; camera; encrypted-media; geolocation; microphone; midi"
        style={{
          opacity: loading ? 0 : 1,
          transition: reducedMotion ? 'none' : 'opacity 0.3s ease'
        }}
      />
      
      {!loading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/70 to-transparent h-8 pointer-events-none" />
      )}
    </div>
  );
};

export default TaskadeEmbed;