import { Header } from "./Header";
import { Footer } from "./Footer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { AccessibilityControls } from "../imported/AccessibilityControls";
import { useIsMobile } from "./use-mobile"; // Added import

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <ScrollProgress />
      <AccessibilityControls />
      <div className="fixed top-4 right-4 z-[60] transition-all duration-300 hover:scale-105">
        <ThemeToggle />
      </div>
      <Header />
      <main className={`flex-grow w-full py-6 sm:py-8 lg:py-12 transition-all duration-300 ease-in-out ${isMobile ? 'px-4 sm:px-6' : 'px-8'}`}> {/* Added responsive padding */}
        <div className={`max-w-7xl mx-auto w-full ${isMobile ? 'space-y-4' : 'space-y-8'}`}> {/* Added responsive spacing */}
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}