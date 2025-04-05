/**
 * MainFooter.tsx
 * 
 * This component provides the main footer for the website with navigation links,
 * social media connections, and cosmic design elements.
 */
import React from 'react';
import { Link } from 'wouter';
import { Facebook, Instagram, Twitter, Music, Heart, Mail } from 'lucide-react';

export const MainFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-t from-black/90 to-transparent py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 - Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/music-release">
                  <div className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-2">
                    <Music className="h-4 w-4" />
                    <span>Latest Music</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/tour">
                  <div className="text-gray-400 hover:text-white transition-colors duration-300">
                    Tour Dates
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/shop">
                  <div className="text-gray-400 hover:text-white transition-colors duration-300">
                    Shop
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <div className="text-gray-400 hover:text-white transition-colors duration-300">
                    Blog
                  </div>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 2 - Connect */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact">
                  <div className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Contact Us</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/newsletter">
                  <div className="text-gray-400 hover:text-white transition-colors duration-300">
                    Newsletter
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/collaboration">
                  <div className="text-gray-400 hover:text-white transition-colors duration-300">
                    Collaboration
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/engage">
                  <div className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Support</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3 - Social & Legal */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Follow</h3>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-gray-400 hover:text-blue-500 transition-colors duration-300">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors duration-300">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-300">
                <Twitter className="h-6 w-6" />
              </a>
            </div>
            
            <div className="mt-4">
              <Link href="/terms">
                <div className="text-xs text-gray-500 hover:text-gray-400 transition-colors duration-300">
                  Terms of Service
                </div>
              </Link>
              <Link href="/privacy">
                <div className="text-xs text-gray-500 hover:text-gray-400 transition-colors duration-300 mt-1">
                  Privacy Policy
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} Cosmic Experience. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;