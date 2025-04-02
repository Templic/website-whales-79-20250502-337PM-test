import { Header } from "./Header";
import { Footer } from "./Footer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { AccessibilityControls } from "../imported/AccessibilityControls";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <ScrollProgress />
      <div className="fixed top-4 right-4 z-[100] transition-all duration-300 hover:scale-105">
        <ThemeToggle />
      </div>
      <AccessibilityControls />
      <Header />
      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 transition-all duration-300 ease-in-out">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}