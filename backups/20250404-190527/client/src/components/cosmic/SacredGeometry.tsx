import React from 'react';
import './cosmic-animations.css';

interface SacredGeometryProps {
  type: 'flower-of-life' | 'metatron-cube' | 'sri-yantra' | 'merkaba' | 'pentagon-star' | 'hexagon';
  size?: number;
  color?: string;
  glowColor?: string;
  strokeWidth?: number;
  animate?: boolean;
  animationDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SacredGeometry: React.FC<SacredGeometryProps> = ({
  type,
  size = 200,
  color = '#7c3aed',
  glowColor = 'rgba(124, 58, 237, 0.4)',
  strokeWidth = 1.5,
  animate = true,
  animationDuration = 60,
  className = '',
  style = {},
}) => {
  const animationClass = animate 
    ? type === 'merkaba' || type === 'pentagon-star'
      ? 'reverse-rotate'
      : 'slow-rotate'
    : '';

  const renderSvg = () => {
    switch (type) {
      case 'flower-of-life':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            {/* Central Circle */}
            <circle cx="100" cy="100" r="30" stroke={color} strokeWidth={strokeWidth} />
            
            {/* First Ring - 6 circles */}
            <circle cx="100" cy="60" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="126" cy="73" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="126" cy="127" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="100" cy="140" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="74" cy="127" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="74" cy="73" r="30" stroke={color} strokeWidth={strokeWidth} />
            
            {/* Second Ring - 12 circles */}
            <circle cx="100" cy="20" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="140" cy="30" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="160" cy="70" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="160" cy="130" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="140" cy="170" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="100" cy="180" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="60" cy="170" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="40" cy="130" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="40" cy="70" r="30" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="60" cy="30" r="30" stroke={color} strokeWidth={strokeWidth} />
          </svg>
        );
      
      case 'metatron-cube':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            {/* Circles */}
            <circle cx="100" cy="100" r="5" fill={color} />
            <circle cx="100" cy="55" r="5" fill={color} />
            <circle cx="100" cy="145" r="5" fill={color} />
            <circle cx="139" cy="77.5" r="5" fill={color} />
            <circle cx="139" cy="122.5" r="5" fill={color} />
            <circle cx="61" cy="77.5" r="5" fill={color} />
            <circle cx="61" cy="122.5" r="5" fill={color} />
            
            {/* Outer hexagon */}
            <line x1="100" y1="55" x2="139" y2="77.5" stroke={color} strokeWidth={strokeWidth} />
            <line x1="139" y1="77.5" x2="139" y2="122.5" stroke={color} strokeWidth={strokeWidth} />
            <line x1="139" y1="122.5" x2="100" y2="145" stroke={color} strokeWidth={strokeWidth} />
            <line x1="100" y1="145" x2="61" y2="122.5" stroke={color} strokeWidth={strokeWidth} />
            <line x1="61" y1="122.5" x2="61" y2="77.5" stroke={color} strokeWidth={strokeWidth} />
            <line x1="61" y1="77.5" x2="100" y2="55" stroke={color} strokeWidth={strokeWidth} />
            
            {/* Inner triangles */}
            <line x1="100" y1="55" x2="100" y2="145" stroke={color} strokeWidth={strokeWidth} />
            <line x1="100" y1="55" x2="61" y2="122.5" stroke={color} strokeWidth={strokeWidth} />
            <line x1="100" y1="55" x2="139" y2="122.5" stroke={color} strokeWidth={strokeWidth} />
            <line x1="139" y1="77.5" x2="61" y2="77.5" stroke={color} strokeWidth={strokeWidth} />
            <line x1="139" y1="77.5" x2="61" y2="122.5" stroke={color} strokeWidth={strokeWidth} />
            <line x1="139" y1="122.5" x2="61" y2="77.5" stroke={color} strokeWidth={strokeWidth} />
          </svg>
        );
      
      case 'sri-yantra':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            {/* Center point */}
            <circle cx="100" cy="100" r="5" fill={color} />
            
            {/* Outer square */}
            <rect x="40" y="40" width={120} height={120} stroke={color} strokeWidth={strokeWidth} />
            
            {/* Circles */}
            <circle cx="100" cy="100" r="60" stroke={color} strokeWidth={strokeWidth} />
            <circle cx="100" cy="100" r="45" stroke={color} strokeWidth={strokeWidth} />
            
            {/* Upward triangles */}
            <polygon points="100,40 160,130 40,130" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <polygon points="100,60 140,110 60,110" fill="none" stroke={color} strokeWidth={strokeWidth} />
            
            {/* Downward triangles */}
            <polygon points="100,160 40,70 160,70" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <polygon points="100,140 60,90 140,90" fill="none" stroke={color} strokeWidth={strokeWidth} />
          </svg>
        );
      
      case 'merkaba':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            {/* Upward triangle */}
            <polygon
              points="100,30 160,145 40,145"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            
            {/* Downward triangle */}
            <polygon
              points="100,170 40,55 160,55"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            
            {/* Center circle */}
            <circle cx="100" cy="100" r="30" stroke={color} strokeWidth={strokeWidth} />
          </svg>
        );

      case 'pentagon-star':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            {/* Pentagon star (pentagram) */}
            <path
              d="M100,25 L130,85 L195,95 L145,140 L160,200 L100,170 L40,200 L55,140 L5,95 L70,85 Z"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            
            {/* Inner pentagon */}
            <path
              d="M100,60 L124,85 L116,115 L84,115 L76,85 Z"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            
            {/* Center point */}
            <circle cx="100" cy="100" r="3" fill={color} />
          </svg>
        );

      case 'hexagon':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            {/* Hexagon */}
            <polygon
              points="150,50 175,100 150,150 100,175 50,150 25,100 50,50 100,25"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            
            {/* Inner details */}
            <line x1="50" y1="50" x2="150" y2="150" stroke={color} strokeWidth={strokeWidth} />
            <line x1="50" y1="150" x2="150" y2="50" stroke={color} strokeWidth={strokeWidth} />
            <line x1="100" y1="25" x2="100" y2="175" stroke={color} strokeWidth={strokeWidth} />
            <line x1="25" y1="100" x2="175" y2="100" stroke={color} strokeWidth={strokeWidth} />
            
            {/* Center point */}
            <circle cx="100" cy="100" r="5" fill={color} />
          </svg>
        );

      default:
        return null;
    }
  };

  return renderSvg();
};

export default SacredGeometry;