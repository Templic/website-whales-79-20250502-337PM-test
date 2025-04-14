import React from 'react';
import MainHeader from './MainHeader';
import AccessibilityPanel from '@/components/accessibility/AccessibilityPanel';
import AIAgentProvider from '@/components/ai/AIAgentProvider';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-purple-950">
      <MainHeader />
      
      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-black/30 py-10 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/70">
            <div>
              <h3 className="text-white font-bold mb-4">Cosmic Consciousness</h3>
              <p className="text-sm">
                Explore the depths of cosmic awareness through music, education,
                and community. Join us on this journey of self-discovery.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="/music" className="hover:text-white transition-colors">Music</a></li>
                <li><a href="/learn" className="hover:text-white transition-colors">Learn</a></li>
                <li><a href="/accessibility" className="hover:text-white transition-colors">Accessibility</a></li>
                <li><a href="/ai-chat" className="hover:text-white transition-colors">AI Assistants</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
            © {new Date().getFullYear()} Cosmic Consciousness. All rights reserved.
          </div>
        </div>
      </footer>
      
      {/* Global Components */}
      <AccessibilityPanel />
      <AIAgentProvider />
    </div>
  );
}

export default MainLayout;