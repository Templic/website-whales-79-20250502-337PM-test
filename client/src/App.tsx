import React from 'react';
import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { AgentProvider } from '@/contexts/AgentContext';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';
import AIAgentProvider from '@/components/ai/AIAgentProvider';
import AccessibilityPage from '@/pages/accessibility/AccessibilityPage';
import AIChatPage from '@/pages/ai-chat/AIChatPage';

// Mock home page component for demo
const Home = () => (
  <div className="container py-12">
    <h1 className="text-4xl font-bold mb-4">Dale Loves Whales</h1>
    <p className="mb-8">Welcome to the cosmic journey.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/5 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-3">Accessibility Features</h2>
        <p className="mb-4">Customize your experience with our advanced accessibility options.</p>
        <a href="/accessibility" className="text-blue-400 hover:underline">Explore Accessibility Settings</a>
      </div>
      
      <div className="bg-white/5 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-3">AI Assistants</h2>
        <p className="mb-4">Get help from our cosmic AI guides specialized in different areas.</p>
        <a href="/ai-chat" className="text-blue-400 hover:underline">Chat with AI Guides</a>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <AccessibilityProvider>
      <AgentProvider>
        {/* Global Components */}
        <AccessibilityPanel />
        <AIAgentProvider />
        <Toaster />
        
        {/* Routes */}
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/accessibility" component={AccessibilityPage} />
          <Route path="/ai-chat" component={AIChatPage} />
          <Route>404 - Not Found</Route>
        </Switch>
      </AgentProvider>
    </AccessibilityProvider>
  );
}

export default App;