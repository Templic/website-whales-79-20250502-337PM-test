/**
 * MainLayout.tsx
 * 
 * This component provides the main layout structure for all pages,
 * including the header, footer, and main content area.
 * 
 * Restored to the previous working style with the correct background color.
 */
import React from 'react';
import { MainHeader } from './MainHeader';
import { MainFooter } from './MainFooter';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#051222]">
      <MainHeader />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <MainFooter />
    </div>
  );
};

export default MainLayout;