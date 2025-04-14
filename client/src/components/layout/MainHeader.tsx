import React from 'react';
import { Link } from 'wouter';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAgents } from '@/contexts/AgentContext';
import { Button } from '@/components/ui/button';
import AIAgentButton from '@/components/ai/AIAgentButton';
import { 
  Settings, 
  Accessibility,
  Sun,
  Moon,
  Menu,
  X 
} from 'lucide-react';

export default function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { textSize, darkMode, setDarkMode, toggleAccessibilityPanel } = useAccessibility();
  const { availableAgents } = useAgents();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Main Nav */}
          <div className="flex items-center">
            <Link href="/">
              <a className="text-xl font-bold tracking-tight mr-6">
                <span className="text-purple-500">Cosmic</span>
                <span className="hidden sm:inline"> Consciousness</span>
              </a>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link href="/shop">
                <a className="text-sm hover:text-primary transition-colors">Shop</a>
              </Link>
              <Link href="/music">
                <a className="text-sm hover:text-primary transition-colors">Music</a>
              </Link>
              <Link href="/learn">
                <a className="text-sm hover:text-primary transition-colors">Learn</a>
              </Link>
              <Link href="/community">
                <a className="text-sm hover:text-primary transition-colors">Community</a>
              </Link>
            </nav>
          </div>

          {/* Desktop Actions: AI, Accessibility, Dark Mode */}
          <div className="hidden md:flex items-center space-x-2">
            {/* AI Agent Selector - Desktop Only */}
            <div className="mr-2">
              <AIAgentButton 
                agentId="cosmic-guide"
                variant="outline"
                buttonText="Chat with Guide"
              />
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Accessibility Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAccessibilityPanel}
              title="Accessibility settings"
            >
              <Accessibility className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-white/10 p-4">
          <nav className="flex flex-col space-y-4 mb-6">
            <Link href="/">
              <a className="text-sm hover:text-primary transition-colors">Home</a>
            </Link>
            <Link href="/shop">
              <a className="text-sm hover:text-primary transition-colors">Shop</a>
            </Link>
            <Link href="/music">
              <a className="text-sm hover:text-primary transition-colors">Music</a>
            </Link>
            <Link href="/learn">
              <a className="text-sm hover:text-primary transition-colors">Learn</a>
            </Link>
            <Link href="/community">
              <a className="text-sm hover:text-primary transition-colors">Community</a>
            </Link>
          </nav>

          <div className="grid grid-cols-2 gap-2">
            {/* Accessibility on Mobile */}
            <Button
              variant="outline"
              onClick={toggleAccessibilityPanel}
              className="flex items-center justify-center"
            >
              <Accessibility className="h-4 w-4 mr-2" />
              <span>Accessibility</span>
            </Button>

            {/* Dark Mode on Mobile */}
            <Button
              variant="outline"
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center"
            >
              {darkMode ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  <span>Dark Mode</span>
                </>
              )}
            </Button>
          </div>

          {/* AI Agents on Mobile */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">AI Assistants</h3>
            <div className="grid grid-cols-2 gap-2">
              {availableAgents.map(agent => (
                <AIAgentButton 
                  key={agent.id}
                  agentId={agent.id} 
                  variant="outline"
                  size="sm"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}