/**
 * SacredGeometry.optimized.tsx
 * 
 * Performance-optimized version of the SacredGeometry component.
 * Implements render skipping when not visible, throttled animations,
 * and memoization to reduce CPU usage.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRenderCount, throttle, useInView, useRenderTime } from '@/lib/performance';

interface SacredGeometryProps {
  type: 'flower-of-life' | 'sri-yantra' | 'metatron-cube' | 'pentagon-star' | 'hexagon' | 'vesica-piscis' | 'golden-spiral';
  size?: number;
  color?: string;
  animate?: boolean;
  animationDuration?: number;
  lineWidth?: number;
  className?: string;
  showLabels?: boolean;
  style?: React.CSSProperties;
}

const SacredGeometry: React.FC<SacredGeometryProps> = ({
  type,
  size = 300,
  color = '#7c3aed',
  animate = false,
  animationDuration = 60,
  lineWidth = 1,
  className = '',
  showLabels = false,
  style = {},
}) => {
  // For debugging
  useRenderCount('SacredGeometry');
  const renderTime = useRenderTime();
  
  // Check if component is visible in viewport
  const [inViewRef, isInView] = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastDrawnPatternRef = useRef<string>(''); // Store last drawn pattern type

  // Throttle animation to reduce CPU usage - only redraw every 40ms (25fps) instead of 60fps
  const throttledDrawPattern = useMemo(() => throttle((rotation: number) => {
    if (!contextRef.current) return;
    
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Draw pattern based on type
    ctx.save();
    
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    // Based on pattern type
    switch (type) {
      case 'flower-of-life':
        drawFlowerOfLife(ctx, centerX, centerY, radius);
        break;
      case 'sri-yantra':
        drawSriYantra(ctx, centerX, centerY, radius);
        break;
      case 'metatron-cube':
        drawMetatronCube(ctx, centerX, centerY, radius);
        break;
      case 'pentagon-star':
        drawPentagonStar(ctx, centerX, centerY, radius);
        break;
      case 'hexagon':
        drawHexagon(ctx, centerX, centerY, radius);
        break;
      case 'vesica-piscis':
        drawVesicaPiscis(ctx, centerX, centerY, radius);
        break;
      case 'golden-spiral':
        drawGoldenSpiral(ctx, centerX, centerY, radius);
        break;
    }
    
    ctx.restore();
    
    // Draw labels if needed
    if (showLabels) {
      ctx.fillStyle = color;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(type.replace('-', ' '), centerX, size - 20);
    }
  }, 40), [type, color, showLabels, lineWidth, size]);

  // Drawing functions - implemented as needed
  function drawFlowerOfLife(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    const circleRadius = radius / 4;
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw surrounding circles
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + circleRadius * 2 * Math.cos(angle);
      const y = centerY + circleRadius * 2 * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw outer circles
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const x = centerX + circleRadius * 4 * Math.cos(angle);
      const y = centerY + circleRadius * 4 * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  function drawSriYantra(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    // Simplified Sri Yantra
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const angle = (Math.PI * 2 / 9) * i;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    // Inner triangle pointing down
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius * 0.5);
    ctx.lineTo(centerX + radius * 0.5, centerY + radius * 0.5);
    ctx.lineTo(centerX - radius * 0.5, centerY + radius * 0.5);
    ctx.closePath();
    ctx.stroke();
    
    // Inner triangle pointing up
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + radius * 0.5);
    ctx.lineTo(centerX + radius * 0.5, centerY - radius * 0.5);
    ctx.lineTo(centerX - radius * 0.5, centerY - radius * 0.5);
    ctx.closePath();
    ctx.stroke();
  }
  
  function drawMetatronCube(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw inner hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + radius * 0.7 * Math.cos(angle);
      const y = centerY + radius * 0.7 * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw inner circles at each vertex and center
    for (let i = 0; i < 7; i++) {
      const angle = i < 6 ? (Math.PI / 3) * i : 0;
      const x = i < 6 ? centerX + radius * 0.7 * Math.cos(angle) : centerX;
      const y = i < 6 ? centerY + radius * 0.7 * Math.sin(angle) : centerY;
      
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.1, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  function drawPentagonStar(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    ctx.beginPath();
    
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
    
    // Draw pentagram inside
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * (i * 2) - Math.PI / 2;
      const x = centerX + radius * 0.8 * Math.cos(angle);
      const y = centerY + radius * 0.8 * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  function drawHexagon(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    ctx.beginPath();
    
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.stroke();
    
    // Inner design
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle1 = (Math.PI / 3) * i;
      const angle2 = (Math.PI / 3) * ((i + 3) % 6);
      
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }
  
  function drawVesicaPiscis(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    const offset = radius / 2;
    
    // Draw left circle
    ctx.beginPath();
    ctx.arc(centerX - offset / 2, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw right circle
    ctx.beginPath();
    ctx.arc(centerX + offset / 2, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  function drawGoldenSpiral(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    const phi = 1.618033988749895;
    let currentRadius = radius;
    let angle = 0;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    
    // Draw the spiral
    for (let i = 0; i < 6; i++) {
      const arcLength = Math.PI / 2;
      const arcSegments = 20;
      const arcStepSize = arcLength / arcSegments;
      
      for (let j = 0; j < arcSegments; j++) {
        angle += arcStepSize;
        currentRadius /= Math.sqrt(phi);
        
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);
        
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Cache the drawing context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    contextRef.current = ctx;
    
    // Set up high-quality canvas rendering for better appearance
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Reset state
    rotationRef.current = 0;
    lastDrawnPatternRef.current = type;
    
    // One-time drawing for non-animated patterns
    if (!animate) {
      throttledDrawPattern(0);
      return;
    }
    
    // Set up animation loop for animated patterns, but only
    // animate when the component is actually visible
    const animatePattern = () => {
      if (animate && isInView) {
        rotationRef.current += 0.001; // Slow rotation for better performance
        throttledDrawPattern(rotationRef.current);
        animationRef.current = requestAnimationFrame(animatePattern);
      } else if (!isInView && animationRef.current) {
        // Pause animation when not in view to save CPU
        cancelAnimationFrame(animationRef.current);
      }
    };
    
    animatePattern();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [type, size, color, animate, animationDuration, lineWidth, showLabels, isInView, throttledDrawPattern]);

  return (
    <canvas
      ref={(el) => {
        if (el) {
          canvasRef.current = el;
          inViewRef.current = el;
        }
      }}
      width={size}
      height={size}
      className={cn('sacred-geometry', className)}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      aria-label={`Sacred geometry ${type} pattern`}
    />
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(SacredGeometry);