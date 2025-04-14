import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (!enabled) return;

    // Add Taskade script to the page
    const script = document.createElement('script');
    script.src = 'https://assets.taskade.com/embeds/latest/taskade-embed.min.js';
    script.async = true;
    script.onload = () => {
      // Initialize the widget after script loads
      if (window.TaskadeEmbed?.AgentPublicChatPopup) {
        window.TaskadeEmbed.AgentPublicChatPopup.init({
          publicAgentId: '01JRV02MYWJW6VJS9XGR1VB5J4'
        });
      }
    };
    
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      document.body.removeChild(script);
      
      // Remove the widget if it was added
      const widgetElement = document.querySelector('.taskade-agent-widget-container');
      if (widgetElement && widgetElement.parentNode) {
        widgetElement.parentNode.removeChild(widgetElement);
      }
    };
  }, [enabled]);

  // This component doesn't render anything visible
  return null;
};

export default TaskadeWidget;