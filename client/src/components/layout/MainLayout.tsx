import React from 'react';
import MainHeader from './MainHeader';
import { AccessibilityProvider } from '../../contexts/AccessibilityContext';
import { AgentProvider } from '../../contexts/AgentContext';
import AIAgentProvider from '../ai/AIAgentProvider';
import AccessibilityPanel from '../accessibility/AccessibilityPanel';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <AccessibilityProvider>
      <AgentProvider>
        <div className="min-h-screen bg-gradient-to-b from-black to-purple-950">
          <MainHeader />
          <main>{children}</main>
          
          {/* Footer could be added here */}
          
          {/* Global Components */}
          <AccessibilityPanel />
          <AIAgentProvider />
        </div>
      </AgentProvider>
    </AccessibilityProvider>
  );
}