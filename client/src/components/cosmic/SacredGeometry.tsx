/**
 * SacredGeometry.tsx
 * 
 * Component Type: cosmic
 * Migrated from v0 components - Migration 2025-05-05
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface SacredGeometryProps {
  variant?: 'flower-of-life' | 'seed-of-life' | 'tree-of-life' | 'sri-yantra' | 'metatron-cube' | 'vesica-piscis' | 'torus' | 'merkaba';
  size?: number;
  className?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  animated?: boolean;
  rotationSpeed?: 'slow' | 'medium' | 'fast';
  glowIntensity?: 'none' | 'subtle' | 'medium' | 'strong';
  glowColor?: string;
  interactive?: boolean;
}

/**
 * SacredGeometry Component
 * Renders sacred geometry patterns used in cosmic UI elements
 */
const SacredGeometry: React.FC<SacredGeometryProps> = ({
  variant = 'flower-of-life',
  size = 200,
  className,
  strokeWidth = 1,
  fillOpacity = 0.1,
  animated = true,
  rotationSpeed = 'medium',
  glowIntensity = 'subtle',
  glowColor,
  interactive = false,
}) => {
  // Calculate rotation animation duration based on speed
  const rotationDuration = rotationSpeed === 'slow' ? '30s' : 
                          rotationSpeed === 'fast' ? '15s' : '20s';
                          
  // Determine animation class based on parameters
  const animationClass = animated 
    ? `animate-${rotationSpeed === 'slow' ? 'spin-very-slow' : rotationSpeed === 'fast' ? 'spin-fast' : 'spin-medium'}`
    : '';
  
  // Calculate glow filter based on intensity
  const glowFilter = glowIntensity !== 'none' 
    ? `drop-shadow(0 0 ${glowIntensity === 'strong' ? '3px' : glowIntensity === 'medium' ? '2px' : '1px'} ${glowColor || 'rgba(255, 255, 255, 0.7)'})`
    : '';

  // Generate component styles
  const svgStyle: React.CSSProperties = {
    width: size,
    height: size,
    filter: glowFilter,
    cursor: interactive ? 'pointer' : 'default',
    transition: 'transform 0.3s ease, filter 0.3s ease',
  };

  // Generate hover event handlers if interactive
  const interactiveProps = interactive ? {
    onMouseEnter: (e: React.MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.transform = 'scale(1.05)';
      target.style.filter = `drop-shadow(0 0 ${glowIntensity === 'strong' ? '5px' : glowIntensity === 'medium' ? '4px' : '3px'} ${glowColor || 'rgba(255, 255, 255, 0.9)'})`;
    },
    onMouseLeave: (e: React.MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      target.style.transform = 'scale(1)';
      target.style.filter = glowFilter;
    }
  } : {};

  // SVG for Merkaba (Star Tetrahedron)
  if (variant === 'merkaba') {
    return (
      <svg
        className={cn('text-current', animationClass, className)}
        style={svgStyle}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...interactiveProps}
      >
        {/* Upward-pointing tetrahedron */}
        <path
          d="M50 10 L85 75 L15 75 Z"
          fill="currentColor"
          fillOpacity={fillOpacity}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        
        {/* Downward-pointing tetrahedron */}
        <path
          d="M50 90 L85 25 L15 25 Z"
          fill="currentColor"
          fillOpacity={fillOpacity * 0.8}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        
        {/* Center circle */}
        <circle
          cx="50"
          cy="50"
          r="5"
          fill="currentColor"
          fillOpacity={fillOpacity * 1.5}
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.5}
        />
        
        {/* Connecting lines */}
        <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.6" />
        <line x1="15" y1="25" x2="85" y2="75" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.6" />
        <line x1="15" y1="75" x2="85" y2="25" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.6" />
      </svg>
    );
  }

  // SVG for Flower of Life
  if (variant === 'flower-of-life') {
    return (
      <svg
        className={cn('text-current', animationClass, className)}
        style={svgStyle}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...interactiveProps}
      >
        {/* Center circle */}
        <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        
        {/* First ring of 6 circles */}
        <circle cx="50" cy="30" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="67.3" cy="40" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="67.3" cy="60" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="50" cy="70" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="32.7" cy="60" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="32.7" cy="40" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        
        {/* Outer ring of 12 circles */}
        <circle cx="50" cy="10" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="76.6" cy="20" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="84.6" cy="50" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="76.6" cy="80" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="50" cy="90" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="23.4" cy="80" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="15.4" cy="50" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="23.4" cy="20" r="10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
      </svg>
    );
  }

  // SVG for Seed of Life
  if (variant === 'seed-of-life') {
    return (
      <svg
        className={cn('text-current', animationClass, className)}
        style={svgStyle}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...interactiveProps}
      >
        {/* Center circle */}
        <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        
        {/* 6 surrounding circles */}
        <circle cx="50" cy="25" r="15" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="72" cy="37.5" r="15" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="72" cy="62.5" r="15" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="50" cy="75" r="15" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="28" cy="62.5" r="15" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="28" cy="37.5" r="15" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
      </svg>
    );
  }

  // SVG for Metatron's Cube
  if (variant === 'metatron-cube') {
    return (
      <svg
        className={cn('text-current', animationClass, className)}
        style={svgStyle}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...interactiveProps}
      >
        {/* 13 circles */}
        <circle cx="50" cy="50" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 1.5} />
        
        {/* Inner ring */}
        <circle cx="50" cy="30" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="70" cy="40" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="70" cy="60" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="50" cy="70" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="30" cy="60" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="30" cy="40" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        
        {/* Outer ring */}
        <circle cx="50" cy="10" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="90" cy="30" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="90" cy="70" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="50" cy="90" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="10" cy="70" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        <circle cx="10" cy="30" r="5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.8} />
        
        {/* Connection lines - inner hexagon */}
        <line x1="50" y1="30" x2="70" y2="40" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
        <line x1="70" y1="40" x2="70" y2="60" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
        <line x1="70" y1="60" x2="50" y2="70" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
        <line x1="50" y1="70" x2="30" y2="60" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
        <line x1="30" y1="60" x2="30" y2="40" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
        <line x1="30" y1="40" x2="50" y2="30" stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
        
        {/* Connection lines - to center */}
        <line x1="50" y1="50" x2="50" y2="30" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.5" />
        <line x1="50" y1="50" x2="70" y2="40" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.5" />
        <line x1="50" y1="50" x2="70" y2="60" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.5" />
        <line x1="50" y1="50" x2="50" y2="70" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.5" />
        <line x1="50" y1="50" x2="30" y2="60" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.5" />
        <line x1="50" y1="50" x2="30" y2="40" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.5" />
        
        {/* Connection lines - outer edges */}
        <line x1="50" y1="10" x2="90" y2="30" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.4" />
        <line x1="90" y1="30" x2="90" y2="70" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.4" />
        <line x1="90" y1="70" x2="50" y2="90" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.4" />
        <line x1="50" y1="90" x2="10" y2="70" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.4" />
        <line x1="10" y1="70" x2="10" y2="30" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.4" />
        <line x1="10" y1="30" x2="50" y2="10" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeOpacity="0.4" />
      </svg>
    );
  }

  // SVG for Sri Yantra
  if (variant === 'sri-yantra') {
    return (
      <svg
        className={cn('text-current', animationClass, className)}
        style={svgStyle}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...interactiveProps}
      >
        {/* Outer square */}
        <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
        
        {/* Outer triangle pointing down */}
        <polygon points="10,30 90,30 50,90" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.5} />
        
        {/* Outer triangle pointing up */}
        <polygon points="10,70 90,70 50,10" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity * 0.5} />
        
        {/* Inner triangle pointing down */}
        <polygon points="25,40 75,40 50,70" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        
        {/* Inner triangle pointing up */}
        <polygon points="25,60 75,60 50,30" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        
        {/* Center dot */}
        <circle cx="50" cy="50" r="3" fill="currentColor" />
      </svg>
    );
  }

  // SVG for Vesica Piscis
  if (variant === 'vesica-piscis') {
    return (
      <svg
        className={cn('text-current', animationClass, className)}
        style={svgStyle}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...interactiveProps}
      >
        <circle cx="40" cy="50" r="30" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
        <circle cx="60" cy="50" r="30" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity={fillOpacity} />
      </svg>
    );
  }

  // SVG for Torus
  if (variant === 'torus') {
    return (
      <svg
        className={cn('text-current', animationClass, className)}
        style={svgStyle}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...interactiveProps}
      >
        <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
        <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth={strokeWidth} fill="none" transform="rotate(30, 50, 50)" />
        <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth={strokeWidth} fill="none" transform="rotate(60, 50, 50)" />
        <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth={strokeWidth} fill="none" transform="rotate(90, 50, 50)" />
        <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth={strokeWidth} fill="none" transform="rotate(120, 50, 50)" />
        <ellipse cx="50" cy="50" rx="40" ry="15" stroke="currentColor" strokeWidth={strokeWidth} fill="none" transform="rotate(150, 50, 50)" />
        
        <circle cx="50" cy="50" r="5" fill="currentColor" fillOpacity={fillOpacity * 1.5} stroke="currentColor" strokeWidth={strokeWidth * 0.5} />
      </svg>
    );
  }

  // SVG for Tree of Life
  if (variant === 'tree-of-life') {
    return (
      <svg
        className={cn('text-current', animationClass, className)}
        style={svgStyle}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...interactiveProps}
      >
        {/* The 10 Sephirot (circles) */}
        <circle cx="50" cy="10" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Keter */}
        <circle cx="30" cy="25" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Chokmah */}
        <circle cx="70" cy="25" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Binah */}
        <circle cx="50" cy="40" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Daat */}
        <circle cx="30" cy="55" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Gevurah */}
        <circle cx="70" cy="55" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Chesed */}
        <circle cx="50" cy="70" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Tiferet */}
        <circle cx="30" cy="85" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Hod */}
        <circle cx="70" cy="85" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Netzach */}
        <circle cx="50" cy="95" r="7" fill="currentColor" fillOpacity={fillOpacity} stroke="currentColor" strokeWidth={strokeWidth} /> {/* Malkhut */}
        
        {/* The 22 connecting lines */}
        <line x1="50" y1="17" x2="30" y2="25" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="50" y1="17" x2="70" y2="25" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="30" y1="32" x2="70" y2="25" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="30" y1="32" x2="50" y2="40" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="70" y1="32" x2="50" y2="40" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="50" y1="47" x2="30" y2="55" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="50" y1="47" x2="70" y2="55" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="30" y1="62" x2="70" y2="55" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="30" y1="62" x2="50" y2="70" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="70" y1="62" x2="50" y2="70" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="50" y1="77" x2="30" y2="85" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="50" y1="77" x2="70" y2="85" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="30" y1="85" x2="70" y2="85" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="30" y1="85" x2="50" y2="95" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
        <line x1="70" y1="85" x2="50" y2="95" stroke="currentColor" strokeWidth={strokeWidth * 0.7} />
      </svg>
    );
  }

  // Default fallback if variant is not recognized
  return (
    <svg
      className={cn('text-current', animationClass, className)}
      style={svgStyle}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...interactiveProps}
    >
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
      <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
      <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
    </svg>
  );
};

export default SacredGeometry;