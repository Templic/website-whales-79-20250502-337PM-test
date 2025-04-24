import React, { useEffect, useRef } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface TaskadeWidgetProps {
  enabled?: boolean;
}

declare global {
  interface Window {
    TaskadeEmbed?: {
      AgentPublicChatPopup?: {
        init: (config: { publicAgentId: string }) => void;
      };
    };
  }
}

const TaskadeWidget: React.FC<TaskadeWidgetProps> = ({ enabled = true }) => {
  const { reducedMotion } = useAccessibility();
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const initScriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // First, add the Taskade embed script
    const script = document.createElement('script');
    script.src = 'https://assets.taskade.com/embeds/latest/taskade-embed.min.js';
    script.async = true;
    
    // Then, create the initialization script
    const initScript = document.createElement('script');
    initScript.type = 'module';
    initScript.text = `
      if (window.TaskadeEmbed && window.TaskadeEmbed.AgentPublicChatPopup) {
        window.TaskadeEmbed.AgentPublicChatPopup.init({
          publicAgentId: '01JRV02MYWJW6VJS9XGR1VB5J4',
        });
      }
    `;
    
    // Script is loaded asynchronously so we need to ensure proper order
    script.onload = () => {
      // Only add the init script after the main script has loaded
      document.body.appendChild(initScript);
      initScriptRef.current = initScript;
    };
    
    document.body.appendChild(script);
    scriptRef.current = script;

    // Cleanup function
    return () => {
      // Remove both scripts
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
      }
      
      if (initScriptRef.current && document.body.contains(initScriptRef.current)) {
        document.body.removeChild(initScriptRef.current);
      }
      
      // Remove any Taskade widget elements that might have been created
      const widgetElements = document.querySelectorAll('[id^="taskade-agent-widget"]');
      widgetElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [enabled]);

  // This component doesn't render anything visible
  return null;
};

export default TaskadeWidget;