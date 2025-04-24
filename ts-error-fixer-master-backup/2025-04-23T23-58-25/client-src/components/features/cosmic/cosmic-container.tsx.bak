/**
 * cosmic-container.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React from 'react';
import { cn } from "@/lib/utils"
import { cn } from '../../../lib/utils';

export interface CosmicContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | 'default' 
    | 'cosmic' 
    | 'nebula' 
    | 'minimal';
  padded?: boolean;
  centered?: boolean;
  maxWidth?: 
    | 'none'
    | 'xs'
    | 'sm' 
    | 'md' 
    | 'lg' 
    | 'xl' 
    | '2xl' 
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
    | 'full';
  minHeight?: string;
  animate?: boolean;
}

const CosmicContainer: React.FC<CosmicContainerProps> = ({
  variant = 'default',
  padded = true,
  centered = false,
  maxWidth = 'none',
  minHeight,
  animate = false,
  className,
  children,
  ...props
}) => {
  // Max width classes
  const maxWidthClasses = {
    'none': '',
    'xs': 'max-w-xs',
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  };

  // Variant classes
  const variantClasses = {
    'default': 'bg-cosmic-background/70 border border-cosmic-border',
    'cosmic': 'bg-cosmic-nebula backdrop-blur-sm border border-cosmic-primary/20',
    'nebula': 'bg-gradient-to-br from-cosmic-background to-cosmic-background-light/40 border border-cosmic-primary/30',
    'minimal': 'border border-cosmic-border/10',
  };

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden',
        variantClasses[variant],
        padded && 'p-6',
        centered && 'mx-auto',
        maxWidthClasses[maxWidth],
        animate && 'animate-fade-in',
        className
      )}
      style={{
        minHeight: minHeight || 'auto',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default CosmicContainer;