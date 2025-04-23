import React from 'react';
import './cosmic-animations.css';

interface CosmicShapeProps {
  type: 'circle' | 'ellipse' | 'triangle' | 'polygon' | 'wave' | 'starburst';
  size?: number;
  color?: string;
  glowColor?: string;
  strokeWidth?: number;
  animate?: boolean;
  animationDuration?: number;
  className?: string;
  style?: React.CSSProperties;
  fillOpacity?: number;
  sides?: number; // For polygon
  points?: number; // For starburst
}

const CosmicShape: React.FC<CosmicShapeProps> = ({
  type,
  size = 100,
  color = '#7c3aed',
  glowColor = 'rgba(124, 58, 237, 0.4)',
  strokeWidth = 1.5,
  animate = false,
  animationDuration = 60,
  className = '',
  style = {},
  fillOpacity = 0.05,
  sides = 6, // Default hexagon
  points = 8, // Default 8-point starburst
}) => {
  const animationClass = animate ? 'slow-rotate' : '';

  const renderShape = () => {
    switch (type) {
      case 'circle':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            <circle
              cx={50}
              cy={50}
              r="45"
              fill={color}
              fillOpacity={fillOpacity}
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
      
      case 'ellipse':
        return (
          <svg
            width={size}
            height={size * 0.7}
            viewBox="0 0 100 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            <ellipse
              cx={50}
              cy={35}
              rx={45}
              ry={30}
              fill={color}
              fillOpacity={fillOpacity}
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
      
      case 'triangle':
        return (
          <svg
            width={size}
            height={size * 0.9}
            viewBox="0 0 100 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${animationClass} ${className}`}
            style={{
              '--rotation-duration': `${animationDuration}s`,
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            } as React.CSSProperties}
          >
            <polygon
              points="50,5 95,85 5,85"
              fill={color}
              fillOpacity={fillOpacity}
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
      
      case 'polygon':
        {
          // Generate points for the polygon based on the number of sides
          const radius = 45;
          const center = 50;
          let polygonPoints = '';
          
          for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            polygonPoints += `${x},${y} `;
          }
          
          return (
            <svg
              width={size}
              height={size}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`${animationClass} ${className}`}
              style={{
                '--rotation-duration': `${animationDuration}s`,
                filter: `drop-shadow(0 0 5px ${glowColor})`,
                ...style,
              } as React.CSSProperties}
            >
              <polygon
                points={polygonPoints}
                fill={color}
                fillOpacity={fillOpacity}
                stroke={color}
                strokeWidth={strokeWidth}
              />
            </svg>
          );
        }
      
      case 'wave':
        return (
          <svg
            width={size}
            height={size * 0.5}
            viewBox="0 0 100 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className}`}
            style={{
              filter: `drop-shadow(0 0 5px ${glowColor})`,
              ...style,
            }}
          >
            <path
              d="M0,25 C10,10 20,40 30,25 C40,10 50,40 60,25 C70,10 80,40 90,25 C100,10 110,40 120,25"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
      
      case 'starburst':
        {
          // Generate points for starburst shape
          const innerRadius = 20;
          const outerRadius = 45;
          const starCenter = 50;
          let starburstPoints = '';
          const numStarPoints = points;
          
          for (let i = 0; i < numStarPoints * 2; i++) {
            const angleInRadians = (Math.PI * i) / numStarPoints;
            const radiusToUse = i % 2 === 0 ? outerRadius : innerRadius;
            const xCoord = starCenter + radiusToUse * Math.cos(angleInRadians);
            const yCoord = starCenter + radiusToUse * Math.sin(angleInRadians);
            starburstPoints += `${xCoord.toFixed(2)},${yCoord.toFixed(2)} `;
          }
          
          return (
            <svg
              width={size}
              height={size}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`${animationClass} ${className}`}
              style={{
                '--rotation-duration': `${animationDuration}s`,
                filter: `drop-shadow(0 0 5px ${glowColor})`,
                ...style,
              } as React.CSSProperties}
            >
              <polygon
                points={starburstPoints}
                fill={color}
                fillOpacity={fillOpacity}
                stroke={color}
                strokeWidth={strokeWidth}
              />
            </svg>
          );
        }
      
      default:
        return null;
    }
  };

  return renderShape();
};

// Composite component for creating groups of cosmic shapes
interface CosmicShapeGroupProps {
  shapes: Array<Omit<CosmicShapeProps, 'className' | 'style'> & { 
    position?: { top?: string; left?: string; right?: string; bottom?: string; transform?: string };
  }>;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export const CosmicShapeGroup: React.FC<CosmicShapeGroupProps> = ({
  shapes,
  containerClassName = '',
  containerStyle = {},
}) => {
  return (
    <div 
      className={`relative ${containerClassName}`}
      style={containerStyle}
    >
      {shapes.map((shape, index) => {
        const { position, ...shapeProps } = shape;
        return (
          <div 
            key={index}
            className="absolute"
            style={{ 
              top: position?.top,
              left: position?.left,
              right: position?.right,
              bottom: position?.bottom,
              transform: position?.transform,
             }}
          >
            <CosmicShape {...shapeProps} />
          </div>
        );
      })}
    </div>
  );
};

export default CosmicShape;