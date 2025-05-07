/**
 * HexagramMerkaba.tsx
 * 
 * A specialized component for drawing hexagram merkaba shapes with glow effects
 * as shown in the design screenshots.
 * 
 * Update: Enhanced with refraction effects to create the illusion of passing through
 * surfaces at different zoom levels.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface HexagramMerkabaProps {
  size?: number;
  color?: string;
  glowColor?: string;
  rotationSpeed?: number;
  rotationDirection?: 'clockwise' | 'counterclockwise';
  opacity?: number;
  className?: string;
  /** Whether this merkaba should appear refracted, as if behind a surface */
  refracted?: boolean;
  /** Level of refraction blur (0-10) */
  refractionLevel?: number;
  /** Whether this merkaba is a shadow of another merkaba */
  isShadow?: boolean;
  /** Offset position for shadow merkabas */
  shadowOffset?: { x: number; y: number };
}

const HexagramMerkaba: React.FC<HexagramMerkabaProps> = ({
  size = 100,
  color = '#10edb3', // Default to the bright green color from screenshots
  glowColor = 'rgba(16, 237, 179, 0.8)',
  rotationSpeed = 60,
  rotationDirection = 'clockwise',
  opacity = 1,
  className = '',
  refracted = false,
  refractionLevel = 5,
  isShadow = false,
  shadowOffset = { x: 5, y: 5 }
}) => {
  // Calculate points for the two overlapping triangles of the Star of David
  // with slightly different sizes for the layered effect
  const generateHexagramPoints = (scale: number = 1) => {
    const centerX = 50;
    const centerY = 50;
    const outerRadius = 45 * scale;
    const innerRadius = 25 * scale;
    
    // First triangle (pointing up)
    const upTriangle = `
      M${centerX},${centerY - outerRadius}
      L${centerX + outerRadius * Math.cos(Math.PI / 6)},${centerY + outerRadius * Math.sin(Math.PI / 6)}
      L${centerX - outerRadius * Math.cos(Math.PI / 6)},${centerY + outerRadius * Math.sin(Math.PI / 6)}
      Z
    `;
    
    // Second triangle (pointing down)
    const downTriangle = `
      M${centerX},${centerY + outerRadius}
      L${centerX + outerRadius * Math.cos(Math.PI / 6)},${centerY - outerRadius * Math.sin(Math.PI / 6)}
      L${centerX - outerRadius * Math.cos(Math.PI / 6)},${centerY - outerRadius * Math.sin(Math.PI / 6)}
      Z
    `;
    
    // Inner hexagon for the layered effect
    const innerHexagon = `
      M${centerX},${centerY - innerRadius}
      L${centerX + innerRadius * Math.cos(Math.PI / 6)},${centerY - innerRadius * Math.sin(Math.PI / 6)}
      L${centerX + innerRadius * Math.cos(-Math.PI / 6)},${centerY - innerRadius * Math.sin(-Math.PI / 6)}
      L${centerX},${centerY + innerRadius}
      L${centerX - innerRadius * Math.cos(-Math.PI / 6)},${centerY - innerRadius * Math.sin(-Math.PI / 6)}
      L${centerX - innerRadius * Math.cos(Math.PI / 6)},${centerY - innerRadius * Math.sin(Math.PI / 6)}
      Z
    `;
    
    return {
      upTriangle,
      downTriangle,
      innerHexagon
    };
  };

  // Generate path data for different layers
  const outerLayer = generateHexagramPoints(1);
  const middleLayer = generateHexagramPoints(0.85);
  const innerLayer = generateHexagramPoints(0.7);
  
  // SVG filter IDs for various effects
  const filterId = `hexagram-glow-${Math.random().toString(36).substring(2, 9)}`;
  const refractionFilterId = `hexagram-refraction-${Math.random().toString(36).substring(2, 9)}`;
  const shadowFilterId = `hexagram-shadow-${Math.random().toString(36).substring(2, 9)}`;
  
  // Animation variants
  const rotationVariant = {
    animate: {
      rotate: rotationDirection === 'clockwise' ? 360 : -360,
      transition: {
        duration: rotationSpeed,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };
  
  // Adjust opacity based on props
  const effectiveOpacity = refracted ? opacity * 0.6 : isShadow ? opacity * 0.4 : opacity;
  
  // Pulse animation for the glow effect
  const pulseVariant = {
    animate: {
      opacity: [opacity, opacity * 0.7, opacity],
      scale: [1, 1.02, 1],
      transition: {
        duration: rotationSpeed / 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* SVG Filter definitions for various effects */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Standard glow filter */}
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
            <feBlend in="SourceGraphic" in2="glow" mode="screen" />
          </filter>
          
          {/* Refraction filter - simulates light passing through a surface */}
          <filter id={refractionFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={refractionLevel} result="blur" />
            <feColorMatrix in="blur" mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 10 -4" result="refraction" />
            <feBlend in="SourceGraphic" in2="refraction" mode="screen" />
          </filter>
          
          {/* Shadow filter - creates a blurred offset shadow effect */}
          <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="shadow" />
            <feOffset dx={shadowOffset.x} dy={shadowOffset.y} in="shadow" result="offsetShadow" />
            <feColorMatrix in="offsetShadow" mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 8 -3" result="coloredShadow" />
            <feBlend in="SourceGraphic" in2="coloredShadow" mode="normal" />
          </filter>
        </defs>
      </svg>
      
      {/* Main Merkaba shape with rotation */}
      <motion.svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100"
        initial={{ rotate: 0 }}
        animate="animate"
        variants={rotationVariant}
        style={{ 
          filter: refracted 
            ? `url(#${refractionFilterId})` 
            : isShadow 
              ? `url(#${shadowFilterId})` 
              : 'none'
        }}
      >
        {/* Base layer with appropriate filter based on merkaba state */}
        <g filter={refracted || isShadow ? 'none' : `url(#${filterId})`}>
          <path
            d={outerLayer.upTriangle}
            fill={color}
            fillOpacity={refracted ? 0.3 : isShadow ? 0.25 : 0.6}
            stroke={color}
            strokeWidth={refracted || isShadow ? 0.3 : 0.5}
            strokeOpacity={refracted ? 0.3 : isShadow ? 0.2 : 1}
          />
          <path
            d={outerLayer.downTriangle}
            fill={color}
            fillOpacity={refracted ? 0.3 : isShadow ? 0.25 : 0.6}
            stroke={color}
            strokeWidth={refracted || isShadow ? 0.3 : 0.5}
            strokeOpacity={refracted ? 0.3 : isShadow ? 0.2 : 1}
          />
        </g>
        
        {/* Middle layer with adjusted opacity based on state */}
        <path
          d={middleLayer.upTriangle}
          fill={color}
          fillOpacity={refracted ? 0.15 : isShadow ? 0.15 : 0.4}
          stroke={color}
          strokeWidth={refracted || isShadow ? 0.2 : 0.3}
          strokeOpacity={refracted ? 0.2 : isShadow ? 0.15 : 0.8}
        />
        <path
          d={middleLayer.downTriangle}
          fill={color}
          fillOpacity={refracted ? 0.15 : isShadow ? 0.15 : 0.4}
          stroke={color}
          strokeWidth={refracted || isShadow ? 0.2 : 0.3}
          strokeOpacity={refracted ? 0.2 : isShadow ? 0.15 : 0.8}
        />
        
        {/* Inner layer - reduced visibility when refracted/shadow */}
        {(!refracted && !isShadow) && (
          <>
            <path
              d={innerLayer.upTriangle}
              fill={color}
              fillOpacity={0.2}
              stroke={color}
              strokeWidth={0.2}
            />
            <path
              d={innerLayer.downTriangle}
              fill={color}
              fillOpacity={0.2}
              stroke={color}
              strokeWidth={0.2}
            />
            
            {/* Central hexagon */}
            <path
              d={innerLayer.innerHexagon}
              fill={color}
              fillOpacity={0.3}
              stroke={color}
              strokeWidth={0.2}
            />
          </>
        )}
      </motion.svg>
      
      {/* Outer glow effect with pulse animation - different intensity based on state */}
      {!isShadow && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: refracted 
              ? `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`
              : `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
            opacity: refracted ? 0.2 : 0.4,
            filter: refracted ? 'blur(3px)' : 'none',
          }}
          initial={{ opacity: refracted ? 0.2 : 0.4 }}
          animate="animate"
          variants={pulseVariant}
        />
      )}
    </div>
  );
};

export default HexagramMerkaba;