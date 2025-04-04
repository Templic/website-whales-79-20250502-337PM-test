/**
 * cosmic-heading.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React from 'react';
import { cn } from '../../lib/utils';

export interface CosmicHeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
  className?: string;
  variant?: 
    | 'default' 
    | 'gradient' 
    | 'glow' 
    | 'outlined' 
    | 'cosmic';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  font?: 'default' | 'orbitron' | 'rajdhani' | 'space';
  size?: 
    | 'xs' 
    | 'sm' 
    | 'base' 
    | 'lg' 
    | 'xl' 
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl';
  animate?: boolean;
}

const CosmicHeading: React.FC<CosmicHeadingProps> = ({
  as: Component = 'h2',
  children,
  className,
  variant = 'default',
  align = 'left',
  weight = 'bold',
  font = 'default',
  size = '2xl',
  animate = false,
}) => {
  // Font family classes
  const fontClasses = {
    default: 'font-sans',
    orbitron: 'font-orbitron',
    rajdhani: 'font-rajdhani',
    space: 'font-space',
  };

  // Text alignment classes
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Font weight classes
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  // Font size classes
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  };

  // Variant classes
  const variantClasses = {
    default: 'text-white',
    gradient: 'text-transparent bg-clip-text bg-nebula-gradient',
    glow: 'text-white drop-shadow-glow',
    outlined: 'text-transparent -webkit-text-stroke-[1px] -webkit-text-stroke-white',
    cosmic: 'text-white',
  };

  // Animation classes
  const animationClass = animate ? 'animate-cosmic' : '';

  return (
    <Component
      className={cn(
        fontClasses[font],
        alignClasses[align],
        weightClasses[weight],
        sizeClasses[size],
        variantClasses[variant],
        animationClass,
        variant === 'cosmic' && 'drop-shadow-glow',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default CosmicHeading;