/**
 * sacred-geometry.tsx
 * 
 * Component Type: common
 * Provides sacred geometry visualization for cosmic design elements
 */
import React from 'react';
import { cn } from '../../lib/utils';

export interface SacredGeometryProps {
  variant?: 'cube' | 'tetrahedron' | 'octahedron' | 'icosahedron' | 'dodecahedron' | 'merkaba' | 'pentagon' | 'hexagon' | 'circle' | 'triangle' | 'octagon' | 'heptagon' | 'star' | 'six-pointed-star';
  className?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg' | number;
  intensity?: 'subtle' | 'medium' | 'vivid';
  type?: 'cube' | 'tetrahedron' | 'octahedron' | 'icosahedron' | 'dodecahedron' | 'merkaba'; // For backward compatibility
  color?: string; // Custom color for the geometry
  reversed?: boolean; // Reverse the animation or orientation
}

const SacredGeometry: React.FC<SacredGeometryProps> = ({
  type,
  variant,
  className,
  strokeWidth = 1.5,
  fillOpacity = 0.1,
  animated = true,
  size = 24,
  intensity = 'medium',
  color = 'currentColor',
  reversed = false,
}) => {
  // Use variant if provided, otherwise fall back to type for backward compatibility
  const shapeType = variant || type || 'cube';

  // Convert string size to number if needed
  const sizeValue = typeof size === 'string' 
    ? { sm: 16, md: 24, lg: 36 }[size] || 24 
    : size;

  // Adjust opacity based on intensity
  const opacityValue = intensity === 'subtle' ? 0.05 : 
                       intensity === 'vivid' ? 0.2 : 
                       fillOpacity;

  // Shared style for all geometry components
  const svgStyle = {
    "--stroke-width": `${strokeWidth}px`,
    "--fill-opacity": opacityValue,
  } as React.CSSProperties;

  // Animation class based on the animated prop
  const animationClass = animated ? 'animate-spin-very-slow' : '';

  // Helper function to create SVG with consistent props
  const createSvg = (children: React.ReactNode) => (
    <svg
      className={cn('stroke-current', animationClass, className)}
      style={svgStyle}
      width={sizeValue}
      height={sizeValue}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );

  // Render basic shapes
  switch (shapeType) {
    case 'cube':
      return createSvg(
        <>
          <path 
            d="M12 2L2 7L12 12L22 7L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M2 7V17L12 22V12" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M12 12V22L22 17V7" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
        </>
      );

    case 'tetrahedron':
      return createSvg(
        <>
          <path 
            d="M12 2L3 20H21L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M12 2L3 20L12 14L21 20L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
        </>
      );

    case 'octahedron':
      return createSvg(
        <>
          <path 
            d="M12 2L4 12L12 22L20 12L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M4 12H20" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M12 2V22" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
        </>
      );

    case 'icosahedron':
      return createSvg(
        <>
          <path 
            d="M12 2L3 9L3 15L12 22L21 15L21 9L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M3 9L12 12L21 9" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M3 15L12 12L21 15" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M12 2V12" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M12 12V22" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
        </>
      );

    case 'dodecahedron':
      return createSvg(
        <>
          <path 
            d="M12 2L5 5L2 12L5 19L12 22L19 19L22 12L19 5L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M5 5L5 19" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M19 5L19 19" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M2 12H22" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            style={{ pointerEvents: 'none' }}
          />
        </>
      );

    case 'merkaba':
      return createSvg(
        <>
          <path 
            d="M12 2L3 18H21L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M12 22L3 6H21L12 22Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <circle 
            cx="12" 
            cy="12" 
            r="2" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
        </>
      );

    case 'pentagon':
      return createSvg(
        <path 
          d="M12 2L3 9.5L6 19H18L21 9.5L12 2Z" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="currentColor" 
          fillOpacity={opacityValue} 
          style={{ pointerEvents: 'none' }}
        />
      );

    case 'hexagon':
      return createSvg(
        <path 
          d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="currentColor" 
          fillOpacity={opacityValue} 
          style={{ pointerEvents: 'none' }}
        />
      );

    case 'circle':
      return createSvg(
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="currentColor" 
          fillOpacity={opacityValue} 
          style={{ pointerEvents: 'none' }}
        />
      );

    case 'triangle':
      return createSvg(
        <path 
          d="M12 2L22 20H2L12 2Z" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="currentColor" 
          fillOpacity={opacityValue} 
          style={{ pointerEvents: 'none' }}
        />
      );

    case 'octagon':
      return createSvg(
        <path 
          d="M7.86 2H16.14L22 7.86V16.14L16.14 22H7.86L2 16.14V7.86L7.86 2Z" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="currentColor" 
          fillOpacity={opacityValue} 
          style={{ pointerEvents: 'none' }}
        />
      );

    case 'heptagon':
      return createSvg(
        <path 
          d="M12 2L20.5 6.2L22 15.5L16.4 22H7.6L2 15.5L3.5 6.2L12 2Z" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="currentColor" 
          fillOpacity={opacityValue} 
          style={{ pointerEvents: 'none' }}
        />
      );

    case 'star':
      return createSvg(
        <path 
          d="M12 2L14.25 8.13H21L15.38 11.87L17.63 18L12 14.25L6.38 18L8.63 11.87L3 8.13H9.75L12 2Z" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="currentColor" 
          fillOpacity={opacityValue} 
          style={{ pointerEvents: 'none' }}
        />
      );

    case 'six-pointed-star':
      return createSvg(
        <>
          <path 
            d="M12 2L19 14L12 22L5 14L12 2Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
          <path 
            d="M12 22L19 10L12 2L5 10L12 22Z" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            fill="currentColor" 
            fillOpacity={opacityValue} 
            style={{ pointerEvents: 'none' }}
          />
        </>
      );

    default:
      return createSvg(
        <path 
          d="M12 2L22 7L12 12L2 7L12 2Z" 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="currentColor" 
          fillOpacity={opacityValue} 
          style={{ pointerEvents: 'none' }}
        />
      );
  }
};

export default SacredGeometry;