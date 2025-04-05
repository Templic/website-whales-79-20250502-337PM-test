import React from 'react';
import { cn } from '@/lib/utils';
import StarBackground from './cosmic/StarBackground';
import { EnhancedAccessibilityControls } from './common/EnhancedAccessibilityControls';
import { CosmicNavigation } from './common/cosmic-navigation';
import { CosmicFooter } from './common/cosmic-footer';



const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a14]">
      {/* Star Background for cosmic theme */}
      <StarBackground colorScheme="multi" opacity={0.7} />
      
      {/* Enhanced Accessibility Controls */}
      <EnhancedAccessibilityControls />

      {/* Navigation */}
      <CosmicNavigation />

      {/* Main Content */}
      <main className="flex-grow pt-28 pb-16">
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