import React, { useState } from 'react';
import TaskadeEmbed from '../client/src/components/chat/TaskadeEmbed';
import TaskadeWidget from '../client/src/components/chat/TaskadeWidget';

/**
 * Example component demonstrating all three styling modes for Taskade integration
 * 
 * This example shows how to use both TaskadeEmbed and TaskadeWidget components
 * with the three different styling options: basic, taskade, and oceanic.
 */
const TaskadeStylesExample: React.FC = () => {
  // State to control which style is active
  const [activeStyle, setActiveStyle] = useState<'basic' | 'taskade' | 'oceanic'>('taskade');
  // State to control whether we're showing embed or widget example
  const [showEmbed, setShowEmbed] = useState(true);
  
  // The Taskade agent ID to use for examples
  const taskadeId = '01JRV02MYWJW6VJS9XGR1VB5J4';
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Taskade Styling Examples</h1>
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-sm font-medium">Component Type</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmbed(true)}
              className={`px-4 py-2 rounded-lg ${
                showEmbed ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              TaskadeEmbed
            </button>
            <button
              onClick={() => setShowEmbed(false)}
              className={`px-4 py-2 rounded-lg ${
                !showEmbed ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              TaskadeWidget
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">Style Option</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStyle('basic')}
              className={`px-4 py-2 rounded-lg ${
                activeStyle === 'basic' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setActiveStyle('taskade')}
              className={`px-4 py-2 rounded-lg ${
                activeStyle === 'taskade' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Taskade
            </button>
            <button
              onClick={() => setActiveStyle('oceanic')}
              className={`px-4 py-2 rounded-lg ${
                activeStyle === 'oceanic' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Oceanic
            </button>
          </div>
        </div>
      </div>
      
      {/* Style preview descriptions */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {activeStyle === 'basic' ? 'Basic Style' : 
           activeStyle === 'taskade' ? 'Taskade Style (Default)' : 
           'Oceanic Style'}
        </h2>
        
        <p className="text-muted-foreground mb-4">
          {activeStyle === 'basic' ? 
            'Clean, minimal styling that integrates with the application\'s default theme.' : 
           activeStyle === 'taskade' ? 
            'Styled to match Taskade\'s native look and feel with sleek black backgrounds and purple gradients.' : 
            'An ocean-themed styling option with blue gradients, perfect for Dale Loves Whales\' oceanic theme.'}
        </p>
      </div>
      
      {/* Component preview */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Preview</h3>
        {showEmbed ? (
          <div className="h-[500px] border rounded-xl overflow-hidden">
            <TaskadeEmbed
              taskadeId={taskadeId}
              title="Cosmic Assistant"
              view="agent"
              showToolbar={true}
              style={activeStyle}
              enableMemory={true}
              theme="system"
              showCapabilities={true}
            />
          </div>
        ) : (
          <div className="h-[400px] relative">
            <p className="mb-4 text-sm text-muted-foreground">
              The TaskadeWidget component appears in the bottom-right corner (or selected position).
            </p>
            <div className="border border-dashed rounded-xl p-8 flex items-center justify-center h-full bg-muted/30">
              <TaskadeWidget
                enabled={true}
                taskadeId={taskadeId}
                title="Cosmic Assistant"
                style={activeStyle}
                theme="system"
                position="bottom-right"
                showBranding={true}
                greetingMessage="This is the TaskadeWidget with the selected style. Click me to open the chat!"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Code example */}
      <div>
        <h3 className="text-lg font-medium mb-2">Code Example</h3>
        <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
          <code>
            {showEmbed ? 
              `import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

<TaskadeEmbed
  taskadeId="${taskadeId}"
  title="Cosmic Assistant"
  view="agent"
  showToolbar={true}
  style="${activeStyle}"    // 'basic', 'taskade', or 'oceanic'
  enableMemory={true}
  theme="system"            // 'light', 'dark', or 'system'
  showCapabilities={true}
/>` : 
              `import TaskadeWidget from '@/components/chat/TaskadeWidget';

<TaskadeWidget
  enabled={true}
  taskadeId="${taskadeId}"
  title="Cosmic Assistant"
  style="${activeStyle}"    // 'basic', 'taskade', or 'oceanic'
  theme="system"            // 'light', 'dark', or 'system'
  position="bottom-right"   // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  showBranding={true}
  greetingMessage="Ask me about cosmic consciousness and sacred geometry."
/>`}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default TaskadeStylesExample;