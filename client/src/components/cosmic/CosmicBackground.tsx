import React, { useRef, useEffect } from 'react';

interface CosmicBackgroundProps {
  opacity?: number;
  color?: 'purple' | 'blue' | 'green';
  speed?: number;
  particleCount?: number;
  className?: string;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  opacity = 0.5,
  color = 'purple',
  speed = 1,
  particleCount = 150,
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
          glow: 'rgba(58, 160, 255, 0.8)'
        };
      case 'green':
        return {
          background: '#0C1E11',
          stars: ['#3AFF7A', '#95FFBF', '#68FFB6', '#FFFFFF'],
          glow: 'rgba(58, 255, 122, 0.8)'
        };
      case 'purple':
      default:
        return {
          background: '#16091D',
          stars: ['#9C3AFF', '#CE95FF', '#B668FF', '#FFFFFF'],
          glow: 'rgba(156, 58, 255, 0.8)'
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

    const stars: Star[] = [];

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

    // Animation function
    const animate = () => {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = colorPalette.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        star.y += star.velocity;
        
        // Twinkle effect
        star.alpha += star.twinkleSpeed * star.direction;
        
        if (star.alpha > 0.9) {
          star.direction = -1;
        } else if (star.alpha < 0.4) {
          star.direction = 1;
        }

        // Reset position when off screen
        if (star.y > canvas.height) {
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
  }, [opacity, color, speed, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default CosmicBackground;