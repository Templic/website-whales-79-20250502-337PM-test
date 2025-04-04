import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import './cosmic-animations.css';
import SacredGeometry from './SacredGeometry';
import CosmicShape, { CosmicShapeGroup } from './CosmicShapesFixed';

interface GeometricSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'cosmic' | 'minimal';
  className?: string;
  style?: React.CSSProperties;
  shape?: 'trapezoid' | 'hexagon' | 'octagon' | 'pentagon' | 'diamond' | 'wave';
  headingColor?: string;
  backgroundStyle?: 'solid' | 'gradient' | 'glass' | 'dark' | 'light';
  decorative?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

const GeometricSection: React.FC<GeometricSectionProps> = ({
  children,
  title,
  subtitle,
  variant = 'primary',
  className = '',
  style = {},
  shape = 'trapezoid',
  headingColor,
  backgroundStyle = 'glass',
  decorative = true,
  alignment = 'center',
}) => {
  // Color mappings based on variant
  const variantColors = {
    primary: { main: '#7c3aed', glow: 'rgba(124, 58, 237, 0.4)', border: 'rgba(124, 58, 237, 0.2)' },
    secondary: { main: '#00ebd6', glow: 'rgba(0, 235, 214, 0.4)', border: 'rgba(0, 235, 214, 0.2)' },
    accent: { main: '#fb923c', glow: 'rgba(251, 146, 60, 0.4)', border: 'rgba(251, 146, 60, 0.2)' },
    cosmic: { main: '#e15554', glow: 'rgba(225, 85, 84, 0.4)', border: 'rgba(225, 85, 84, 0.2)' },
    minimal: { main: '#ffffff', glow: 'rgba(255, 255, 255, 0.3)', border: 'rgba(255, 255, 255, 0.1)' },
  };

  const mainColor = headingColor || variantColors[variant].main;
  const borderColor = variantColors[variant].border;

  // Background styles based on variant and style
  const getBgClasses = (style: string) => {
    switch (style) {
      case 'solid':
        return 'bg-[#0a0a14] border';
      case 'gradient':
        return 'bg-gradient-to-br from-[#0a0a14] via-[rgba(10,10,20,0.7)] to-[#0a0a14] border';
      case 'glass':
        return 'bg-[#0a0a14]/60 backdrop-blur-md border';
      case 'dark':
        return 'bg-[#050508]/80 backdrop-blur-sm border border-white/5';
      case 'light':
        return 'bg-white/5 backdrop-blur-md border border-white/10';
      default:
        return 'bg-[#0a0a14]/60 backdrop-blur-md border';
    }
  };
  
  // Get border class based on variant without template literals that don't work with Tailwind
  const getBorderClass = () => {
    switch (variant) {
      case 'primary':
        return 'border-purple-600/30';
      case 'secondary':
        return 'border-cyan-400/30';
      case 'accent':
        return 'border-orange-400/30';
      case 'cosmic':
        return 'border-red-500/30';
      case 'minimal':
      default:
        return 'border-white/10';
    }
  };
  
  const borderClass = getBorderClass();
    
  // Combined background classes
  const backgroundClasses = {
    solid: `${getBgClasses('solid')} ${borderClass}`,
    gradient: `${getBgClasses('gradient')} ${borderClass}`,
    glass: `${getBgClasses('glass')} ${borderClass}`,
    dark: getBgClasses('dark'),
    light: getBgClasses('light'),
  };

  // Clip paths for different shapes
  const clipPaths: Record<string, string> = {
    trapezoid: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
    hexagon: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)',
    octagon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    wave: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 100%, 50% 75%, 25% 100%, 0% 75%)',
  };

  // Alignment classes
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Generate decorative shapes based on the section shape
  const renderDecorativeShapes = () => {
    if (!decorative) return null;

    return (
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {shape === 'trapezoid' && (
          <CosmicShapeGroup
            shapes={[
              {
                type: 'polygon',
                sides: 3,
                size: 60,
                color: variantColors[variant].main,
                glowColor: variantColors[variant].glow,
                fillOpacity: 0.03,
                animate: true,
                animationDuration: 60,
                position: { top: '10px', left: '20px' }
              },
              {
                type: 'circle',
                size: 80,
                color: variantColors[variant].main,
                glowColor: variantColors[variant].glow,
                fillOpacity: 0.02,
                animate: true,
                animationDuration: 70,
                position: { top: '15px', right: '30px' }
              },
            ]}
          />
        )}

        {shape === 'hexagon' && (
          <SacredGeometry
            type="hexagon"
            color={variantColors[variant].main}
            size={200}
            animate={true}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10"
          />
        )}

        {shape === 'pentagon' && (
          <SacredGeometry
            type="pentagon-star"
            color={variantColors[variant].main}
            size={200}
            animate={true}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10"
          />
        )}

        {shape === 'octagon' && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#00ebd6]/30"></div>
            <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#7c3aed]/30"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-[#7c3aed]/30"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#00ebd6]/30"></div>
          </div>
        )}

        {(shape === 'diamond' || shape === 'wave') && (
          <CosmicShapeGroup
            shapes={[
              {
                type: 'ellipse',
                size: 150,
                color: variantColors[variant].main,
                glowColor: variantColors[variant].glow,
                fillOpacity: 0.02,
                animate: true,
                animationDuration: 80,
                position: { top: '30%', left: '10%' }
              },
              {
                type: 'starburst',
                points: 5,
                size: 80,
                color: variantColors[variant].main,
                glowColor: variantColors[variant].glow,
                fillOpacity: 0.03,
                animate: true,
                animationDuration: 60,
                position: { bottom: '20%', right: '15%' }
              },
            ]}
          />
        )}
      </div>
    );
  };

  return (
    <section 
      className={cn(
        'relative p-8 mb-8 shadow-lg', 
        backgroundClasses[backgroundStyle],
        alignmentClasses[alignment],
        className
      )}
      style={{ 
        clipPath: clipPaths[shape],
        ...style
      }}
    >
      {renderDecorativeShapes()}
      
      <div className="relative z-10">
        {title && (
          <div className="section-header mb-8">
            <h2 
              className="text-4xl font-bold mb-4"
              style={{ color: mainColor }}
            >
              {title}
            </h2>
            {subtitle && <p className="text-xl">{subtitle}</p>}
          </div>
        )}
        
        <div className="section-content">
          {children}
        </div>
      </div>
    </section>
  );
};

export default GeometricSection;