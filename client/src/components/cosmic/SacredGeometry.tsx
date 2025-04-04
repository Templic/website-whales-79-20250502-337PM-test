import React from 'react';
import './cosmic-animations.css';

interface SacredGeometryProps {
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
  glowColor?: 'cyan' | 'purple' | 'orange' | 'red' | 'multi';
  opacity?: number;
  strokeWidth?: number;
}

export const FlowerOfLife: React.FC<SacredGeometryProps> = ({
  className = '',
  style = {},
  animate = true,
  glowColor = 'multi',
  opacity = 0.7,
  strokeWidth = 0.5
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-very-slow' : '';
  const strokeColor = getStrokeColor(glowColor);
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Center circle */}
        <circle cx="100" cy="100" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        
        {/* Surrounding circles - first layer */}
        <circle cx="100" cy="65" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="130" cy="82.5" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="130" cy="117.5" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="100" cy="135" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="70" cy="117.5" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="70" cy="82.5" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        
        {/* Outer layer */}
        <circle cx="100" cy="30" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="135" cy="40" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="160" cy="65" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="170" cy="100" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="160" cy="135" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="135" cy="160" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="100" cy="170" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="65" cy="160" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="40" cy="135" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="30" cy="100" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="40" cy="65" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="65" cy="40" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        
        {/* Surrounding circle */}
        <circle cx="100" cy="100" r="90" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth * 0.8} className={glowClass} style={{ opacity: opacity * 0.5 }} />
      </svg>
    </div>
  );
};

export const MetatronsCube: React.FC<SacredGeometryProps> = ({
  className = '',
  style = {},
  animate = true,
  glowColor = 'purple',
  opacity = 0.7,
  strokeWidth = 0.5
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-slow' : '';
  const strokeColor = getStrokeColor(glowColor);
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Inner Hexagon */}
        <polygon 
          points="100,40 154,70 154,130 100,160 46,130 46,70" 
          fill="transparent" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          className={glowClass}
          style={{ opacity }}
        />
        
        {/* Outer Hexagon */}
        <polygon 
          points="100,20 170,60 170,140 100,180 30,140 30,60" 
          fill="transparent" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth * 0.8} 
          className={glowClass}
          style={{ opacity: opacity * 0.9 }}
        />
        
        {/* Connecting lines */}
        <line x1="100" y1="40" x2="100" y2="20" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="154" y1="70" x2="170" y2="60" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="154" y1="130" x2="170" y2="140" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="100" y1="160" x2="100" y2="180" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="46" y1="130" x2="30" y2="140" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="46" y1="70" x2="30" y2="60" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        
        {/* Inner star connections */}
        <line x1="100" y1="40" x2="100" y2="160" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.6 }} />
        <line x1="46" y1="70" x2="154" y2="130" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.6 }} />
        <line x1="46" y1="130" x2="154" y2="70" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.6 }} />
        
        {/* Center point */}
        <circle cx="100" cy="100" r="3" fill={strokeColor} className={glowClass} style={{ opacity: opacity * 1.2 }} />
      </svg>
    </div>
  );
};

export const SriYantra: React.FC<SacredGeometryProps> = ({
  className = '',
  style = {},
  animate = true,
  glowColor = 'cyan',
  opacity = 0.7,
  strokeWidth = 0.5
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-pulse' : '';
  const strokeColor = getStrokeColor(glowColor);
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Outer circle */}
        <circle cx="100" cy="100" r="90" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        
        {/* Outer triangles */}
        <polygon points="100,20 180,150 20,150" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <polygon points="100,150 180,37 20,37" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.9 }} />
        
        {/* Inner triangles */}
        <polygon points="100,40 160,140 40,140" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.85 }} />
        <polygon points="100,140 160,60 40,60" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.85 }} />
        
        {/* Center lotus */}
        <circle cx="100" cy="100" r="15" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 1.2 }} />
        
        {/* Lotus petals - simplified */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <path 
            key={i} 
            d={`M 100 85 Q ${100 + 20 * Math.cos(angle * Math.PI / 180)} ${100 + 20 * Math.sin(angle * Math.PI / 180)} 100 115`} 
            fill="transparent" 
            stroke={strokeColor} 
            strokeWidth={strokeWidth * 0.8} 
            className={glowClass} 
            style={{ opacity: opacity * 1.1 }} 
          />
        ))}
      </svg>
    </div>
  );
};

export const SeedOfLife: React.FC<SacredGeometryProps> = ({
  className = '',
  style = {},
  animate = true,
  glowColor = 'orange',
  opacity = 0.7,
  strokeWidth = 0.5
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-slow' : '';
  const strokeColor = getStrokeColor(glowColor);
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Center circle */}
        <circle cx="100" cy="100" r="30" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        
        {/* Surrounding circles */}
        <circle cx="100" cy="60" r="30" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="135" cy="80" r="30" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="135" cy="120" r="30" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="100" cy="140" r="30" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="65" cy="120" r="30" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="65" cy="80" r="30" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        
        {/* Outer enclosing circle */}
        <circle cx="100" cy="100" r="70" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth * 0.7} className={glowClass} style={{ opacity: opacity * 0.7 }} />
      </svg>
    </div>
  );
};

export const GoldenSpiral: React.FC<SacredGeometryProps> = ({
  className = '',
  style = {},
  animate = true,
  glowColor = 'multi',
  opacity = 0.7,
  strokeWidth = 0.5
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-slow' : '';
  const strokeColor = getStrokeColor(glowColor);
  
  // Golden ratio approximation: 1.618
  const phi = 1.618;
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Golden rectangles */}
        <rect x="50" y="50" width="100" height="100" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <rect x="50" y="50" width="61.8" height="100" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <rect x="111.8" y="50" width="38.2" height="61.8" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <rect x="111.8" y="111.8" width="38.2" height="38.2" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <rect x="88.2" y="111.8" width="23.6" height="38.2" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        
        {/* Spiral */}
        <path 
          d="M 111.8 111.8 A 61.8 61.8 0 0 1 50 111.8 A 38.2 38.2 0 0 1 50 150 A 23.6 23.6 0 0 1 88.2 150 A 14.6 14.6 0 0 1 88.2 135.4" 
          fill="transparent" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          className={glowClass} 
          style={{ opacity }}
        />
        
        {/* Add center point */}
        <circle cx="100" cy="100" r="2" fill={strokeColor} className={glowClass} style={{ opacity: opacity * 1.3 }} />
      </svg>
    </div>
  );
};

export const Tetrahedron: React.FC<SacredGeometryProps> = ({
  className = '',
  style = {},
  animate = true,
  glowColor = 'red',
  opacity = 0.7,
  strokeWidth = 0.5
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-3d' : '';
  const strokeColor = getStrokeColor(glowColor);
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Tetrahedron faces - simplified 2D projection */}
        <polygon 
          points="100,30 160,150 40,150" 
          fill="transparent" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          className={glowClass}
          style={{ opacity }}
        />
        
        <line x1="100" y1="30" x2="100" y2="110" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="160" y1="150" x2="100" y2="110" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="40" y1="150" x2="100" y2="110" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        
        {/* Center point */}
        <circle cx="100" cy="110" r="3" fill={strokeColor} className={glowClass} style={{ opacity: opacity * 1.2 }} />
      </svg>
    </div>
  );
};

export const Icosahedron: React.FC<SacredGeometryProps> = ({
  className = '',
  style = {},
  animate = true,
  glowColor = 'purple',
  opacity = 0.7,
  strokeWidth = 0.5
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-3d-slow' : '';
  const strokeColor = getStrokeColor(glowColor);
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Icosahedron - simplified 2D projection */}
        <polygon 
          points="100,20 146,50 146,150 100,180 54,150 54,50" 
          fill="transparent" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          className={glowClass}
          style={{ opacity }}
        />
        
        <line x1="100" y1="20" x2="100" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="146" y1="50" x2="120" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="146" y1="150" x2="120" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="100" y1="180" x2="100" y2="130" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="54" y1="150" x2="80" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <line x1="54" y1="50" x2="80" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        
        <line x1="100" y1="70" x2="80" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.7 }} />
        <line x1="100" y1="70" x2="120" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.7 }} />
        <line x1="80" y1="100" x2="100" y2="130" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.7 }} />
        <line x1="120" y1="100" x2="100" y2="130" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.7 }} />
        
        {/* Center points */}
        <circle cx="100" cy="100" r="3" fill={strokeColor} className={glowClass} style={{ opacity: opacity * 1.2 }} />
      </svg>
    </div>
  );
};

export const TorusPattern: React.FC<SacredGeometryProps> = ({
  className = '',
  style = {},
  animate = true,
  glowColor = 'cyan',
  opacity = 0.7,
  strokeWidth = 0.5
}) => {
  const glowClass = getGlowClass(glowColor);
  const animationClass = animate ? 'animate-cosmic-spin-slow' : '';
  const strokeColor = getStrokeColor(glowColor);
  
  return (
    <div 
      className={`relative ${className} ${animationClass}`}
      style={style}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Torus rings - simplified 2D projection */}
        <circle cx="100" cy="100" r="80" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity }} />
        <circle cx="100" cy="100" r="70" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.9 }} />
        <circle cx="100" cy="100" r="60" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.8 }} />
        <circle cx="100" cy="100" r="50" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.7 }} />
        <circle cx="100" cy="100" r="40" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.6 }} />
        <circle cx="100" cy="100" r="30" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.5 }} />
        <circle cx="100" cy="100" r="20" fill="transparent" stroke={strokeColor} strokeWidth={strokeWidth} className={glowClass} style={{ opacity: opacity * 0.4 }} />
        
        {/* Radial lines */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = angle * Math.PI / 180;
          const x1 = 100 + 20 * Math.cos(rad);
          const y1 = 100 + 20 * Math.sin(rad);
          const x2 = 100 + 80 * Math.cos(rad);
          const y2 = 100 + 80 * Math.sin(rad);
          
          return (
            <line 
              key={i} 
              x1={x1} 
              y1={y1} 
              x2={x2} 
              y2={y2} 
              stroke={strokeColor} 
              strokeWidth={strokeWidth * 0.7} 
              className={glowClass} 
              style={{ opacity: opacity * 0.8 }} 
            />
          );
        })}
        
        {/* Center point */}
        <circle cx="100" cy="100" r="3" fill={strokeColor} className={glowClass} style={{ opacity: opacity * 1.2 }} />
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
      return 'cosmic-glow-purple';
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