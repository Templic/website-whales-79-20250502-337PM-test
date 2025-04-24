/**
 * cosmic-card.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React from "react";
import { cn } from '@/lib/utils';

export interface CosmicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glow';
  glowColor?: string;
}

const CosmicCard = React.forwardRef<HTMLDivElement, CosmicCardProps>(
  ({ className, variant = 'default', glowColor = 'rgba(99, 102, 241, 0.15)', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-card text-card-foreground shadow-sm',
      interactive: 'bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer',
      glow: 'bg-card text-card-foreground relative before:absolute before:inset-0 before:-z-10 before:rounded-xl before:blur-xl before:opacity-75'
    };

    const style = variant === 'glow' ? { 
      '--card-glow-color': glowColor 
    } as React.CSSProperties : {};

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border p-4',
          variantClasses[variant],
          className
        )}
        style={style}
        data-variant={variant}
        {...props}
      >
        {children}
        {variant === 'glow' && (
          <div 
            className="absolute inset-0 -z-10 rounded-lg opacity-75 blur-xl" 
            style={{ background: glowColor }}
          />
        )}
      </div>
    );
  }
);

CosmicCard.displayName = 'CosmicCard';

export default CosmicCard;