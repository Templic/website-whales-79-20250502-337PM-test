import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '../cosmic/Logo';
import { Navigation } from './Navigation';
import { SearchBar } from './SearchBar';
import { HeaderControls } from './HeaderControls';
import { UserMenu } from './UserMenu';
import { HexagramMerkaba } from '../cosmic/HexagramMerkaba';
import { GlowEffects } from '../ui/GlowEffects';

export const MainHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  // Handle scroll events with throttling
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update header compact state
      setIsScrolled(currentScrollY > 100);
      
      // Handle hide-on-scroll behavior
      if (currentScrollY > 60 && currentScrollY > lastScrollY.current + 10) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY < 10) {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };
    
    // Use throttled event listener for better performance
    let scrollTimeout: number;
    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = window.setTimeout(() => {
          handleScroll();
          scrollTimeout = 0;
        }, 100);
      }
    };
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);
  
  return (
    <>
      {/* SVG filters for glow effects */}
      <GlowEffects />
      
      {/* Main header */}
      <header 
        className={`
          fixed top-0 left-0 right-0 flex justify-center items-center z-[100]
          transition-all duration-300 ease-in-out py-2
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div 
          className={`
            w-[85%] mx-auto rounded-2xl
            bg-[rgba(30,58,138,0.8)] backdrop-blur-md
            border-b border-[rgba(6,224,224,0.5)]
            transition-all duration-300 ease-in-out
            ${isScrolled ? 'h-16' : 'h-[90px]'}
          `}
          style={{
            boxShadow: '0 0 15px rgba(6, 224, 224, 0.3)',
          }}
        >
          {/* Header content grid */}
          <div className="grid grid-cols-12 h-full items-center px-4">
            {/* Logo area */}
            <div className="col-span-3 md:col-span-2 lg:col-span-3">
              <Logo />
            </div>
            
            {/* Navigation area */}
            <div className="hidden md:block col-span-6 md:col-span-8 lg:col-span-6">
              <Navigation />
            </div>
            
            {/* Right side controls */}
            <div className="col-span-9 md:col-span-2 lg:col-span-3 flex flex-col items-end justify-center">
              <div className="hidden md:block mb-1">
                <SearchBar />
              </div>
              <div className="flex items-center space-x-2">
                <div className="hidden md:flex">
                  <HeaderControls />
                </div>
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
        
        {/* Left side merkaba shapes */}
        <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <div className="relative">
            {/* Background merkaba */}
            <div className="absolute" style={{ filter: 'blur(1.5px)' }}>
              <HexagramMerkaba 
                size={96}
                opacity={0.4}
                rotationSpeed={60}
                rotationDirection="clockwise"
              />
            </div>
            
            {/* Foreground merkaba */}
            <HexagramMerkaba 
              size={96}
              rotationSpeed={50}
              rotationDirection="counterclockwise"
            />
          </div>
        </div>
        
        {/* Right side merkaba shapes */}
        <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <div className="relative">
            {/* Background merkaba */}
            <div className="absolute" style={{ filter: 'blur(1.5px)' }}>
              <HexagramMerkaba 
                size={96}
                opacity={0.4}
                rotationSpeed={60}
                rotationDirection="counterclockwise"
              />
            </div>
            
            {/* Foreground merkaba */}
            <HexagramMerkaba 
              size={96}
              rotationSpeed={50}
              rotationDirection="clockwise"
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default MainHeader;