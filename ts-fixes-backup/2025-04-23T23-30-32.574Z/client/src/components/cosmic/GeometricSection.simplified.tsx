/**
 * GeometricSection.simplified.tsx
 * 
 * A simplified version of the GeometricSection component that renders
 * sacred geometry shapes with basic animations and effects.
 * This version removes dependencies on complex performance optimization hooks
 * to ensure the component renders correctly.
 */

import React, { useState, useRef, useEffect } from 'react';

// SVG Shapes
import { 
  FlowerOfLife, 
  Metatron, 
  SriYantra, 
  Torus, 
  SacredSpiral, 
  PlatonicsolidsSvg
} from './SacredGeometryShapes';

// Import CSS
import './geometricEffects.css';

export interface GeometricSectionProps {
  title?: string | React.ReactNode;
  subtitle?: string;
  description?: string;
  primaryShape?: 'flower-of-life' | 'metatron' | 'sri-yantra' | 'torus' | 'sacred-spiral' | 'platonic-solids';
  backgroundColor?: string;
  textColor?: string;
  glowColor?: string;
  glowIntensity?: number;
  className?: string;
  animate?: boolean;
  size?: number | string;
  onShapeClick?: (shape: string) => void;
  children?: React.ReactNode;
  variant?: string;
  shape?: string; 
  alignment?: string;
  backgroundStyle?: string;
  textContained?: boolean;
  style?: React.CSSProperties;
}

/**
 * A simplified section displaying sacred geometry
 */
const GeometricSection: React.FC<GeometricSectionProps> = ({
  title = 'Sacred Geometry',
  subtitle = 'Ancient Wisdom',
  description = 'Explore the fundamental patterns of creation and consciousness.',
  primaryShape = 'flower-of-life',
  backgroundColor = '#111827',
  textColor = '#f3f4f6',
  glowColor = '#8b5cf6',
  glowIntensity = 5,
  className = '',
  animate = true,
  size = '80%',
  onShapeClick,
  children,
  variant,
  shape,
  alignment,
  backgroundStyle,
  textContained,
  style,
}) => {
  // Basic state for animations
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  
  // Container refs
  const containerRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  
  // Simple animation effect
  useEffect(() => {
    if (!animate) return;
    
    const animationFrame = () => {
      setRotation(prev => (prev + 0.2) % 360);
      
      const time = Date.now() * 0.001;
      const newScale = 1 + Math.sin(time) * 0.03;
      setScale(newScale);
    };
    
    const intervalId = setInterval(animationFrame, 50);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [animate]);
  
  // Simple event handlers
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  const handleClick = () => {
    if (onShapeClick) {
      onShapeClick(primaryShape);
    }
  };
  
  // Calculate glow effect
  const glowEffect = `0 0 ${glowIntensity * 5}px ${glowIntensity}px ${glowColor}`;
  
  // Render the selected shape
  const renderShape = () => {
    const commonProps = {
      className: "sacred-geometry-shape",
      style: {
        transform: `rotate(${rotation}deg) scale(${scale})`,
        width: '100%',
        height: '100%',
        boxShadow: glowEffect,
      }
    };
    
    switch (primaryShape) {
      case 'flower-of-life':
        return <FlowerOfLife {...commonProps} detail={0.5} colorScheme={glowColor} />;
      case 'metatron':
        return <Metatron {...commonProps} detail={0.5} colorScheme={glowColor} />;
      case 'sri-yantra':
        return <SriYantra {...commonProps} detail={0.5} colorScheme={glowColor} />;
      case 'torus':
        return <Torus {...commonProps} detail={0.5} colorScheme={glowColor} />;
      case 'sacred-spiral':
        return <SacredSpiral {...commonProps} detail={0.5} colorScheme={glowColor} />;
      case 'platonic-solids':
        return <PlatonicsolidsSvg {...commonProps} detail={0.5} colorScheme={glowColor} />;
      default:
        return <FlowerOfLife {...commonProps} detail={0.5} colorScheme={glowColor} />;
    }
  };
  
  // Render the component
  // Apply shape class based on shape prop
  const getShapeClass = () => {
    if (!shape) return '';
    
    switch(shape) {
      case 'hexagon': return 'clip-path-hexagon';
      case 'diamond': return 'clip-path-diamond';
      case 'circle': return 'rounded-full';
      case 'triangle': return 'clip-path-triangle';
      case 'pentagon': return 'clip-path-pentagon';
      default: return '';
    }
  };
  
  // Add glow effect based on variant
  const getGlowEffects = () => {
    if (variant !== 'cosmic') return '';
    
    const glowBaseClass = 'before:absolute before:inset-0 before:rounded-xl before:z-0 before:opacity-70 before:transition-opacity before:duration-500';
    
    // Different glow styles for different background styles
    if (backgroundStyle === 'glass') {
      return `${glowBaseClass} before:bg-gradient-to-br before:from-cyan-500/30 before:to-purple-600/20 before:blur-lg`;
    } else if (backgroundStyle === 'gradient') {
      return `${glowBaseClass} before:bg-gradient-to-br before:from-cyan-500/50 before:to-purple-600/30 before:blur-xl`;
    }
    
    return `${glowBaseClass} before:bg-gradient-to-br before:from-cyan-500/20 before:to-purple-600/10 before:blur-lg`;
  };
  
  const containerStyles = {
    backgroundColor,
    color: textColor,
    padding: '4rem 2rem',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  // Check if there are children or if we should render default content
  const hasCustomContent = !!children;
  
  const shapeClass = getShapeClass();
  const glowEffects = getGlowEffects();

  return (
    <div 
      ref={containerRef}
      className={`geometric-section ${className} ${isHovered ? 'hovered' : ''} ${shapeClass} ${glowEffects} relative`}
      style={containerStyles}
    >
      {hasCustomContent ? (
        // If children are provided, render them
        children
      ) : (
        // Otherwise render the default layout
        <div className="container mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Text content - Improved for mobile */}
            <div className="text-content order-2 md:order-1 w-full">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">{title}</h2>
              <h3 className="text-lg sm:text-xl md:text-2xl mb-3 md:mb-4 opacity-80">{subtitle}</h3>
              <p className="text-sm sm:text-base md:text-lg opacity-70 w-full">
                {description}
              </p>
            </div>
            
            {/* Sacred geometry */}
            <div 
              className="geometric-container order-1 md:order-2 flex items-center justify-center p-4 md:p-6"
            >
              <div
                ref={shapeRef}
                className="shape-wrapper relative"
                style={{ 
                  width: typeof size === 'string' ? size : `${size}px`, 
                  height: typeof size === 'string' ? size : `${size}px`,
                  maxWidth: '100%',
                  cursor: 'pointer',
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              >
                {renderShape()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeometricSection;