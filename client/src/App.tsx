import React from 'react';
import { Route, Switch } from 'wouter';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { AgentProvider } from '@/contexts/AgentContext';
import AccessibilityPage from '@/pages/accessibility/AccessibilityPage';
import AIChatPage from '@/pages/ai-chat/AIChatPage';

// Mock home page for demonstration purposes
const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-4xl font-bold mb-6">Cosmic Consciousness</h1>
      <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
        Access our AI assistants and accessibility controls from any page using the buttons in the header.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <a 
          href="/accessibility" 
          className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-white/10 rounded-lg p-6 hover:bg-white/5 transition-colors"
        >
          <h2 className="text-2xl font-bold mb-2">Accessibility Features</h2>
          <p className="text-white/70">
            Customize your experience with text size, contrast, reduced motion, and voice settings.
          </p>
        </a>
        <a 
          href="/ai-chat" 
          className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-white/10 rounded-lg p-6 hover:bg-white/5 transition-colors"
        >
          <h2 className="text-2xl font-bold mb-2">AI Assistants</h2>
          <p className="text-white/70">
            Connect with specialized AI guides for help with shopping, music, learning, and more.
          </p>
        </a>
      </div>
    </div>
  );
};

// 404 Page
const NotFoundPage = () => {
  return (
    <div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-4xl font-bold mb-6">Page Not Found</h1>
      <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a 
        href="/" 
        className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
      >
        Return Home
      </a>
    </div>
  );
};

export default function App() {
  return (
    <AccessibilityProvider>
      <AgentProvider>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/accessibility" component={AccessibilityPage} />
          <Route path="/ai-chat" component={AIChatPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </AgentProvider>
    </AccessibilityProvider>
  );
}