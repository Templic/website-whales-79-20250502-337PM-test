import React, { useEffect, useRef } from 'react';

interface TaskadeEmbedProps {
  chatOnly?: boolean;
  widgetMode?: boolean;
}

const TaskadeEmbed: React.FC<TaskadeEmbedProps> = ({ chatOnly = false, widgetMode = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip if already initialized or if container doesn't exist
    if (initializedRef.current || !containerRef.current) return;
    
    // Mark as initialized
    initializedRef.current = true;
    
    try {
      // This is a placeholder for the actual Taskade Agent embed code
      // In a real implementation, this would be the official Taskade embed code
      // that would be provided by Taskade's documentation
      
      // Simulated embedding logic
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://taskade.com/embed/agent.js'; // Placeholder URL
      script.onload = () => {
        // Placeholder for Taskade's initialization function
        if (window.taskadeAgent) {
          window.taskadeAgent.init({
            containerId: containerRef.current?.id,
            agentId: 'YOUR_TASKADE_AGENT_ID',
            mode: widgetMode ? 'widget' : 'embed',
            chatOnly: chatOnly
          });
        }
      };
      
      document.head.appendChild(script);
      
      // Add a placeholder element for Taskade to inject content into
      if (containerRef.current) {
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'taskade-agent-content w-full h-full';
        placeholderDiv.textContent = 'Loading Taskade AI Agent...';
        containerRef.current.appendChild(placeholderDiv);
      }
    } catch (error) {
      console.error('Error initializing Taskade Agent:', error);
    }
    
    return () => {
      // Cleanup logic if needed
    };
  }, [chatOnly, widgetMode]);
  
  return (
    <div 
      id="taskade-agent-container" 
      ref={containerRef} 
      className={`taskade-agent-embed ${widgetMode ? 'taskade-widget' : ''}`}
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: widgetMode ? '500px' : '600px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Taskade Agent will be embedded here */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg border border-cyan-500/20">
          <p className="text-lg text-cyan-400 mb-2">Taskade AI Agent</p>
          <p className="text-sm mb-4 text-gray-300">
            {/* Display a message explaining that this is a placeholder */}
            Note: This is a simulation of the Taskade AI Agent. In a real implementation, 
            you would need to replace the placeholder code with the official Taskade 
            embed code.
          </p>
          <p className="text-xs text-gray-400">
            To integrate with the actual Taskade API, you would need to:
          </p>
          <ol className="text-xs text-left text-gray-400 list-decimal pl-5 mt-2">
            <li>Register for a Taskade account</li>
            <li>Create an AI Agent in the Taskade platform</li>
            <li>Get your API credentials</li>
            <li>Replace the placeholder code with the official embed code</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// Add this type declaration to avoid TypeScript errors
declare global {
  interface Window {
    taskadeAgent?: {
      init: (config: {
        containerId: string | undefined;
        agentId: string;
        mode: 'widget' | 'embed';
        chatOnly: boolean;
      }) => void;
    };
  }
}

export default TaskadeEmbed;