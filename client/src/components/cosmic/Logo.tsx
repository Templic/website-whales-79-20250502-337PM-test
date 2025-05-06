import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      {/* Logo background with glow effects */}
      <div className="relative h-10 w-10 rounded-full overflow-hidden">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-radial from-cyan-500 to-purple-600"></div>
        
        {/* Glow effect layers */}
        <div className="absolute inset-0 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-sm"></div>
        </div>
        
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110 blur-md"></div>
        
        {/* Ambient light pulse animation */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-pulse"></div>
        
        {/* Logo text or icon */}
        <div className="relative flex items-center justify-center h-full z-10">
          <span className="text-white font-bold text-sm">DLW</span>
        </div>
      </div>
      
      {/* Site name */}
      <span 
        className="ml-2 text-white font-serif text-lg"
        style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.5)' }}
      >
        Dale Loves Whales
      </span>
    </Link>
  );
};

export default Logo;