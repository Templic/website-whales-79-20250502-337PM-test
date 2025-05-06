import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Home, Info, Music, MapPin, BookOpen,
  ShoppingBag, Users, Mail, Heart, MessageCircle
} from 'lucide-react';
import { AnimatedIcon } from '../ui/AnimatedIcon';

export const Navigation: React.FC = () => {
  const [location] = useLocation();
  
  // First row navigation items
  const topNavItems = [
    { path: '/', label: 'Home', icon: <Home size={16} /> },
    { path: '/about', label: 'About', icon: <Info size={16} /> },
    { path: '/music', label: 'Music', icon: <Music size={16} /> },
    { path: '/tour', label: 'Tour', icon: <MapPin size={16} /> },
    { path: '/blog', label: 'Blog', icon: <BookOpen size={16} /> },
  ];
  
  // Second row navigation items
  const bottomNavItems = [
    { path: '/shop', label: 'Shop', icon: <ShoppingBag size={16} /> },
    { path: '/community', label: 'Community Hub', icon: <Users size={16} /> },
    { path: '/newsletter', label: 'Newsletter', icon: <Mail size={16} /> },
    { path: '/collaboration', label: 'Collaboration', icon: <Heart size={16} /> },
    { path: '/contact', label: 'Contact', icon: <MessageCircle size={16} /> },
  ];
  
  // Get color for icons based on route
  const getIconColor = (path: string) => {
    if (path === '/' || path === '/shop') return "#06b6d4";        // cyan
    if (path === '/about' || path === '/community') return "#9333ea"; // purple
    if (path === '/music' || path === '/newsletter') return "#6366f1"; // indigo
    if (path === '/tour' || path === '/collaboration') return "#10edb3"; // teal green
    return "#f472b6";                                                  // pink (default)
  };
  
  return (
    <nav className="flex flex-col items-center justify-center">
      {/* Top row */}
      <div className="flex space-x-8 mb-2">
        {topNavItems.map((item) => (
          <NavItem 
            key={item.path}
            item={item}
            isActive={location === item.path}
            color={getIconColor(item.path)}
          />
        ))}
      </div>
      
      {/* Bottom row */}
      <div className="flex space-x-6">
        {bottomNavItems.map((item) => (
          <NavItem 
            key={item.path}
            item={item}
            isActive={location === item.path}
            color={getIconColor(item.path)}
          />
        ))}
      </div>
    </nav>
  );
};

// Individual navigation item
interface NavItemProps {
  item: { path: string; label: string; icon: React.ReactNode };
  isActive: boolean;
  color: string;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, color }) => {
  return (
    <Link
      href={item.path}
      onClick={() => window.scrollTo(0, 0)} // Scroll to top of page
      className={`
        group flex items-center text-white text-sm font-medium
        transition-all duration-300 relative
        ${isActive 
          ? 'opacity-100' 
          : 'opacity-90 hover:opacity-100'
        }
      `}
      style={{
        textShadow: isActive 
          ? '0 0 5px rgba(255, 255, 255, 0.7)' 
          : '0 0 3px rgba(255, 255, 255, 0.3)'
      }}
    >
      {/* Icon with rotation animation */}
      <AnimatedIcon color={color} className="mr-1.5">
        {item.icon}
      </AnimatedIcon>
      
      <span>{item.label}</span>
      
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </Link>
  );
};

export default Navigation;