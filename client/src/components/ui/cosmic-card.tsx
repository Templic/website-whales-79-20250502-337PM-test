import React from 'react';
import { cn } from '../../lib/utils';

export interface CosmicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'frosted' | 'highlighted' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  glowColor?: string;
  hover?: boolean;
}

const CosmicCard = React.forwardRef<HTMLDivElement, CosmicCardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    borderRadius = 'md',
    animate = false,
    elevation = 'md',
    glowColor = 'cosmic-primary',
    hover = true,
    children, 
    ...props 
  }, ref) => {
    // Base classes that all cards share
    const baseClasses = "relative border-cosmic-primary/20 backdrop-blur-sm overflow-hidden";
    
    // Classes for different padding options
    const paddingClasses = {
      none: "p-0",
      sm: "p-3",
      md: "p-5",
      lg: "p-8"
    };
    
    // Classes for different border radius options
    const borderRadiusClasses = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full"
    };
    
    // Classes for different elevations
    const elevationClasses = {
      none: "",
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg"
    };
    
    // Classes for different variants
    const variantClasses = {
      default: "bg-cosmic-background/80 border",
      glow: `bg-cosmic-background/80 border shadow-[0_0_15px_rgba(155,135,245,0.3)] ${animate ? 'animate-glow' : ''}`,
      frosted: "bg-white/5 border backdrop-blur-md",
      highlighted: `bg-gradient-to-br from-cosmic-background/90 to-cosmic-background-light/70 border-2 border-${glowColor}/30`,
      interactive: "bg-cosmic-background/80 border transition-all duration-300 hover:shadow-[0_0_20px_rgba(155,135,245,0.4)]"
    };
    
    // Animation classes
    const animationClasses = animate ? "animate-float" : "";
    
    // Hover effect classes
    const hoverClasses = hover ? "transition-all duration-300 hover:border-cosmic-primary/40 hover:-translate-y-1" : "";
    
    return (
      <div
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          borderRadiusClasses[borderRadius],
          elevationClasses[elevation],
          animationClasses,
          hoverClasses,
          className
        )}
        ref={ref}
        {...props}
      >
        {variant === 'glow' && (
          <div className="absolute inset-0 -z-10 bg-cosmic-primary/5 blur-xl rounded-full transform scale-90 opacity-50"></div>
        )}
        {children}
      </div>
    );
  }
);

CosmicCard.displayName = "CosmicCard";

export default CosmicCard;