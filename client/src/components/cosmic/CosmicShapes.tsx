import React from 'react';
import './cosmic-animations.css';

interface CosmicShapeProps {
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
  glowColor?: 'cyan' | 'purple' | 'orange' | 'red' | 'multi' | 'none';
  opacity?: number;
}

export const CosmicCircle: React.FC<CosmicShapeProps> = ({
  className = '',
  style = {},
  animate = false,
  glowColor = 'cyan',
  opacity = 0.7
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-pulse' : '';
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="1" 
          className={`${glowClass}`}
          style={{ opacity }}
        />
        <circle 
          cx="50" 
          cy="50" 
          r="42" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="0.5" 
          className={`${glowClass}`}
          style={{ opacity: opacity * 0.7 }}
        />
      </svg>
    </div>
  );
};

export const CosmicEllipse: React.FC<CosmicShapeProps> = ({
  className = '',
  style = {},
  animate = false,
  glowColor = 'purple',
  opacity = 0.7
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-float' : '';
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 100 60" className="w-full h-full">
        <ellipse 
          cx="50" 
          cy="30" 
          rx="45" 
          ry="25" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="1" 
          className={`${glowClass}`}
          style={{ opacity }}
        />
        <ellipse 
          cx="50" 
          cy="30" 
          rx="42" 
          ry="22" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="0.5" 
          className={`${glowClass}`}
          style={{ opacity: opacity * 0.7 }}
        />
      </svg>
    </div>
  );
};

export const CosmicTriangle: React.FC<CosmicShapeProps> = ({
  className = '',
  style = {},
  animate = false,
  glowColor = 'orange',
  opacity = 0.7
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-slow' : '';
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon 
          points="50,10 90,80 10,80" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="1" 
          className={`${glowClass}`}
          style={{ opacity }}
        />
        <polygon 
          points="50,15 85,78 15,78" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="0.5" 
          className={`${glowClass}`}
          style={{ opacity: opacity * 0.7 }}
        />
      </svg>
    </div>
  );
};

export const CosmicHexagon: React.FC<CosmicShapeProps> = ({
  className = '',
  style = {},
  animate = false,
  glowColor = 'cyan',
  opacity = 0.7
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-slow' : '';
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon 
          points="50,10 90,30 90,70 50,90 10,70 10,30" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="1" 
          className={`${glowClass}`}
          style={{ opacity }}
        />
        <polygon 
          points="50,15 85,32 85,68 50,85 15,68 15,32" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="0.5" 
          className={`${glowClass}`}
          style={{ opacity: opacity * 0.7 }}
        />
      </svg>
    </div>
  );
};

export const CosmicPentagon: React.FC<CosmicShapeProps> = ({
  className = '',
  style = {},
  animate = false,
  glowColor = 'purple',
  opacity = 0.7
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-reverse' : '';
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon 
          points="50,10 90,40 75,85 25,85 10,40" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="1" 
          className={`${glowClass}`}
          style={{ opacity }}
        />
        <polygon 
          points="50,15 85,42 72,80 28,80 15,42" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="0.5" 
          className={`${glowClass}`}
          style={{ opacity: opacity * 0.7 }}
        />
      </svg>
    </div>
  );
};

export const CosmicOctagon: React.FC<CosmicShapeProps> = ({
  className = '',
  style = {},
  animate = false,
  glowColor = 'red',
  opacity = 0.7
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-pulse' : '';
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon 
          points="30,10 70,10 90,30 90,70 70,90 30,90 10,70 10,30" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="1" 
          className={`${glowClass}`}
          style={{ opacity }}
        />
        <polygon 
          points="32,15 68,15 85,32 85,68 68,85 32,85 15,68 15,32" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="0.5" 
          className={`${glowClass}`}
          style={{ opacity: opacity * 0.7 }}
        />
      </svg>
    </div>
  );
};

export const CosmicStar: React.FC<CosmicShapeProps> = ({
  className = '',
  style = {},
  animate = false,
  glowColor = 'multi',
  opacity = 0.7
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-slow' : '';
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon 
          points="50,10 61,35 90,38 70,57 75,85 50,70 25,85 30,57 10,38 39,35" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="1" 
          className={`${glowClass}`}
          style={{ opacity }}
        />
        <polygon 
          points="50,15 59,36 82,38 66,54 70,80 50,68 30,80 34,54 18,38 41,36" 
          fill="transparent" 
          stroke={getStrokeColor(glowColor)} 
          strokeWidth="0.5" 
          className={`${glowClass}`}
          style={{ opacity: opacity * 0.7 }}
        />
      </svg>
    </div>
  );
};

// Helper function to get glow class based on color name
function getGlowClass(colorName: string): string {
  switch (colorName) {
    case 'cyan':
      return 'cosmic-glow-cyan';
    case 'purple':
      return 'cosmic-glow-purple';
    case 'orange':
      return 'cosmic-glow-orange';
    case 'red':
      return 'cosmic-glow-red';
    case 'multi':
      return 'cosmic-glow-multi';
    default:
      return '';
  }
}

// Helper function to get stroke color based on color name
function getStrokeColor(colorName: string): string {
  switch (colorName) {
    case 'cyan':
      return '#00ebd6';
    case 'purple':
      return '#7c3aed';
    case 'orange':
      return '#fb923c';
    case 'red':
      return '#e15554';
    case 'multi':
      return '#7c3aed';
    default:
      return '#7c3aed';
  }
}