import React from 'react';
import Link from 'next/link';
import { useMockAuth } from '../../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { navigationLinks } from '../../data/navigation';

/* MainHeader: Primary navigation component 
 * Handles main navigation, authentication state, and responsive menu
 * Contains primary navigation links and authentication controls
 */
export const MainHeader: React.FC = () => {
  const { user, logout } = useMockAuth();

  // Navigation link structure object for top-level menu items
  const primaryNavLinks = navigationLinks.filter(link => !link.parent);

  return (
    <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-sm border-b border-white/10">
      {/* Main Navigation Container */}
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand Section */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold text-white">
            Cosmic Vibrations
          </Link>
        </div>

        {/* Primary Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          {primaryNavLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Authentication Controls Section */}
        <div className="flex items-center space-x-4">
          {user ? (
            // Authenticated User Actions
            <div className="flex items-center space-x-4">
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          ) : (
            // Guest User Actions
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default MainHeader;