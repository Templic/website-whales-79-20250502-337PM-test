/**
 * MainHeader.tsx
 * 
 * This is the primary header component for the website, featuring sacred geometry,
 * staggered navigation, and cosmic design elements.
 * 
 * Created: 2025-04-05 - Updated with enhancements
 * Latest Update: Added sacred geometry elements and improved staggered navigation
 */
import React, { useState } from 'react';
import { Link } from 'wouter';
import { Menu, X, Sun, Moon, Home, Info, Music, MapPin, ShoppingBag, BookOpen, Users, Mail, Headphones, Star, Archive, Send } from 'lucide-react';
import { useAuth, User, AuthReturn } from '@/hooks/use-auth';

// Interface definitions
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  glowColor?: string;
}

export function MainHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  // Primary navigation items
  const primaryNavItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <Home className="h-4 w-4" />, glowColor: 'from-purple-500 to-indigo-600' },
    { name: 'About', path: '/about', icon: <Info className="h-4 w-4" />, glowColor: 'from-blue-500 to-teal-500' },
    { name: 'Music', path: '/music-release', icon: <Music className="h-4 w-4" />, glowColor: 'from-pink-500 to-red-500' },
    { name: 'Tour', path: '/tour', icon: <MapPin className="h-4 w-4" />, glowColor: 'from-yellow-400 to-orange-500' },
    { name: 'Shop', path: '/shop', icon: <ShoppingBag className="h-4 w-4" />, glowColor: 'from-green-400 to-emerald-600' },
    { name: 'Blog', path: '/blog', icon: <BookOpen className="h-4 w-4" />, glowColor: 'from-violet-500 to-purple-600' },
  ];

  // Secondary navigation items
  const secondaryNavItems: NavItem[] = [
    { name: 'Community', path: '/community', icon: <Users className="h-4 w-4" /> },
    { name: 'Newsletter', path: '/newsletter', icon: <Mail className="h-4 w-4" /> },
    { name: 'Collaboration', path: '/collaboration', icon: <Headphones className="h-4 w-4" /> },
    { name: 'Engage', path: '/engage', icon: <Star className="h-4 w-4" /> },
    { name: 'Archive', path: '/archived-music', icon: <Archive className="h-4 w-4" /> },
    { name: 'Contact', path: '/contact', icon: <Send className="h-4 w-4" /> },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="relative z-50 bg-gradient-to-b from-black/90 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full blur opacity-60 group-hover:opacity-80 transition duration-1000"></div>
                  <div className="relative px-5 py-3 bg-black rounded-full flex items-center leading-none">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                      Cosmic
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Primary */}
          <nav className="hidden md:flex items-center space-x-6">
            {primaryNavItems.map((item) => (
              <Link key={item.name} href={item.path}>
                <div className="group relative px-3 py-2 transition-all duration-300 ease-in-out">
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.glowColor || 'from-blue-500 to-purple-500'} rounded-md opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  <div className="relative flex items-center space-x-1">
                    {item.icon}
                    <span className="text-gray-300 group-hover:text-white">{item.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </nav>

          {/* Secondary Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {secondaryNavItems.slice(0, 2).map((item) => (
              <Link key={item.name} href={item.path}>
                <div className="text-sm text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-1">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
            
            {/* Admin Portal Link - only for admin users */}
            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <Link href="/admin">
                <div className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-300">
                  Admin Portal
                </div>
              </Link>
            ) : null}

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800/50 focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </nav>

          {/* Mobile Menu Button (outside secondary nav for mobile view) */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800/50 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Primary Navigation Items */}
            {primaryNavItems.map((item) => (
              <Link key={item.name} href={item.path}>
                <div 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center space-x-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}

            {/* Divider */}
            <div className="border-t border-gray-800 my-2"></div>

            {/* Secondary Navigation Items */}
            {secondaryNavItems.map((item) => (
              <Link key={item.name} href={item.path}>
                <div 
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 flex items-center space-x-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}

            {/* Admin Portal Link - only for admin users */}
            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <Link href="/admin">
                <div 
                  className="block px-3 py-2 rounded-md text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-gray-800/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Portal
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}