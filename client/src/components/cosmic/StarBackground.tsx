import React, { useEffect, useState, useRef } from 'react';
import './cosmic-animations.css';

// Define the Star interface
interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  color: string;
}

// Define the component props
interface StarBackgroundProps {
  className?: string;
  starCount?: number;
}

export function StarBackground({ className = "", starCount = 50 }: StarBackgroundProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // The "Feels So Good" album colors
  const starColors = [
    'rgba(0, 235, 214, 0.9)',    // Cyan
    'rgba(124, 58, 237, 0.9)',   // Purple
    'rgba(225, 85, 84, 0.9)',    // Red
    'rgba(251, 146, 60, 0.9)',   // Orange
    'rgba(255, 255, 255, 0.9)',  // White
  ];
  
  // Function to generate random stars
  const generateStars = (count: number) => {
    if (!containerRef.current) return [];
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const newStars: Star[] = [];
    
    for (let i = 0; i < count; i++) {
      newStars.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.3,
        animationDuration: Math.random() * 4 + 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }
    
    return newStars;
  };
  
  // Initialize stars on component mount and handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStars(generateStars(starCount));
    };
    
    // Initial star generation
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Add occasional shooting stars
    const shootingStarInterval = setInterval(() => {
      if (containerRef.current) {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        
        // Random position at top of container
        const { width } = containerRef.current.getBoundingClientRect();
        shootingStar.style.top = '0';
        shootingStar.style.left = `${Math.random() * width}px`;
        
        // Random animation duration
        const duration = Math.random() * 2 + 1;
        shootingStar.style.animationDuration = `${duration}s`;
        
        // Add to container and remove after animation
        containerRef.current.appendChild(shootingStar);
        setTimeout(() => {
          if (shootingStar.parentNode) {
            shootingStar.parentNode.removeChild(shootingStar);
          }
        }, duration * 1000);
      }
    }, 8000);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(shootingStarInterval);
    };
  }, [starCount]);
  
  return (
    <div 
      ref={containerRef} 
      className={`star-field ${className}`}
      aria-hidden="true"
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="star animate-twinkle"
          style={{
            left: `${star.x}px`,
            top: `${star.y}px`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            backgroundColor: star.color,
            '--twinkle-duration': `${star.animationDuration}s`,
            '--twinkle-delay': `${Math.random() * 2}s`
          } as React.CSSProperties}
        />
      ))}
      
      {/* Add a few cosmic orbs */}
      <div 
        className="cosmic-orb"
        style={{
          top: '15%',
          left: '10%',
          width: '80px',
          height: '80px',
          opacity: 0.25,
        }}
      />
      
      <div 
        className="cosmic-orb"
        style={{
          top: '70%',
          right: '5%',
          width: '120px',
          height: '120px',
          opacity: 0.15,
          animationDelay: '1s'
        }}
      />
      
      {/* Space dust particles */}
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={`dust-${index}`}
          className="space-dust"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.3 + 0.1
          }}
        />
      ))}
    </div>
  );
}