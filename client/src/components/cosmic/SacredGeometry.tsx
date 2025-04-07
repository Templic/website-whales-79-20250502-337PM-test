/**
 * SacredGeometry.tsx
 * 
 * Component Type: cosmic
 * Migrated from: v0 components
 * Migration Date: 2025-04-05
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SacredGeometryProps {
  type: 'flower-of-life' | 'sri-yantra' | 'metatron-cube' | 'pentagon-star' | 'hexagon' | 'vesica-piscis' | 'golden-spiral' | 'fibonacci-spiral' | 'merkaba' | 'octagon';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    // Function to draw different sacred geometry patterns
    const drawPattern = (rotation = 0) => {
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

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
        case 'fibonacci-spiral':
          drawFibonacciSpiral(ctx, centerX, centerY, radius, rotation);
          break;
        case 'merkaba':
          drawMerkaba(ctx, centerX, centerY, radius, rotation);
          break;
        case 'octagon':
          drawOctagon(ctx, centerX, centerY, radius, rotation);
          break;
        default:
          drawFlowerOfLife(ctx, centerX, centerY, radius, rotation);
      }

      if (showLabels) {
        drawLabel(ctx, centerX, centerY + radius + 30, type.replace(/-/g, ' '));
      }
    };

    // Flower of Life pattern
    function drawFlowerOfLife(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      const smallerRadius = radius / 2;
      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, smallerRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Surrounding circles
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = cx + smallerRadius * Math.cos(angle);
        const y = cy + smallerRadius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, smallerRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add second layer of circles
        for (let j = 0; j < 6; j++) {
          const innerAngle = (Math.PI / 3) * j;
          const innerX = x + smallerRadius * Math.cos(innerAngle);
          const innerY = y + smallerRadius * Math.sin(innerAngle);
          
          // Only draw if the circle is within the overall radius
          const distFromCenter = Math.sqrt(Math.pow(innerX - cx, 2) + Math.pow(innerY - cy, 2));
          if (distFromCenter <= radius * 1.1) {
            ctx.beginPath();
            ctx.arc(innerX, innerY, smallerRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    }

    // Sri Yantra pattern
    function drawSriYantra(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      // Draw triangles
      // Downward-pointing triangle
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy + radius * 0.577);
      ctx.lineTo(cx + radius, cy + radius * 0.577);
      ctx.lineTo(cx, cy - radius * 1.155);
      ctx.closePath();
      ctx.stroke();

      // Upward-pointing triangle
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy - radius * 0.577);
      ctx.lineTo(cx + radius, cy - radius * 0.577);
      ctx.lineTo(cx, cy + radius * 1.155);
      ctx.closePath();
      ctx.stroke();

      // Inner triangles
      const innerRadius = radius * 0.8;
      // Inner downward-pointing triangle
      ctx.beginPath();
      ctx.moveTo(cx - innerRadius, cy + innerRadius * 0.577);
      ctx.lineTo(cx + innerRadius, cy + innerRadius * 0.577);
      ctx.lineTo(cx, cy - innerRadius * 1.155);
      ctx.closePath();
      ctx.stroke();

      // Inner upward-pointing triangle
      ctx.beginPath();
      ctx.moveTo(cx - innerRadius, cy - innerRadius * 0.577);
      ctx.lineTo(cx + innerRadius, cy - innerRadius * 0.577);
      ctx.lineTo(cx, cy + innerRadius * 1.155);
      ctx.closePath();
      ctx.stroke();

      // Smallest triangles
      const smallestRadius = radius * 0.5;
      // Smallest downward-pointing triangle
      ctx.beginPath();
      ctx.moveTo(cx - smallestRadius, cy + smallestRadius * 0.577);
      ctx.lineTo(cx + smallestRadius, cy + smallestRadius * 0.577);
      ctx.lineTo(cx, cy - smallestRadius * 1.155);
      ctx.closePath();
      ctx.stroke();

      // Smallest upward-pointing triangle
      ctx.beginPath();
      ctx.moveTo(cx - smallestRadius, cy - smallestRadius * 0.577);
      ctx.lineTo(cx + smallestRadius, cy - smallestRadius * 0.577);
      ctx.lineTo(cx, cy + smallestRadius * 1.155);
      ctx.closePath();
      ctx.stroke();

      // Central dot (bindu)
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Metatron's Cube pattern
    function drawMetatronCube(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      // Draw 13 circles representing the 13 spheres of Metatron's Cube
      const points = [];
      
      // Center point
      points.push({x: cx, y: cy});
      
      // First ring: 6 points in a hexagon
      const innerRadius = radius * 0.5;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push({
          x: cx + innerRadius * Math.cos(angle),
          y: cy + innerRadius * Math.sin(angle)
        });
      }
      
      // Second ring: 6 points in a larger hexagon
      const outerRadius = radius * 0.85;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6; // Offset by 30 degrees
        points.push({
          x: cx + outerRadius * Math.cos(angle),
          y: cy + outerRadius * Math.sin(angle)
        });
      }

      // Draw circles at each point
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connect all points to create the "cube"
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Pentagon star (pentagram)
    function drawPentagonStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      ctx.beginPath();
      // Draw a pentagram
      const points = 5;
      const angleOffset = Math.PI / 2; // Start from top
      
      // First, calculate all the outer points
      const outerPoints = [];
      for (let i = 0; i < points; i++) {
        const angle = angleOffset + (Math.PI * 2 * i) / points;
        outerPoints.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle)
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
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        
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
    function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      // Draw main hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        
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
        const x = cx + innerRadius * Math.cos(angle);
        const y = cy + innerRadius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      // Connect vertices to create sacred geometry pattern
      for (let i = 0; i < 6; i++) {
        const angle1 = (Math.PI / 3) * i;
        const x1 = cx + radius * Math.cos(angle1);
        const y1 = cy + radius * Math.sin(angle1);
        
        for (let j = 0; j < 6; j++) {
          if (i !== j && (i + j) % 3 === 0) { // Connect opposite points
            const angle2 = (Math.PI / 3) * j;
            const x2 = cx + radius * Math.cos(angle2);
            const y2 = cy + radius * Math.sin(angle2);
            
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
    function drawVesicaPiscis(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      const r = radius * 0.6;
      const d = r; // Distance between circle centers (equal to radius for Vesica Piscis)
      
      // First circle
      ctx.beginPath();
      ctx.arc(cx - d/2, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      
      // Second circle
      ctx.beginPath();
      ctx.arc(cx + d/2, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      
      // Connecting lines to show the vesica piscis shape
      const h = Math.sqrt(r*r - (d/2)*(d/2)); // Height of the vesica piscis
      
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx, cy + h);
      ctx.stroke();
      
      // Draw the eye-like shape
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.arc(cx - d/2, cy, r, -Math.PI/3, Math.PI/3, false);
      ctx.arc(cx + d/2, cy, r, Math.PI*2/3, Math.PI*4/3, false);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }

    // Golden Spiral
    function drawGoldenSpiral(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      const phi = 1.618033988749895; // Golden ratio
      const maxIterations = 10;
      const initialSize = radius * 0.7;
      
      let currentSize = initialSize;
      let currentX = cx - currentSize / 2;
      let currentY = cy - currentSize / 2;
      
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
      let startX = cx + initialSize / 2;
      let startY = cy - initialSize / 2;
      
      ctx.moveTo(startX, startY);
      
      // Draw quarter circles for each rectangle
      for (let i = 0; i < maxIterations; i++) {
        let centerX = cx;
        let centerY = cy;
        let startAngle = 0;
        let endAngle = Math.PI / 2;
        
        if (i % 4 === 0) {
          centerX = cx + currentSize / 2;
          centerY = cy + currentSize / 2;
          startAngle = Math.PI * 3/2;
          endAngle = Math.PI;
        } else if (i % 4 === 1) {
          centerX = cx - currentSize / 2;
          centerY = cy + currentSize / 2;
          startAngle = Math.PI;
          endAngle = Math.PI / 2;
        } else if (i % 4 === 2) {
          centerX = cx - currentSize / 2;
          centerY = cy - currentSize / 2;
          startAngle = Math.PI / 2;
          endAngle = 0;
        } else if (i % 4 === 3) {
          centerX = cx + currentSize / 2;
          centerY = cy - currentSize / 2;
          startAngle = 0;
          endAngle = Math.PI * 3/2;
        }
        
        ctx.arc(centerX, centerY, currentSize, startAngle, endAngle, false);
        currentSize = currentSize / phi;
      }
      
      ctx.stroke();

      ctx.restore();
    }

    // Fibonacci Spiral (similar to Golden Spiral but using Fibonacci numbers)
    function drawFibonacciSpiral(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      // Fibonacci sequence
      const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
      const maxSize = Math.min(fibonacci[fibonacci.length - 1], radius * 1.5);
      const scale = (radius * 0.9) / maxSize;
      
      // Start at a relative center
      let currentX = cx;
      let currentY = cy;
      let direction = 0; // 0: right, 1: down, 2: left, 3: up
      
      // Draw the spiral
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      
      for (let i = 0; i < fibonacci.length - 1; i++) {
        const size = fibonacci[i] * scale;
        
        // Draw rectangle
        ctx.rect(currentX, currentY, size, size);
        
        // Calculate positions for the arc
        let arcX, arcY;
        switch (direction) {
          case 0: // going right
            arcX = currentX + size;
            arcY = currentY + size;
            currentX += size;
            break;
          case 1: // going down
            arcX = currentX;
            arcY = currentY + size;
            currentY += size;
            break;
          case 2: // going left
            arcX = currentX;
            arcY = currentY;
            currentX -= fibonacci[i+1] * scale;
            break;
          case 3: // going up
            arcX = currentX + size;
            arcY = currentY;
            currentY -= fibonacci[i+1] * scale;
            break;
        }
        
        // Draw the arc
        const startAngle = Math.PI * 0.5 * (direction);
        const endAngle = Math.PI * 0.5 * ((direction + 1) % 4);
        if (arcX !== undefined && arcY !== undefined) {
          ctx.arc(arcX, arcY, size, startAngle, endAngle, false);
        }
        
        // Update direction for next segment
        direction = (direction + 1) % 4;
      }
      
      ctx.stroke();
      
      ctx.restore();
    }

    // Merkaba (Star Tetrahedron)
    function drawMerkaba(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);
      
      // Draw upward-pointing tetrahedron
      const upperRadius = radius * 0.8;
      ctx.beginPath();
      
      // Top point
      const topX = cx;
      const topY = cy - upperRadius;
      
      // Bottom triangle points (120° apart)
      const bottomPoints = [];
      for (let i = 0; i < 3; i++) {
        const angle = Math.PI * 2 / 3 * i + Math.PI / 6;
        bottomPoints.push({
          x: cx + upperRadius * Math.cos(angle),
          y: cy + upperRadius * Math.sin(angle)
        });
      }
      
      // Draw edges
      ctx.moveTo(topX, topY);
      ctx.lineTo(bottomPoints[0].x, bottomPoints[0].y);
      ctx.lineTo(bottomPoints[1].x, bottomPoints[1].y);
      ctx.lineTo(topX, topY);
      ctx.moveTo(topX, topY);
      ctx.lineTo(bottomPoints[2].x, bottomPoints[2].y);
      ctx.moveTo(bottomPoints[0].x, bottomPoints[0].y);
      ctx.lineTo(bottomPoints[2].x, bottomPoints[2].y);
      ctx.moveTo(bottomPoints[1].x, bottomPoints[1].y);
      ctx.lineTo(bottomPoints[2].x, bottomPoints[2].y);
      
      ctx.stroke();
      
      // Draw downward-pointing tetrahedron
      const lowerRadius = radius * 0.8;
      ctx.beginPath();
      
      // Bottom point
      const bottomX = cx;
      const bottomY = cy + lowerRadius;
      
      // Top triangle points (120° apart)
      const topPoints = [];
      for (let i = 0; i < 3; i++) {
        const angle = Math.PI * 2 / 3 * i - Math.PI / 6;
        topPoints.push({
          x: cx + lowerRadius * Math.cos(angle),
          y: cy + lowerRadius * Math.sin(angle)
        });
      }
      
      // Draw edges
      ctx.moveTo(bottomX, bottomY);
      ctx.lineTo(topPoints[0].x, topPoints[0].y);
      ctx.lineTo(topPoints[1].x, topPoints[1].y);
      ctx.lineTo(bottomX, bottomY);
      ctx.moveTo(bottomX, bottomY);
      ctx.lineTo(topPoints[2].x, topPoints[2].y);
      ctx.moveTo(topPoints[0].x, topPoints[0].y);
      ctx.lineTo(topPoints[2].x, topPoints[2].y);
      ctx.moveTo(topPoints[1].x, topPoints[1].y);
      ctx.lineTo(topPoints[2].x, topPoints[2].y);
      
      ctx.stroke();
      
      // Draw central hexagram
      ctx.beginPath();
      ctx.moveTo(bottomPoints[0].x, bottomPoints[0].y);
      ctx.lineTo(topPoints[0].x, topPoints[0].y);
      ctx.lineTo(bottomPoints[1].x, bottomPoints[1].y);
      ctx.lineTo(topPoints[1].x, topPoints[1].y);
      ctx.lineTo(bottomPoints[2].x, bottomPoints[2].y);
      ctx.lineTo(topPoints[2].x, topPoints[2].y);
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Octagon
    function drawOctagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotation: number) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);
      
      // Draw main octagon
      ctx.beginPath();
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 * i) / points + Math.PI / 8; // Offset to flat top
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      
      // Draw inner octagon
      const innerRadius = radius * 0.7;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 * i) / points + Math.PI / 8;
        const x = cx + innerRadius * Math.cos(angle);
        const y = cy + innerRadius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      
      // Connect vertices
      for (let i = 0; i < points; i++) {
        const angle1 = (Math.PI * 2 * i) / points + Math.PI / 8;
        const x1 = cx + radius * Math.cos(angle1);
        const y1 = cy + radius * Math.sin(angle1);
        
        // Connect to opposite point
        const oppositeIdx = (i + 4) % points;
        const angle2 = (Math.PI * 2 * oppositeIdx) / points + Math.PI / 8;
        const x2 = cx + radius * Math.cos(angle2);
        const y2 = cy + radius * Math.sin(angle2);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      
      // Draw star inside
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 * i) / points + Math.PI / 8;
        const innerX = cx + innerRadius * 0.7 * Math.cos(angle);
        const innerY = cy + innerRadius * 0.7 * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(innerX, innerY);
        } else {
          ctx.lineTo(innerX, innerY);
        }
      }
      ctx.closePath();
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

    // Animation loop
    const animationFunction = () => {
      if (animate) {
        rotationRef.current += 0.001; // Adjust rotation speed
        drawPattern(rotationRef.current);
        animationRef.current = requestAnimationFrame(animationFunction);
      } else {
        drawPattern(0);
      }
    };

    animationFunction();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [type, size, color, animate, animationDuration, lineWidth, showLabels]);

  return (
    <canvas
      ref={canvasRef}
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

export default SacredGeometry;