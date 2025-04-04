import React from 'react';
import './cosmic-animations.css';
import { CosmicHexagon, CosmicCircle, CosmicEllipse, CosmicTriangle, CosmicPentagon } from './CosmicShapes';
import { FlowerOfLife, SeedOfLife, GoldenSpiral } from './SacredGeometry';

interface GeometricContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'simple' | 'sacred' | 'complex' | 'minimal' | 'ethereal';
  backgroundColor?: string;
  backgroundOpacity?: number;
  includeShapes?: boolean;
  borderGlow?: 'cyan' | 'purple' | 'orange' | 'red' | 'multi' | 'none';
}

/**
 * GeometricContainer - A container with cosmic geometric shapes and glassmorphism effects
 * 
 * Variants:
 * - simple: Basic shapes as decoration
 * - sacred: Sacred geometry patterns
 * - complex: Multiple overlapping shapes and patterns
 * - minimal: Subtle border and minimal decoration
 * - ethereal: Subtle glow and floating elements
 */
export const GeometricContainer: React.FC<GeometricContainerProps> = ({
  children,
  className = "",
  style = {},
  variant = 'simple',
  backgroundColor = "rgba(5, 2, 21, 0.4)",
  backgroundOpacity = 0.6,
  includeShapes = true,
  borderGlow = 'cyan'
}) => {
  // Get border styles based on borderGlow prop
  const borderStyles = getBorderStyles(borderGlow);
  
  return (
    <div 
      className={`relative rounded-lg overflow-hidden backdrop-blur-md ${className}`}
      style={{
        background: backgroundColor,
        backdropFilter: 'blur(10px)',
        ...borderStyles,
        ...style,
      }}
    >
      {/* Container content */}
      <div className="relative z-10 p-5">
        {children}
      </div>
      
      {/* Decorative shapes based on variant */}
      {includeShapes && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {variant === 'simple' && <SimpleVariantShapes opacity={backgroundOpacity} />}
          {variant === 'sacred' && <SacredVariantShapes opacity={backgroundOpacity} />}
          {variant === 'complex' && <ComplexVariantShapes opacity={backgroundOpacity} />}
          {variant === 'minimal' && <MinimalVariantShapes opacity={backgroundOpacity} />}
          {variant === 'ethereal' && <EtherealVariantShapes opacity={backgroundOpacity} />}
        </div>
      )}
    </div>
  );
};

// Simple variant with basic shapes
const SimpleVariantShapes: React.FC<{opacity: number}> = ({opacity}) => {
  return (
    <>
      <div className="absolute -top-10 -left-10 opacity-20" style={{opacity: opacity * 0.8}}>
        <CosmicHexagon 
          className="w-40 h-40" 
          animate={true} 
          glowColor="cyan" 
        />
      </div>
      <div className="absolute -bottom-16 -right-16 opacity-20" style={{opacity: opacity * 0.8}}>
        <CosmicCircle 
          className="w-52 h-52" 
          animate={true} 
          glowColor="purple" 
        />
      </div>
      <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 opacity-10" style={{opacity: opacity * 0.5}}>
        <CosmicTriangle 
          className="w-32 h-32" 
          animate={true} 
          glowColor="orange" 
        />
      </div>
    </>
  );
};

// Sacred variant with sacred geometry patterns
const SacredVariantShapes: React.FC<{opacity: number}> = ({opacity}) => {
  return (
    <>
      <div className="absolute -top-10 -left-10 opacity-20" style={{opacity: opacity * 0.7}}>
        <FlowerOfLife 
          className="w-72 h-72" 
          animate={true} 
          glowColor="multi" 
          opacity={0.3}
        />
      </div>
      <div className="absolute -bottom-16 -right-16 opacity-15" style={{opacity: opacity * 0.6}}>
        <SeedOfLife 
          className="w-48 h-48" 
          animate={true} 
          glowColor="purple" 
          opacity={0.3}
        />
      </div>
    </>
  );
};

// Complex variant with multiple shapes
const ComplexVariantShapes: React.FC<{opacity: number}> = ({opacity}) => {
  return (
    <>
      <div className="absolute -top-20 -left-20 opacity-20" style={{opacity: opacity * 0.7}}>
        <FlowerOfLife 
          className="w-80 h-80" 
          animate={true} 
          glowColor="cyan" 
          opacity={0.3}
        />
      </div>
      <div className="absolute -bottom-10 -right-10 opacity-20" style={{opacity: opacity * 0.7}}>
        <CosmicPentagon 
          className="w-40 h-40" 
          animate={true} 
          glowColor="purple" 
        />
      </div>
      <div className="absolute top-1/4 -right-20 opacity-15" style={{opacity: opacity * 0.6}}>
        <CosmicEllipse 
          className="w-52 h-30" 
          animate={true} 
          glowColor="orange" 
        />
      </div>
      <div className="absolute bottom-1/4 -left-10 opacity-10" style={{opacity: opacity * 0.5}}>
        <CosmicTriangle 
          className="w-32 h-32" 
          animate={true} 
          glowColor="red" 
        />
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5" style={{opacity: opacity * 0.3}}>
        <GoldenSpiral 
          className="w-full h-full" 
          animate={true} 
          glowColor="multi" 
          opacity={0.2}
        />
      </div>
    </>
  );
};

// Minimal variant with subtle shapes
const MinimalVariantShapes: React.FC<{opacity: number}> = ({opacity}) => {
  return (
    <>
      <div className="absolute top-0 right-0 opacity-10" style={{opacity: opacity * 0.4}}>
        <CosmicCircle 
          className="w-20 h-20" 
          animate={false} 
          glowColor="cyan" 
        />
      </div>
      <div className="absolute bottom-0 left-0 opacity-10" style={{opacity: opacity * 0.4}}>
        <CosmicHexagon 
          className="w-16 h-16" 
          animate={false} 
          glowColor="purple" 
        />
      </div>
    </>
  );
};

// Ethereal variant with floating elements
const EtherealVariantShapes: React.FC<{opacity: number}> = ({opacity}) => {
  return (
    <>
      <div className="absolute inset-0 opacity-5" style={{opacity: opacity * 0.3}}>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-cosmic-pulse"></div>
        <div className="absolute top-3/4 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-cosmic-pulse delay-300"></div>
        <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-orange-400 rounded-full animate-cosmic-pulse delay-100"></div>
        <div className="absolute top-1/3 left-1/6 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-cosmic-pulse delay-200"></div>
        <div className="absolute top-2/3 left-5/6 w-1 h-1 bg-purple-300 rounded-full animate-cosmic-pulse delay-400"></div>
      </div>
      <div className="absolute -bottom-16 -right-16 opacity-10" style={{opacity: opacity * 0.5}}>
        <GoldenSpiral 
          className="w-52 h-52" 
          animate={true} 
          glowColor="multi" 
          opacity={0.2} 
        />
      </div>
    </>
  );
};

// Helper function to get border styles based on glow color
function getBorderStyles(glowColor: string): React.CSSProperties {
  if (glowColor === 'none') {
    return {
      border: '1px solid rgba(124, 58, 237, 0.2)',
    };
  }
  
  const baseStyles = {
    border: '1px solid',
    boxShadow: '',
  };
  
  switch (glowColor) {
    case 'cyan':
      return {
        ...baseStyles,
        borderColor: 'rgba(0, 235, 214, 0.3)',
        boxShadow: '0 0 10px rgba(0, 235, 214, 0.2), inset 0 0 5px rgba(0, 235, 214, 0.1)',
      };
    case 'purple':
      return {
        ...baseStyles,
        borderColor: 'rgba(124, 58, 237, 0.3)',
        boxShadow: '0 0 10px rgba(124, 58, 237, 0.2), inset 0 0 5px rgba(124, 58, 237, 0.1)',
      };
    case 'orange':
      return {
        ...baseStyles,
        borderColor: 'rgba(251, 146, 60, 0.3)',
        boxShadow: '0 0 10px rgba(251, 146, 60, 0.2), inset 0 0 5px rgba(251, 146, 60, 0.1)',
      };
    case 'red':
      return {
        ...baseStyles,
        borderColor: 'rgba(225, 85, 84, 0.3)',
        boxShadow: '0 0 10px rgba(225, 85, 84, 0.2), inset 0 0 5px rgba(225, 85, 84, 0.1)',
      };
    case 'multi':
      return {
        ...baseStyles,
        borderColor: 'rgba(124, 58, 237, 0.3)',
        boxShadow: '0 0 10px rgba(0, 235, 214, 0.2), 0 0 15px rgba(124, 58, 237, 0.1), inset 0 0 5px rgba(251, 146, 60, 0.1)',
      };
    default:
      return {
        ...baseStyles,
        borderColor: 'rgba(124, 58, 237, 0.2)',
      };
  }
}