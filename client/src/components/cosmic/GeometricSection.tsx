import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import './cosmic-animations.css';
import SacredGeometry from './SacredGeometry';
import CosmicShape, { CosmicShapeGroup } from './CosmicShapesFixed';
import useIsMobile from './useIsMobile'; // Assuming this hook exists

interface GeometricSectionProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'cosmic' | 'minimal';
  className?: string;
  style?: React.CSSProperties;
  shape?: 
    'trapezoid' | 
    'hexagon' | 
    'octagon' | 
    'pentagon' | 
    'diamond' | 
    'wave' |
    'symmetric-hexagon' |
    'rectangular' |
    'shield' | 
    'pentagram' | 
    'rounded-diamond' | 
    'parallelogram' |
    'pointed-pentagon';
  headingColor?: string;
  backgroundStyle?: 'solid' | 'gradient' | 'glass' | 'dark' | 'light';
  decorative?: boolean;
  alignment?: 'left' | 'center' | 'right';
  contentWidth?: 'auto' | 'narrow' | 'standard' | 'wide' | number;
  textContained?: boolean;
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
  contentWidth = 'standard',
  textContained = true,
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
    // New more symmetric shapes
    'symmetric-hexagon': 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    'rectangular': 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    'shield': 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)',
    'pentagram': 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    'rounded-diamond': 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)',
    'parallelogram': 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
    'pointed-pentagon': 'polygon(50% 0%, 100% 30%, 85% 100%, 15% 100%, 0% 30%)',
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

        {(shape === 'diamond' || shape === 'rounded-diamond') && (
          <>
            {/* Diamond-shaped "mat" that provides a border/outline */}
            <div className="absolute inset-0 z-0" style={{ 
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              border: `2px solid ${variantColors[variant].border}`,
              boxShadow: `0 0 15px ${variantColors[variant].glow}`,
              background: `linear-gradient(135deg, ${variantColors[variant].border} 0%, transparent 70%)`,
              opacity: 0.4
            }}></div>

            {/* Decorative shapes inside */}
            <CosmicShapeGroup
              shapes={[
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
          </>
        )}

        {shape === 'wave' && (
          <CosmicShapeGroup
            shapes={[
              /* Removed the ellipse to the left as requested */
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

        {(shape === 'symmetric-hexagon') && (
          <SacredGeometry
            type="hexagon"
            color={variantColors[variant].main}
            size={250}
            animate={true}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10"
          />
        )}

        {(shape === 'shield') && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-2 border-[#00ebd6]/30"></div>
            <div className="absolute bottom-20 left-20 w-14 h-14 rounded-full border-2 border-[#7c3aed]/30"></div>
            <div className="absolute bottom-20 right-20 w-14 h-14 rounded-full border-2 border-[#e15554]/30"></div>
          </div>
        )}

        {(shape === 'pentagram' || shape === 'pointed-pentagon') && (
          <SacredGeometry
            type="pentagon-star" 
            color={variantColors[variant].main}
            size={220}
            animate={true}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10"
          />
        )}
      </div>
    );
  };

  // Calculate content width based on shape type and the contentWidth prop
  // Now with responsive widths for mobile devices, giving more space for text
  const getContentWidthStyle = () => {
      if (typeof contentWidth === 'number') {
        return isMobile ? `${contentWidth * 1.6}px` : `${contentWidth}px`;
      }

      // Helper to get mobile-adjusted width - using MORE width on mobile, not less
      const getMobileWidth = (standardWidth: string): string => {
        // Parse the percentage and make it wider on mobile
        const percentage = parseInt(standardWidth);
        if (!isNaN(percentage) && isMobile) {
          // On mobile, we want to use more screen real estate, not less
          // Increase width by 10-15% on mobile for better text display
          const mobilePercentage = Math.min(percentage + 15, 95); // Don't exceed 95%
          return `${mobilePercentage}%`;
        }
        return standardWidth;
      };

      // Default widths based on shape type if textContained is true
      if (textContained) {
        switch(shape) {
          case 'diamond':
          case 'rounded-diamond':
            // For mobile, we want to actually use MORE space, not less
            return isMobile ? '90%' : '70%';
          case 'hexagon':
          case 'symmetric-hexagon':
          case 'octagon':
            return isMobile ? '92%' : '75%';
          case 'shield':
          case 'pentagon':
          case 'pointed-pentagon':
          case 'pentagram':
            return isMobile ? '93%' : '80%';
          case 'wave':
          case 'trapezoid':
          case 'parallelogram':
            return isMobile ? '94%' : '85%';
          case 'rectangular':
            return isMobile ? '95%' : '95%';
          default:
            return isMobile ? '92%' : '80%';
        }
      }

      // If textContained is false or contentWidth is explicitly set
      switch(contentWidth) {
        case 'narrow':
          return isMobile ? '90%' : '60%';
        case 'standard':
          return isMobile ? '92%' : '80%';
        case 'wide':
          return isMobile ? '95%' : '95%';
        case 'auto':
        default:
          return '100%';
      }
    };

  // Calculate padding based on shape to ensure text doesn't overflow
  // For mobile, we use much less padding to maximize text space
  const getPaddingStyle = () => {
    if (!textContained) return {};

    // On mobile we want LESS padding, not more, to give text more room
    if (isMobile) {
      // For mobile, use minimal padding regardless of shape
      switch(shape) {
        case 'diamond':
        case 'rounded-diamond':
          return { padding: '6%' };
        case 'pentagon':
        case 'pointed-pentagon':
          // These shapes need a bit more top padding due to their pointy top
          return { paddingLeft: '5%', paddingRight: '5%', paddingTop: '15%', paddingBottom: '5%' };
        case 'pentagram':
          return { padding: '8%' };
        case 'shield':
          return { paddingLeft: '5%', paddingRight: '5%', paddingTop: '5%', paddingBottom: '10%' };
        default:
          // For all other shapes use very minimal padding on mobile
          return { padding: '5%' };
      }
    }

    // Non-mobile padding (unchanged from original)
    switch(shape) {
      case 'diamond':
      case 'rounded-diamond':
        return { paddingLeft: '8%', paddingRight: '8%', paddingTop: '5%', paddingBottom: '5%' };
      case 'hexagon':
      case 'symmetric-hexagon':
        return { paddingLeft: '12%', paddingRight: '12%', paddingTop: '5%', paddingBottom: '5%' };
      case 'shield':
        return { paddingLeft: '10%', paddingRight: '10%', paddingTop: '5%', paddingBottom: '15%' };
      case 'pentagon':
      case 'pointed-pentagon':
        return { paddingLeft: '10%', paddingRight: '10%', paddingTop: '25%', paddingBottom: '8%' };
      case 'pentagram':
        return { paddingLeft: '15%', paddingRight: '15%', paddingTop: '15%', paddingBottom: '15%' };
      case 'trapezoid':
        return { paddingLeft: '10%', paddingRight: '10%', paddingTop: '5%', paddingBottom: '5%' };
      case 'wave':
        return { paddingLeft: '8%', paddingRight: '8%', paddingTop: '5%', paddingBottom: '12%' };
      case 'octagon':
        return { paddingLeft: '12%', paddingRight: '12%', paddingTop: '8%', paddingBottom: '8%' };
      case 'parallelogram':
        return { paddingLeft: '15%', paddingRight: '8%', paddingTop: '5%', paddingBottom: '5%' };
      default:
        return { padding: '8%' };
    }
  };

  const isMobile = useIsMobile();

  return (
    <section 
      className={cn(
        'relative mb-8 shadow-lg overflow-hidden', 
        backgroundClasses[backgroundStyle],
        alignmentClasses[alignment],
        className,
        isMobile ? 'geometric-section-mobile' : '' // Add mobile class conditionally
      )}
      style={{ 
        clipPath: clipPaths[shape],
        ...style,
        ...getPaddingStyle()
      }}
    >
      {renderDecorativeShapes()}

      <div className="relative z-10" style={{ 
        maxWidth: getContentWidthStyle(),
        margin: alignment === 'center' ? '0 auto' : 
                alignment === 'right' ? '0 0 0 auto' : '0',
      }}>
        {title && (
          <div className="section-header mb-4 sm:mb-6 md:mb-8">
            <h2 
              className="cosmic-heading-responsive text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-4"
              style={{ color: variant === 'cosmic' ? '#e15554' : mainColor }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="cosmic-text-responsive text-base sm:text-lg md:text-xl">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="section-content sacred-geometry-container">
          {children}
        </div>
      </div>
    </section>
  );
};

export default GeometricSection;