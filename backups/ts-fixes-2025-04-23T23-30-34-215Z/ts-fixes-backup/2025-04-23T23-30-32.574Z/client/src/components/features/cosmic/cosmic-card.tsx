
import { ReactNode } from "react"

import { motion } from "framer-motion"

/**
 * cosmic-card.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CosmicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glow' | 'subtle' | 'outline' | 'bordered' | 'glass';
  glowColor?: string;
  // Added for compatibility with merged components
  delay?: number;
  glowEffect?: boolean;
  hoverEffect?: boolean;
}

const CosmicCard = React.forwardRef<HTMLDivElement, CosmicCardProps>(
  ({ 
    className, 
    variant = 'default', 
    glowColor = 'rgba(99, 102, 241, 0.15)', 
    glowEffect = false,
    hoverEffect = false,
    delay = 0,
    children, 
    ...props 
  }, ref) => {
    const variantClasses = {
      default: 'bg-card text-card-foreground shadow-sm',
      interactive: 'bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer',
      glow: 'bg-card text-card-foreground relative before:absolute before:inset-0 before:-z-10 before:rounded-xl before:blur-xl before:opacity-75',
      // Added for compatibility with merged components
      subtle: 'bg-black/20 backdrop-blur-md border border-white/5',
      outline: 'bg-transparent backdrop-blur-sm border border-white/10',
      bordered: 'bg-black/20 border border-white/10 backdrop-blur-sm',
      glass: 'bg-white/5 backdrop-blur-md border border-white/10'
    };

    const style = variant === 'glow' ? { 
      '--card-glow-color': glowColor 
    } as React.CSSProperties : {};

    // Create custom styles based on variant
    const getVariantStyles = () => {
      if (variant in variantClasses) {
        return variantClasses[variant as keyof typeof variantClasses];
      }
      return variantClasses.default;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border p-4',
          getVariantStyles(),
          glowEffect && "relative after:absolute after:inset-0 after:rounded-xl after:opacity-0 after:transition-opacity after:duration-300 after:pointer-events-none after:bg-gradient-to-r after:from-cyan-500/20 after:via-purple-500/20 after:to-cyan-500/20 after:blur-xl hover:after:opacity-100",
          hoverEffect && "transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg",
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

export { CosmicCard };

/**
 * Original CosmicCard component merged from: client/src/components/common/cosmic-card.tsx
 * Merge date: 2025-04-05
 */
function CosmicCardOriginal({
  children,
  className,
  glowColor = "rgba(139, 92, 246, 0.5)",
  variant = "default",
  delay = 0,
}: CosmicCardProps) {
  // Define variants
  const getVariantStyles = () => {
    switch (variant) {
      case "subtle":
        return "bg-black/20 backdrop-blur-md border border-white/5"
      case "outline":
        return "bg-transparent backdrop-blur-sm border border-white/10"
      case "default":
      default:
        return "bg-black/40 backdrop-blur-lg border border-white/10"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.2 }}
      className={cn("relative rounded-xl overflow-hidden", getVariantStyles(), className)}
    >
      {/* Inner glow effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-20"
        style={{
          boxShadow: `inset 0 0 20px ${glowColor}`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

/**
 * Original CosmicCard component merged from: client/src/components/cosmic/ui/cosmic-card.tsx
 * Merge date: 2025-04-05
 */
function CosmicCardSecondOriginal({
  children,
  className,
  glowEffect = false,
  hoverEffect = false,
  variant = "default",
}: CosmicCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        variant === "default" && "bg-black/30 backdrop-blur-sm",
        variant === "bordered" && "bg-black/20 border border-white/10 backdrop-blur-sm",
        variant === "glass" && "bg-white/5 backdrop-blur-md border border-white/10",
        glowEffect && "relative after:absolute after:inset-0 after:rounded-xl after:opacity-0 after:transition-opacity after:duration-300 after:pointer-events-none after:bg-gradient-to-r after:from-cyan-500/20 after:via-purple-500/20 after:to-cyan-500/20 after:blur-xl hover:after:opacity-100",
        hoverEffect && "transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Original CosmicCard component merged from: client/src/components/features/cosmic/CosmicCard.tsx
 * Merge date: 2025-04-05
 */
function CosmicCardThirdOriginal({
  children,
  className,
  glowColor = "rgba(139, 92, 246, 0.5)",
  variant = "default",
  delay = 0,
}: CosmicCardProps) {
  // Define variants
  const getVariantStyles = () => {
    switch (variant) {
      case "subtle":
        return "bg-black/20 backdrop-blur-md border border-white/5"
      case "outline":
        return "bg-transparent backdrop-blur-sm border border-white/10"
      case "default":
      default:
        return "bg-black/40 backdrop-blur-lg border border-white/10"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.2 }}
      className={cn("relative rounded-xl overflow-hidden", getVariantStyles(), className)}
    >
      {/* Inner glow effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-20"
        style={{
          boxShadow: `inset 0 0 20px ${glowColor}`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

export default CosmicCard;