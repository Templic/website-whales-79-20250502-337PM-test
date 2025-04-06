/**
 * sacred-geometry.tsx
 * 
 * A collection of sacred geometry components that can be used throughout the
 * application to create cosmic-themed design elements.
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface GeometryProps {
  className?: string;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotate?: number;
  children?: React.ReactNode;
}

/* ===== Flower of Life ===== */
export const FlowerOfLife: React.FC<GeometryProps> = ({
  className,
  size = 100,
  fill = 'none',
  stroke = 'currentColor',
  strokeWidth = 1,
  opacity = 0.6,
  rotate = 0,
}) => {
  // Flower of Life consists of multiple overlapping circles
  const circles = [];
  const radius = size / 4;
  const center = size / 2;

  // Central circle
  circles.push(
    <circle key="center" cx={center} cy={center} r={radius} />
  );

  // Surrounding circles
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    
    circles.push(
      <circle key={`level1-${i}`} cx={x} cy={y} r={radius} />
    );
    
    // Secondary ring
    for (let j = 0; j < 6; j++) {
      const secondAngle = (Math.PI / 3) * j;
      const secondX = x + radius * Math.cos(secondAngle);
      const secondY = y + radius * Math.sin(secondAngle);
      
      // Avoid duplicates by checking distance from center
      const distance = Math.sqrt(
        Math.pow(secondX - center, 2) + Math.pow(secondY - center, 2)
      );
      
      if (distance < 2.5 * radius) {
        circles.push(
          <circle key={`level2-${i}-${j}`} cx={secondX} cy={secondY} r={radius} />
        );
      }
    }
  }

  return (
    <svg
      className={cn("inline-block", className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ 
        opacity, 
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <g
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      >
        {circles}
      </g>
    </svg>
  );
};

/* ===== Sri Yantra ===== */
export const SriYantra: React.FC<GeometryProps> = ({
  className,
  size = 100,
  fill = 'none',
  stroke = 'currentColor',
  strokeWidth = 0.5,
  opacity = 0.8,
  rotate = 0,
}) => {
  const center = size / 2;
  const radius = size * 0.45;
  
  // Create triangles
  const upwardTriangle = `${center},${center - radius * 0.8} ${center + radius * 0.9},${center + radius * 0.5} ${center - radius * 0.9},${center + radius * 0.5}`;
  const downwardTriangle = `${center},${center + radius * 0.8} ${center - radius * 0.9},${center - radius * 0.5} ${center + radius * 0.9},${center - radius * 0.5}`;
  
  // Create inner triangles
  const innerTriangles = [];
  for (let i = 1; i <= 4; i++) {
    const scale = 0.95 - i * 0.15;
    innerTriangles.push(
      <polygon key={`up-${i}`} points={upwardTriangle} transform={`scale(${scale}) translate(${center * (1 - scale)}, ${center * (1 - scale)})`} />
    );
    innerTriangles.push(
      <polygon key={`down-${i}`} points={downwardTriangle} transform={`scale(${scale}) translate(${center * (1 - scale)}, ${center * (1 - scale)})`} />
    );
  }

  return (
    <svg
      className={cn("inline-block", className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ 
        opacity, 
        transform: `rotate(${rotate}deg)` 
      }}
    >
      <g
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      >
        <circle cx={center} cy={center} r={radius} />
        <polygon points={upwardTriangle} />
        <polygon points={downwardTriangle} />
        {innerTriangles}
        <circle cx={center} cy={center} r={radius * 0.1} />
      </g>
    </svg>
  );
};

/* ===== Metatron's Cube ===== */
export const MetatronsCube: React.FC<GeometryProps> = ({
  className,
  size = 100,
  fill = 'none',
  stroke = 'currentColor',
  strokeWidth = 0.5,
  opacity = 0.7,
  rotate = 0,
}) => {
  const center = size / 2;
  const radius = size * 0.4;
  
  // Calculate points on outer circle
  const points = [];
  for (let i = 0; i < 13; i++) {
    const angle = (Math.PI * 2 * i) / 13;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push({ x, y });
  }
  
  // Create lines between all points
  const lines = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      lines.push(
        <line
          key={`line-${i}-${j}`}
          x1={points[i].x}
          y1={points[i].y}
          x2={points[j].x}
          y2={points[j].y}
        />
      );
    }
  }
  
  // Create circles at each point
  const circles = points.map((point, index) => (
    <circle
      key={`circle-${index}`}
      cx={point.x}
      cy={point.y}
      r={size * 0.02}
    />
  ));

  return (
    <svg
      className={cn("inline-block", className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ 
        opacity, 
        transform: `rotate(${rotate}deg)` 
      }}
    >
      <g
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      >
        <circle cx={center} cy={center} r={radius} />
        {lines}
        {circles}
      </g>
    </svg>
  );
};

/* ===== Sacred Geometry Container ===== */
export const SacredGeometryContainer: React.FC<GeometryProps & { type?: 'flower' | 'sri' | 'metatron' }> = ({
  className,
  size = 250,
  fill = 'none',
  stroke = 'rgba(147, 112, 219, 0.4)',
  strokeWidth = 0.7,
  opacity = 0.5,
  rotate = 0,
  type = 'flower',
  children,
}) => {
  let GeometryComponent;
  
  switch (type) {
    case 'sri':
      GeometryComponent = SriYantra;
      break;
    case 'metatron':
      GeometryComponent = MetatronsCube;
      break;
    case 'flower':
    default:
      GeometryComponent = FlowerOfLife;
      break;
  }
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <GeometryComponent
          size={size}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          rotate={rotate}
        />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Default export for the sacred geometry components
export default SacredGeometryContainer;