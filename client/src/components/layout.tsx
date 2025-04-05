import React from 'react';
import { cn } from '@/lib/utils';
import StarBackground from './cosmic/StarBackground';
import { EnhancedAccessibilityControls } from './common/EnhancedAccessibilityControls';
import { MainNavigation } from './layout/MainNavigation';
import { CosmicFooter } from './common/cosmic-footer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a14]">
      {/* Star Background for cosmic theme */}
      <StarBackground colorScheme="multi" opacity={0.7} />
      
      {/* Enhanced Accessibility Controls */}
      <EnhancedAccessibilityControls />

      {/* New Main Navigation */}
      <MainNavigation />

      {/* Main Content */}
      <main className="flex-grow pb-16">
        <div className="container px-4">
          {children}
        </div>
      </main>

      {/* Footer */}
      <CosmicFooter />
    </div>
  );
};

export default Layout;