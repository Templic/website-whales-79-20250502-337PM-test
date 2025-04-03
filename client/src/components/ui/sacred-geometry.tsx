import React from 'react';
import { cn } from '../../lib/utils';

export interface SacredGeometryProps {
  type: 'cube' | 'tetrahedron' | 'octahedron' | 'icosahedron' | 'dodecahedron' | 'merkaba';
  className?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  animate?: boolean;
  size?: number;
}

const SacredGeometry: React.FC<SacredGeometryProps> = ({
  type,
  className,
  strokeWidth = 1.5,
  fillOpacity = 0.1,
  animate = true,
  size = 24,
}) => {
  // Shared style for all geometry components
  const svgStyle = {
    "--stroke-width": `${strokeWidth}px`,
    "--fill-opacity": fillOpacity,
  } as React.CSSProperties;

  // Animation class based on the animate prop
  const animationClass = animate ? 'animate-spin-very-slow' : '';

  switch (type) {
    case 'cube':
      return (
        <svg
          className={cn('stroke-current', animationClass, className)}
          style={svgStyle}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 2L2 7L12 12L22 7L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
          <path 
            d="M2 7V17L12 22V12" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
          <path 
            d="M12 12V22L22 17V7" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
        </svg>
      );
    
    case 'tetrahedron':
      return (
        <svg
          className={cn('stroke-current', animationClass, className)}
          style={svgStyle}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 2L3 20H21L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
          <path 
            d="M12 2L3 20L12 14L21 20L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
        </svg>
      );
    
    case 'octahedron':
      return (
        <svg
          className={cn('stroke-current', animationClass, className)}
          style={svgStyle}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 2L4 12L12 22L20 12L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
          <path 
            d="M4 12H20" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
          <path 
            d="M12 2V22" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
        </svg>
      );
    
    case 'icosahedron':
      return (
        <svg
          className={cn('stroke-current', animationClass, className)}
          style={svgStyle}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 2L3 9L3 15L12 22L21 15L21 9L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
          <path 
            d="M3 9L12 12L21 9" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
          <path 
            d="M3 15L12 12L21 15" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
          <path 
            d="M12 2V12" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
          <path 
            d="M12 12V22" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
        </svg>
      );
    
    case 'dodecahedron':
      return (
        <svg
          className={cn('stroke-current', animationClass, className)}
          style={svgStyle}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 2L5 5L2 12L5 19L12 22L19 19L22 12L19 5L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
          <path 
            d="M5 5L5 19" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
          <path 
            d="M19 5L19 19" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
          <path 
            d="M2 12H22" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
          />
        </svg>
      );
    
    case 'merkaba':
      return (
        <svg
          className={cn('stroke-current', animationClass, className)}
          style={svgStyle}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Merkaba - two tetrahedrons */}
          <path 
            d="M12 2L3 18H21L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
          <path 
            d="M12 22L3 6H21L12 22Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
          <circle 
            cx="12" 
            cy="12" 
            r="2" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={fillOpacity} 
          />
        </svg>
      );
    
    default:
      return null;
  }
};

export default SacredGeometry;