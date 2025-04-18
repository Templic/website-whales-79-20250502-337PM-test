import React, { ReactNode, useMemo } from 'react';
import { cn } from '@/lib/utils';
import './cosmic-animations.css';
import { useIsMobile } from '@/hooks/use-responsive';
import { CosmicShapeGroup, ShapeProps } from './CosmicShapeGroup';

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
  const isMobile = useIsMobile();
  
  // Using useMemo to cache expensive calculations
  const variantColors = useMemo(() => ({
    primary: { main: '#7c3aed', glow: 'rgba(124, 58, 237, 0.4)', border: 'rgba(124, 58, 237, 0.2)' },
    secondary: { main: '#00ebd6', glow: 'rgba(0, 235, 214, 0.4)', border: 'rgba(0, 235, 214, 0.2)' },
    accent: { main: '#fb923c', glow: 'rgba(251, 146, 60, 0.4)', border: 'rgba(251, 146, 60, 0.2)' },
    cosmic: { main: '#e15554', glow: 'rgba(225, 85, 84, 0.4)', border: 'rgba(225, 85, 84, 0.2)' },
    minimal: { main: '#ffffff', glow: 'rgba(255, 255, 255, 0.3)', border: 'rgba(255, 255, 255, 0.1)' },
  }), []);

  const mainColor = headingColor || variantColors[variant].main;
  const borderColor = variantColors[variant].border;

  // Background styles based on variant and style
  const backgroundClasses = useMemo(() => {
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

    return {
      solid: `${getBgClasses('solid')} ${borderClass}`,
      gradient: `${getBgClasses('gradient')} ${borderClass}`,
      glass: `${getBgClasses('glass')} ${borderClass}`,
      dark: getBgClasses('dark'),
      light: getBgClasses('light'),
    };
  }, [variant]);

  // Memoized clip paths
  const clipPath = useMemo(() => {
    const clipPaths: Record<string, string> = {
      trapezoid: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
      hexagon: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)',
      octagon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
      pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
      diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      wave: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 100%, 50% 75%, 25% 100%, 0% 75%)',
      'symmetric-hexagon': 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
      'rectangular': 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      'shield': 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)',
      'pentagram': 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      'rounded-diamond': 'polygon(50% 5%, 95% 50%, 50% 95%, 5% 50%)',
      'parallelogram': 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
      'pointed-pentagon': 'polygon(50% 0%, 100% 30%, 85% 100%, 15% 100%, 0% 30%)',
    };
    return clipPaths[shape];
  }, [shape]);

  // Alignment classes
  const alignmentClass = useMemo(() => {
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };
    return alignmentClasses[alignment];
  }, [alignment]);

  // Decorative shapes - simplified version
  const decorativeShapes = useMemo(() => {
    if (!decorative) return [];
    
    let shapes: ShapeProps[] = [];
    
    // Common shapes for basic decoration
    if (['trapezoid', 'wave', 'rectangular'].includes(shape)) {
      shapes = [
        {
          type: 'polygon',
          sides: 3,
          size: 60,
          color: variantColors[variant].main,
          glowColor: variantColors[variant].glow,
          fillOpacity: 0.03,
          strokeWidth: 1,
          position: { top: '10px', left: '20px' },
          rotation: 15
        },
        {
          type: 'circle',
          size: 40,
          color: variantColors[variant].main,
          glowColor: variantColors[variant].glow,
          fillOpacity: 0.02,
          strokeWidth: 1,
          position: { bottom: '15px', right: '30px' }
        },
      ];
    }
    
    // Polygon shapes for more geometric sections
    if (['hexagon', 'pentagon', 'diamond', 'pointed-pentagon'].includes(shape)) {
      shapes = [
        {
          type: 'polygon',
          sides: shape === 'pentagon' || shape === 'pointed-pentagon' ? 5 : 
                 shape === 'hexagon' ? 6 : 4,
          size: 70,
          color: variantColors[variant].main,
          glowColor: variantColors[variant].glow,
          fillOpacity: 0.05,
          strokeWidth: 1.5,
          position: { top: '50%', left: '50%' },
          rotation: 0
        }
      ];
    }
    
    return shapes;
  }, [shape, variant, decorative, variantColors]);

  // Memoize content width calculation
  const contentWidthStyle = useMemo(() => {
    if (typeof contentWidth === 'number') {
      return isMobile ? `${contentWidth * 1.2}px` : `${contentWidth}px`;
    }

    if (textContained) {
      switch(shape) {
        case 'diamond':
        case 'rounded-diamond':
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
  }, [contentWidth, isMobile, shape, textContained]);

  // Memoize padding calculation
  const paddingStyle = useMemo(() => {
    if (!textContained) return {};

    if (isMobile) {
      switch(shape) {
        case 'diamond':
        case 'rounded-diamond':
          return { padding: '6%' };
        case 'pentagon':
        case 'pointed-pentagon':
          return { paddingLeft: '5%', paddingRight: '5%', paddingTop: '15%', paddingBottom: '5%' };
        case 'pentagram':
          return { padding: '8%' };
        case 'shield':
          return { paddingLeft: '5%', paddingRight: '5%', paddingTop: '5%', paddingBottom: '10%' };
        default:
          return { padding: '5%' };
      }
    }
    
    switch(shape) {
      case 'diamond':
      case 'rounded-diamond':
        return { paddingLeft: '15%', paddingRight: '15%', paddingTop: '8%', paddingBottom: '8%' };
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
  }, [isMobile, shape, textContained]);

  return (
    <section 
      className={cn(
        'relative mb-8 shadow-lg overflow-hidden', 
        backgroundClasses[backgroundStyle],
        alignmentClass,
        className,
        isMobile ? 'geometric-section-mobile' : ''
      )}
      style={{ 
        clipPath: clipPath,
        ...style,
        ...paddingStyle
      }}
    >
      {decorative && decorativeShapes.length > 0 && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <CosmicShapeGroup shapes={decorativeShapes} />
        </div>
      )}

      <div 
        className="relative z-10" 
        style={{ 
          maxWidth: contentWidthStyle,
          margin: alignment === 'center' ? '0 auto' : 
                  alignment === 'right' ? '0 0 0 auto' : '0',
        }}
      >
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

export default React.memo(GeometricSection);