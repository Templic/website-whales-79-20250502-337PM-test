import React, { useEffect, useRef } from 'react';
import './cosmic-animations.css';

interface StarBackgroundProps {
  starCount?: number;
  density?: 'low' | 'medium' | 'high';
  colors?: string[];
  twinkle?: boolean;
  shooting?: boolean;
  nebula?: boolean;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StarBackground: React.FC<StarBackgroundProps> = ({
  starCount = 100,
  density = 'medium',
  colors = ['#00ebd6', '#7c3aed', '#e15554', '#fb923c', '#ffffff'],
  twinkle = true,
  shooting = true,
  nebula = false,
  opacity = 1,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate actual star count based on density
  const getActualStarCount = () => {
    switch (density) {
      case 'low': return Math.floor(starCount * 0.5);
      case 'high': return Math.floor(starCount * 2);
      default: return starCount;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match its display size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Generate stars
    const actualStarCount = getActualStarCount();
    const stars = Array.from({ length: actualStarCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      twinkleSpeed: Math.random() * 0.05 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.5 + 0.5
    }));
    
    // Generate shooting stars
    const shootingStars: any[] = [];
    if (shooting) {
      const shootingStarCount = Math.floor(actualStarCount * 0.02);
      for (let i = 0; i < shootingStarCount; i++) {
        generateShootingStar();
      }
    }
    
    function generateShootingStar() {
      const angle = Math.random() * Math.PI * 2;
      // Safely use canvas dimensions
      const canvasWidth = canvas?.width || window.innerWidth;
      const canvasHeight = canvas?.height || window.innerHeight;
      const distance = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
      const length = Math.random() * 50 + 50;
      const speed = Math.random() * 2 + 1;
      
      shootingStars.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        length: length,
        angle: angle,
        speed: speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        active: false,
        activationTime: Math.random() * 10000 + 5000,
        lastActivation: Date.now() + Math.random() * 5000
      });
    }
    
    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      if (!canvas) return;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw nebula effect if enabled
      if (nebula) {
        drawNebula(ctx, canvasWidth, canvasHeight);
      }
      
      // Draw stars
      const currentTime = Date.now() / 1000;
      stars.forEach(star => {
        const twinkleFactor = twinkle ? 
          Math.sin(currentTime * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7 : 
          1;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * twinkleFactor, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.opacity * twinkleFactor * opacity;
        ctx.fill();
      });
      
      // Draw shooting stars
      if (shooting) {
        const now = Date.now();
        shootingStars.forEach((star: any) => {
          if (!star.active && now - star.lastActivation > star.activationTime) {
            star.active = true;
            star.progress = 0;
            star.x = Math.random() * canvasWidth;
            star.y = Math.random() * canvasHeight;
            star.lastActivation = now;
          }
          
          if (star.active) {
            star.progress += star.speed / 100;
            if (star.progress >= 1) {
              star.active = false;
              return;
            }
            
            const fadeInOut = Math.sin(star.progress * Math.PI);
            const startX = star.x;
            const startY = star.y;
            const endX = startX + Math.cos(star.angle) * star.length;
            const endY = startY + Math.sin(star.angle) * star.length;
            
            const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, 'rgba(255, 255, 255, ' + fadeInOut + ')');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(
              startX + Math.cos(star.angle) * star.length * star.progress,
              startY + Math.sin(star.angle) * star.length * star.progress
            );
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount, density, colors, twinkle, shooting, nebula, opacity]);
  
  function drawNebula(ctx: CaniosRenderingContext2D, width: number, height: number) {
    const gradient = ctx.createRadialGradient(
      width / 2, 
      height / 2, 
      10, 
      width / 2, 
      height / 2, 
      width / 1.5
    );
    
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.03)');
    gradient.addColorStop(0.4, 'rgba(0, 235, 214, 0.02)');
    gradient.addColorStop(0.6, 'rgba(251, 146, 60, 0.01)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} style={style}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
      />
    </div>
  );
};

// Additional background components

export const NebulaBackground: React.FC<{className?: string, opacity?: number, variant?: 'cosmic' | 'triadic' | 'complementary'}> = ({
  className = '',
  opacity = 0.1,
  variant = 'cosmic'
}) => {
  const getNebulaClasses = () => {
    switch (variant) {
      case 'triadic':
        return 'bg-gradient-radial from-cyan-600/5 via-purple-600/5 to-orange-500/5 nebula-triadic';
      case 'complementary':
        return 'bg-gradient-radial from-purple-600/5 via-blue-700/5 to-cyan-400/5 nebula-complementary';
      default:
        return 'bg-gradient-radial from-purple-600/5 via-indigo-700/5 to-blue-500/5 nebula-cosmic';
    }
  };
  
  return (
    <div 
      className={`absolute inset-0 ${getNebulaClasses()} ${className}`}
      style={{ opacity }}
    ></div>
  );
};

interface CaniosRenderingContext2D extends CanvasRenderingContext2D {}