
import { useEffect, useRef, useState } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
}

interface CosmicParticle {
  id: number;
  x: number;
  y: number;
  size: number;
}

const Stars = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<CosmicParticle[]>([]);
  const nextParticleId = useRef(0);
  const [interactiveMode, setInteractiveMode] = useState(false);
  
  // Enhanced particle creation on mouse movement
  const createParticle = (x: number, y: number) => {
    if (!particlesRef.current) return;
    
    // Create multiple particles with varying properties for a more natural effect
    const particleCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 20 + 10;
      const particle = document.createElement('div');
      
      // Different types of particles based on random selection
      const particleType = Math.floor(Math.random() * 3);
      
      if (particleType === 0) {
        // Cosmic dust (small particles)
        particle.className = 'cosmic-particle dust';
        particle.style.background = `radial-gradient(circle, rgba(155,135,245,0.8) 0%, rgba(155,135,245,0) 70%)`;
      } else if (particleType === 1) {
        // Energy wave (larger, more transparent)
        particle.className = 'cosmic-particle wave';
        particle.style.background = `radial-gradient(circle, rgba(51,195,240,0.6) 0%, rgba(51,195,240,0) 80%)`;
      } else {
        // Star burst (bright, small)
        particle.className = 'cosmic-particle burst';
        particle.style.background = `radial-gradient(circle, rgba(214,188,250,1) 0%, rgba(214,188,250,0) 70%)`;
        particle.style.boxShadow = '0 0 10px rgba(214,188,250,0.8)';
      }
      
      particle.style.left = `${x - size/2 + (Math.random() * 20 - 10)}px`;
      particle.style.top = `${y - size/2 + (Math.random() * 20 - 10)}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.animationDuration = `${2 + Math.random() * 3}s`;
      
      particlesRef.current.appendChild(particle);
      
      // Remove particle after animation completes
      setTimeout(() => {
        if (particlesRef.current && particle.parentNode === particlesRef.current) {
          particlesRef.current.removeChild(particle);
        }
      }, 5000);
    }
  };
  
  // Create a constellation effect between nearby stars
  const createConstellation = (x1: number, y1: number, x2: number, y2: number) => {
    if (!particlesRef.current) return;
    
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    // Only connect stars that are close enough
    if (distance > 150) return;
    
    const line = document.createElement('div');
    line.className = 'constellation-line';
    
    // Calculate position and length
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    line.style.width = `${distance}px`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.opacity = `${Math.max(0, 1 - distance / 150)}`;
    
    particlesRef.current.appendChild(line);
    
    // Remove line after animation
    setTimeout(() => {
      if (particlesRef.current && line.parentNode === particlesRef.current) {
        particlesRef.current.removeChild(line);
      }
    }, 2000);
  };
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // Clear previous stars
    container.innerHTML = '';
    
    // Generate random stars - more for immersive experience
    const starCount = Math.floor((containerWidth * containerHeight) / 7000);
    const stars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        delay: Math.random() * 4
      });
    }
    
    // Create star elements with varied sizes for depth effect
    stars.forEach(star => {
      const starElement = document.createElement('div');
      starElement.className = 'star';
      starElement.style.left = `${star.x}%`;
      starElement.style.top = `${star.y}%`;
      starElement.style.width = `${star.size}px`;
      starElement.style.height = `${star.size}px`;
      starElement.style.opacity = star.opacity.toString();
      starElement.style.animationDelay = `${star.delay}s`;
      container.appendChild(starElement);
    });
    
    // Create some larger, brighter stars for focal points
    for (let i = 0; i < 15; i++) {
      const starElement = document.createElement('div');
      starElement.className = 'star bright-star';
      starElement.style.left = `${Math.random() * 100}%`;
      starElement.style.top = `${Math.random() * 100}%`;
      starElement.style.width = `${Math.random() * 3 + 2}px`;
      starElement.style.height = `${Math.random() * 3 + 2}px`;
      starElement.style.opacity = '1';
      starElement.style.animationDelay = `${Math.random() * 4}s`;
      starElement.style.boxShadow = '0 0 6px rgba(214,188,250,0.9)';
      container.appendChild(starElement);
    }
    
    // Handle mouse move for interactive cosmic particles
    const handleMouseMove = (e: MouseEvent) => {
      // Create particles more frequently when in interactive mode
      if (interactiveMode || Math.random() > 0.9) {
        createParticle(e.clientX, e.clientY);
        
        // Create constellations occasionally
        if (Math.random() > 0.97) {
          const otherX = e.clientX + (Math.random() * 200 - 100);
          const otherY = e.clientY + (Math.random() * 200 - 100);
          createConstellation(e.clientX, e.clientY, otherX, otherY);
        }
      }
    };
    
    // Toggle interactive mode on key press
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setInteractiveMode(prev => !prev);
      }
    };
    
    // Handle resize
    const handleResize = () => {
      // Re-render stars when window size changes
      if (container) {
        container.innerHTML = '';
        stars.forEach(star => {
          const starElement = document.createElement('div');
          starElement.className = 'star';
          starElement.style.left = `${star.x}%`;
          starElement.style.top = `${star.y}%`;
          starElement.style.width = `${star.size}px`;
          starElement.style.height = `${star.size}px`;
          starElement.style.opacity = star.opacity.toString();
          starElement.style.animationDelay = `${star.delay}s`;
          container.appendChild(starElement);
        });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('resize', handleResize);
    };
  }, [interactiveMode]);
  
  return (
    <>
      <div ref={containerRef} className="stars-container" />
      <div ref={particlesRef} className="stars-container" />
      
      {interactiveMode && (
        <div className="fixed bottom-4 right-4 bg-cosmic-dark/60 backdrop-blur-md px-3 py-2 rounded-lg text-xs text-cosmic-light z-50 border border-cosmic-primary/30">
          <p className="font-space">Interactive star mode: ON</p>
          <p className="text-[10px] text-cosmic-primary/70">Move your cursor to create cosmic energy</p>
        </div>
      )}
    </>
  );
};

export default Stars;
