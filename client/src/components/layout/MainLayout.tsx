import { MainHeader } from "./MainHeader";
import { MainFooter } from "./MainFooter";
import StarBackground from "@/components/cosmic/StarBackground";
import { useState, useEffect } from "react";
import { CosmicFonts } from "@/components/common/cosmic-fonts";
import ChatWidget from "@/components/chat/ChatWidget";
import { ChatProvider } from "@/contexts/ChatContext";
import { AccessibilityControls } from "@/components/common/accessibility-controls";

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
      <CosmicFonts>
        <div className="min-h-screen flex flex-col bg-[#050f28] text-[#e8e6e3] relative overflow-hidden">
          {/* Cosmic Background with Stars */}
          <StarBackground starCount={100} colorScheme="cyan" opacity={0.5} />
          
          {/* Use consolidated MainHeader component */}
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
    </ChatProvider>
  );
}