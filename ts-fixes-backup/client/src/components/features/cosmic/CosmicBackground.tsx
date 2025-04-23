/**
 * CosmicBackground.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
import React, { useRef, useEffect } from 'react';

interface CosmicBackgroundProps {
  opacity?: number;
  color?: 'purple' | 'blue' | 'green' | 'dark-purple';
  speed?: number;
  particleCount?: number;
  nebulaEffect?: boolean;
  className?: string;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  opacity = 0.5,
  color = 'dark-purple',
  speed = 1,
  particleCount = 150,
  nebulaEffect = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Get color palette based on selected color
  const getColorPalette = () => {
    switch (color) {
      case 'blue':
        return {
          background: '#080E21',
          stars: ['#3AA0FF', '#95C5FF', '#68B8FF', '#FFFFFF'],
          glow: 'rgba(58, 160, 255, 0.8)',
          nebula: ['rgba(58, 160, 255, 0.05)', 'rgba(95, 197, 255, 0.05)']
        };
      case 'green':
        return {
          background: '#0C1E11',
          stars: ['#3AFF7A', '#95FFBF', '#68FFB6', '#FFFFFF'],
          glow: 'rgba(58, 255, 122, 0.8)',
          nebula: ['rgba(58, 255, 122, 0.05)', 'rgba(95, 255, 191, 0.05)']
        };
      case 'purple':
        return {
          background: '#16091D',
          stars: ['#9C3AFF', '#CE95FF', '#B668FF', '#FFFFFF'],
          glow: 'rgba(156, 58, 255, 0.8)',
          nebula: ['rgba(156, 58, 255, 0.05)', 'rgba(206, 149, 255, 0.05)']
        };
      case 'dark-purple':
      default:
        return {
          background: '#0A0A14',
          stars: ['#9C3AFF', '#CE95FF', '#B668FF', '#FFFFFF', '#30C7F0'],
          glow: 'rgba(156, 58, 255, 0.8)',
          nebula: ['rgba(156, 58, 255, 0.03)', 'rgba(75, 0, 130, 0.03)', 'rgba(30, 144, 255, 0.03)']
        };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create stars
    const colorPalette = getColorPalette();
    
    type Star = {
      x: number;
      y: number;
      radius: number;
      color: string;
      velocity: number;
      alpha: number;
      direction: number;
      twinkleSpeed: number;
    };

    type NebulaPatch = {
      x: number;
      y: number;
      radius: number;
      color: string;
      opacity: number;
    };

    const stars: Star[] = [];
    const nebulae: NebulaPatch[] = [];

    // Create nebula patches
    if (nebulaEffect) {
      for (let i = 0; i < 8; i++) {
        nebulae.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 300 + 200,
          color: colorPalette.nebula[Math.floor(Math.random() * colorPalette.nebula.length)],
          opacity: Math.random() * 0.2 + 0.05
        });
      }
    }

    // Create stars
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2 + 0.5;
      
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius,
        color: colorPalette.stars[Math.floor(Math.random() * colorPalette.stars.length)],
        velocity: (Math.random() * 0.05 + 0.01) * speed,
        alpha: Math.random() * 0.6 + 0.4,
        direction: Math.random() > 0.5 ? 1 : -1,
        twinkleSpeed: Math.random() * 0.01 + 0.003
      });
    }

    // Add some bright fixed stars (immobile)
    for (let i = 0; i < 15; i++) {
      const radius = Math.random() * 3 + 1.5;
      
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius,
        color: '#FFFFFF',
        velocity: 0, // Fixed stars
        alpha: Math.random() * 0.3 + 0.7,
        direction: Math.random() > 0.5 ? 1 : -1,
        twinkleSpeed: Math.random() * 0.005 + 0.002
      });
    }

    // Animation function
    const animate = () => {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = colorPalette.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebula patches
      if (nebulaEffect) {
        nebulae.forEach(nebula => {
          ctx.beginPath();
          ctx.globalAlpha = nebula.opacity * opacity;
          
          const gradient = ctx.createRadialGradient(
            nebula.x, nebula.y, 0, 
            nebula.x, nebula.y, nebula.radius
          );
          gradient.addColorStop(0, nebula.color);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw constellation lines (subtle connections between some stars)
      if (stars.length > 10) {
        ctx.strokeStyle = 'rgba(120, 100, 200, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        
        for (let i = 0; i < 8; i++) {
          const startIdx = Math.floor(Math.random() * stars.length);
          const endIdx = Math.floor(Math.random() * stars.length);
          
          if (startIdx !== endIdx) {
            ctx.moveTo(stars[startIdx].x, stars[startIdx].y);
            ctx.lineTo(stars[endIdx].x, stars[endIdx].y);
          }
        }
        
        ctx.stroke();
      }

      // Draw stars
      stars.forEach(star => {
        ctx.beginPath();
        ctx.globalAlpha = star.alpha * opacity;
        
        // Create gradient for glow effect
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0, 
          star.x, star.y, star.radius * 4
        );
        gradient.addColorStop(0, star.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Smaller, bright center
        ctx.beginPath();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = star.color;
        ctx.arc(star.x, star.y, star.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Move stars
        if (star.velocity > 0) {
          star.y += star.velocity;
        }
        
        // Twinkle effect
        star.alpha += star.twinkleSpeed * star.direction;
        
        if (star.alpha > 0.9) {
          star.direction = -1;
        } else if (star.alpha < 0.4) {
          star.direction = 1;
        }

        // Reset position when off screen
        if (star.y > canvas.height && star.velocity > 0) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [opacity, color, speed, particleCount, nebulaEffect]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default CosmicBackground;