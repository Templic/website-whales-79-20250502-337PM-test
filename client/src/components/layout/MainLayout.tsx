import { MainHeader } from "./MainHeader";
import { MainFooter } from "./MainFooter";
import StarBackground from "../cosmic/StarBackground";
import { useState, useEffect } from "react";
import { CosmicFonts } from "../common/cosmic-fonts";
import ChatWidget from "../chat/ChatWidget";
import { ChatProvider } from "../../contexts/ChatContext";
import { AccessibilityControls } from "../common/accessibility-controls";
import { ThemeToggle } from "../ui/ThemeToggle";
import { HeaderProvider } from "../../contexts/HeaderContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Handle mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ChatProvider>
      <HeaderProvider>
        <CosmicFonts>
          <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
            {/* Cosmic Background with Stars */}
            <StarBackground starCount={100} colorScheme="cyan" opacity={0.5} />
            
            {/* Theme Toggle (fixed position) - Note: ThemeToggle is now handled in App.tsx */}
            
            {/* Use MainHeader component with Dale Loves Whales branding */}
            <MainHeader />
            
            {/* Main Content */}
            <main className={`flex-grow w-full py-16 sm:py-20 lg:py-24 transition-all duration-300 ease-in-out ${isMobile ? 'px-4 sm:px-6' : 'px-8'} z-10 relative`}>
              <div className={`max-w-7xl mx-auto w-full ${isMobile ? 'space-y-4' : 'space-y-8'}`}>
                {children}
              </div>
            </main>
            
            {/* Use consolidated MainFooter component */}
            <MainFooter />
            
            {/* Chat Widget (floating on all pages) */}
            <ChatWidget />
            
            {/* Accessibility Controls (positioned to avoid overlap with chat widget) */}
            <AccessibilityControls />
          </div>
        </CosmicFonts>
      </HeaderProvider>
    </ChatProvider>
  );
}