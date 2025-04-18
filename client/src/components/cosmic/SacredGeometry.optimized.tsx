/**
 * SacredGeometry.optimized.tsx
 * 
 * Performance-optimized version of the SacredGeometry component.
 * Implements render skipping when not visible, throttled animations,
 * and memoization to reduce CPU usage.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRenderCount, useSkipRenderIfInvisible, useInView, throttle, measureExecutionTime } from '@/lib/performance';
import { useIsMobile } from '@/hooks/use-responsive';

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
  // Performance monitoring and optimization hooks
  useRenderCount('SacredGeometry');
  const [inViewRef, isInView] = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });
  const skipRenderRef = useSkipRenderIfInvisible(isInView);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  const isMobile = useIsMobile();
  
  // Memoize expensive initial calculations
  const memoizedSize = useMemo(() => isMobile ? Math.min(size, window.innerWidth * 0.8) : size, [size, isMobile]);
  const memoizedLineWidth = useMemo(() => isMobile ? Math.max(0.5, lineWidth * 0.8) : lineWidth, [lineWidth, isMobile]);
  
  // Create throttled animation function to reduce CPU usage
  const throttledAnimate = useRef(
    throttle(() => {
      if (!animate || !isInView) return;
      
      rotationRef.current += 0.001; // Adjust rotation speed
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      drawPattern(ctx, rotationRef.current);
      animationRef.current = requestAnimationFrame(throttledAnimate.current);
    }, 1000 / 30) // Limit to 30fps
  ).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInView) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = memoizedSize;
    canvas.height = memoizedSize;
    
    // Draw pattern immediately
    measureExecutionTime('SacredGeometry.drawPattern', () => {
      drawPattern(ctx, rotationRef.current);
    });

    // Start animation if enabled
    if (animate && isInView) {
      animationRef.current = requestAnimationFrame(throttledAnimate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [type, memoizedSize, color, animate, isInView, memoizedLineWidth, showLabels, throttledAnimate]);

  // Function to draw different sacred geometry patterns
  function drawPattern(ctx: CanvasRenderingContext2D, rotation = 0) {
    ctx.clearRect(0, 0, memoizedSize, memoizedSize);
    ctx.strokeStyle = color;
    ctx.lineWidth = memoizedLineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const centerX = memoizedSize / 2;
    const centerY = memoizedSize / 2;
    const radius = memoizedSize * 0.4;

    switch (type) {
      case 'flower-of-life':
        drawFlowerOfLife(ctx, centerX, centerY, radius, rotation);
        break;
      case 'sri-yantra':
        drawSriYantra(ctx, centerX, centerY, radius, rotation);
        break;
      case 'metatron-cube':
        drawMetatronCube(ctx, centerX, centerY, radius, rotation);
        break;
      case 'pentagon-star':
        drawPentagonStar(ctx, centerX, centerY, radius, rotation);
        break;
      case 'hexagon':
        drawHexagon(ctx, centerX, centerY, radius, rotation);
        break;
      case 'vesica-piscis':
        drawVesicaPiscis(ctx, centerX, centerY, radius, rotation);
        break;
      case 'golden-spiral':
        drawGoldenSpiral(ctx, centerX, centerY, radius, rotation);
        break;
      default:
        drawFlowerOfLife(ctx, centerX, centerY, radius, rotation);
    }

    if (showLabels) {
      drawLabel(ctx, centerX, centerY + radius + 30, type.replace(/-/g, ' '));
    }
  }

  // Flower of Life pattern
  function drawFlowerOfLife(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, rotation: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    const smallerRadius = radius / 2;
    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, smallerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Only draw detailed circles if not on mobile to improve performance
    const circleLimit = isMobile ? 6 : 12;
    
    // Surrounding circles
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + smallerRadius * Math.cos(angle);
      const y = centerY + smallerRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, smallerRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Add second layer of circles (reduced for performance)
      if (i < circleLimit) {
        for (let j = 0; j < 6; j++) {
          if (j % (isMobile ? 2 : 1) !== 0) continue; // Skip some circles on mobile
          
          const innerAngle = (Math.PI / 3) * j;
          const innerX = x + smallerRadius * Math.cos(innerAngle);
          const innerY = y + smallerRadius * Math.sin(innerAngle);
          
          // Only draw if the circle is within the overall radius
          const distFromCenter = Math.sqrt(Math.pow(innerX - centerX, 2) + Math.pow(innerY - centerY, 2));
          if (distFromCenter <= radius * 1.1) {
            ctx.beginPath();
            ctx.arc(innerX, innerY, smallerRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }

  // Sri Yantra pattern
  function drawSriYantra(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, rotation: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    // Draw triangles
    // Downward-pointing triangle
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY + radius * 0.577);
    ctx.lineTo(centerX + radius, centerY + radius * 0.577);
    ctx.lineTo(centerX, centerY - radius * 1.155);
    ctx.closePath();
    ctx.stroke();

    // Upward-pointing triangle
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY - radius * 0.577);
    ctx.lineTo(centerX + radius, centerY - radius * 0.577);
    ctx.lineTo(centerX, centerY + radius * 1.155);
    ctx.closePath();
    ctx.stroke();

    // Inner triangles
    const innerRadius = radius * 0.8;
    // Inner downward-pointing triangle
    ctx.beginPath();
    ctx.moveTo(centerX - innerRadius, centerY + innerRadius * 0.577);
    ctx.lineTo(centerX + innerRadius, centerY + innerRadius * 0.577);
    ctx.lineTo(centerX, centerY - innerRadius * 1.155);
    ctx.closePath();
    ctx.stroke();

    // Inner upward-pointing triangle
    ctx.beginPath();
    ctx.moveTo(centerX - innerRadius, centerY - innerRadius * 0.577);
    ctx.lineTo(centerX + innerRadius, centerY - innerRadius * 0.577);
    ctx.lineTo(centerX, centerY + innerRadius * 1.155);
    ctx.closePath();
    ctx.stroke();

    // Smallest triangles
    const smallestRadius = radius * 0.5;
    // Smallest downward-pointing triangle
    ctx.beginPath();
    ctx.moveTo(centerX - smallestRadius, centerY + smallestRadius * 0.577);
    ctx.lineTo(centerX + smallestRadius, centerY + smallestRadius * 0.577);
    ctx.lineTo(centerX, centerY - smallestRadius * 1.155);
    ctx.closePath();
    ctx.stroke();

    // Smallest upward-pointing triangle
    ctx.beginPath();
    ctx.moveTo(centerX - smallestRadius, centerY - smallestRadius * 0.577);
    ctx.lineTo(centerX + smallestRadius, centerY - smallestRadius * 0.577);
    ctx.lineTo(centerX, centerY + smallestRadius * 1.155);
    ctx.closePath();
    ctx.stroke();

    // Central dot (bindu)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Metatron's Cube pattern
  function drawMetatronCube(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, rotation: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    // Draw 13 circles representing the 13 spheres of Metatron's Cube
    const points = [];
    
    // Center point
    points.push({x: centerX, y: centerY});
    
    // First ring: 6 points in a hexagon
    const innerRadius = radius * 0.5;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      points.push({
        x: centerX + innerRadius * Math.cos(angle),
        y: centerY + innerRadius * Math.sin(angle)
      });
    }
    
    // Second ring: 6 points in a larger hexagon
    const outerRadius = radius * 0.85;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6; // Offset by 30 degrees
      points.push({
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle)
      });
    }

    // Draw circles at each point
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Connect all points to create the "cube"
    // Optimized to reduce line count on mobile
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        // Skip some connections on mobile for better performance
        if (isMobile && (i * j) % 3 === 0 && j > 7) continue;
        
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Pentagon star (pentagram)
  function drawPentagonStar(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, rotation: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    ctx.beginPath();
    // Draw a pentagram
    const points = 5;
    const angleOffset = Math.PI / 2; // Start from top
    
    // First, calculate all the outer points
    const outerPoints = [];
    for (let i = 0; i < points; i++) {
      const angle = angleOffset + (Math.PI * 2 * i) / points;
      outerPoints.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }
    
    // Connect every second point to create the star
    ctx.moveTo(outerPoints[0].x, outerPoints[0].y);
    ctx.lineTo(outerPoints[2].x, outerPoints[2].y);
    ctx.lineTo(outerPoints[4].x, outerPoints[4].y);
    ctx.lineTo(outerPoints[1].x, outerPoints[1].y);
    ctx.lineTo(outerPoints[3].x, outerPoints[3].y);
    ctx.closePath();
    ctx.stroke();

    // Also draw the pentagon
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = angleOffset + (Math.PI * 2 * i) / points;
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

    ctx.restore();
  }

  // Hexagon
  function drawHexagon(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, rotation: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    // Draw main hexagon
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

    // Draw inner hexagon
    const innerRadius = radius * 0.7;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + innerRadius * Math.cos(angle);
      const y = centerY + innerRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    // Connect vertices to create sacred geometry pattern
    // On mobile, reduce the number of connections for better performance
    for (let i = 0; i < 6; i++) {
      // Skip some connections on mobile
      if (isMobile && i % 2 === 1) continue;
      
      const angle1 = (Math.PI / 3) * i;
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      
      for (let j = 0; j < 6; j++) {
        if (i !== j && (i + j) % 3 === 0) { // Connect opposite points
          const angle2 = (Math.PI / 3) * j;
          const x2 = centerX + radius * Math.cos(angle2);
          const y2 = centerY + radius * Math.sin(angle2);
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  // Vesica Piscis
  function drawVesicaPiscis(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, rotation: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    const r = radius * 0.6;
    const d = r; // Distance between circle centers (equal to radius for Vesica Piscis)
    
    // First circle
    ctx.beginPath();
    ctx.arc(centerX - d/2, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
    
    // Second circle
    ctx.beginPath();
    ctx.arc(centerX + d/2, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
    
    // Connecting lines to show the vesica piscis shape
    const h = Math.sqrt(r*r - (d/2)*(d/2)); // Height of the vesica piscis
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - h);
    ctx.lineTo(centerX, centerY + h);
    ctx.stroke();
    
    // Draw the eye-like shape
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - h);
    ctx.arc(centerX - d/2, centerY, r, -Math.PI/3, Math.PI/3, false);
    ctx.arc(centerX + d/2, centerY, r, Math.PI*2/3, Math.PI*4/3, false);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  // Golden Spiral
  function drawGoldenSpiral(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, rotation: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    const phi = 1.618033988749895; // Golden ratio
    // Reduce iterations on mobile for better performance
    const maxIterations = isMobile ? 6 : 10; 
    const initialSize = radius * 0.7;
    
    let currentSize = initialSize;
    let currentX = centerX - currentSize / 2;
    let currentY = centerY - currentSize / 2;
    
    // Draw Fibonacci rectangles
    for (let i = 0; i < maxIterations; i++) {
      ctx.beginPath();
      ctx.rect(currentX, currentY, currentSize, currentSize);
      ctx.stroke();
      
      // Prepare for next rectangle
      const nextSize = currentSize / phi;
      
      // Position next rectangle (rotates 90 degrees counter-clockwise each time)
      if (i % 4 === 0) {
        currentX = currentX;
        currentY = currentY - nextSize;
      } else if (i % 4 === 1) {
        currentX = currentX - nextSize;
        currentY = currentY;
      } else if (i % 4 === 2) {
        currentX = currentX;
        currentY = currentY + currentSize - nextSize;
      } else if (i % 4 === 3) {
        currentX = currentX + currentSize - nextSize;
        currentY = currentY;
      }
      
      currentSize = nextSize;
    }
    
    // Draw the spiral
    ctx.beginPath();
    currentSize = initialSize;
    
    // Start at the outer edge of the largest square
    let startX = centerX + initialSize / 2;
    let startY = centerY - initialSize / 2;
    
    ctx.moveTo(startX, startY);
    
    // Draw quarter circles for each rectangle
    for (let i = 0; i < maxIterations; i++) {
      let centerX, centerY, startAngle, endAngle;
      
      if (i % 4 === 0) {
        centerX = centerX + currentSize / 2;
        centerY = centerY + currentSize / 2;
        startAngle = Math.PI * 3/2;
        endAngle = Math.PI;
      } else if (i % 4 === 1) {
        centerX = centerX - currentSize / 2;
        centerY = centerY + currentSize / 2;
        startAngle = Math.PI;
        endAngle = Math.PI / 2;
      } else if (i % 4 === 2) {
        centerX = centerX - currentSize / 2;
        centerY = centerY - currentSize / 2;
        startAngle = Math.PI / 2;
        endAngle = 0;
      } else if (i % 4 === 3) {
        centerX = centerX + currentSize / 2;
        centerY = centerY - currentSize / 2;
        startAngle = 0;
        endAngle = Math.PI * 3/2;
      }
      
      ctx.arc(centerX, centerY, currentSize, startAngle, endAngle, false);
      currentSize = currentSize / phi;
    }
    
    ctx.stroke();

    ctx.restore();
  }

  // Draw label text
  function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
    ctx.fillStyle = color;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
  }

  return (
    <canvas
      ref={React.useCallback(
        (node) => {
          // Save the ref in our own ref
          if (node !== null) {
            canvasRef.current = node;
          }
          // Pass it to the inView ref
          if (typeof inViewRef === 'function') {
            inViewRef(node);
          }
        },
        [inViewRef]
      )}
      width={memoizedSize}
      height={memoizedSize}
      className={cn('sacred-geometry', className)}
      style={{
        width: memoizedSize,
        height: memoizedSize,
        ...style,
      }}
      aria-label={`Sacred geometry visualization of ${type.replace(/-/g, ' ')}`}
    />
  );
};

export default React.memo(SacredGeometry);