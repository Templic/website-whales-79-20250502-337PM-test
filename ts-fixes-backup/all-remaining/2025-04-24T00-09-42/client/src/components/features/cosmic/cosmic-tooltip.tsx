/**
 * cosmic-tooltip.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useState } from 'react';
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from 'class-variance-authority';


const tooltipVariants = cva(
  'absolute z-50 px-3 py-2 rounded-md max-w-xs text-sm transition-opacity duration-300 pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 text-white',
        cosmic: 'bg-cosmic-secondary/90 text-white border border-cosmic-primary/50 backdrop-blur-sm',
        nebula: 'bg-gradient-to-r from-cosmic-primary/90 to-cosmic-accent/90 text-white backdrop-blur-sm',
        frosted: 'bg-white/10 backdrop-blur-md border border-white/30 text-white',
        dark: 'bg-black/90 text-white'
      },
      position: {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2'
      },
      effect: {
        none: '',
        glow: 'shadow-glow-sm',
        pulse: 'animate-pulse'
      },
      arrow: {
        none: '',
        yes: 'after:content-[""] after:absolute after:w-0 after:h-0 after:border-solid'
      }
    },
    defaultVariants: {
      variant: 'default',
      position: 'top',
      effect: 'none',
      arrow: 'yes'
    },
    compoundVariants: [
      {
        position: 'top',
        arrow: 'yes',
        className: 'after:border-x-[6px] after:border-b-0 after:border-t-[6px] after:border-x-transparent after:left-1/2 after:-translate-x-1/2 after:top-full'
      },
      {
        position: 'bottom',
        arrow: 'yes',
        className: 'after:border-x-[6px] after:border-t-0 after:border-b-[6px] after:border-x-transparent after:left-1/2 after:-translate-x-1/2 after:bottom-full'
      },
      {
        position: 'left',
        arrow: 'yes',
        className: 'after:border-y-[6px] after:border-r-0 after:border-l-[6px] after:border-y-transparent after:top-1/2 after:-translate-y-1/2 after:left-full'
      },
      {
        position: 'right',
        arrow: 'yes',
        className: 'after:border-y-[6px] after:border-l-0 after:border-r-[6px] after:border-y-transparent after:top-1/2 after:-translate-y-1/2 after:right-full'
      },
      {
        variant: 'default',
        arrow: 'yes',
        className: 'after:border-t-gray-800 after:border-l-gray-800 after:border-r-gray-800 after:border-b-gray-800'
      },
      {
        variant: 'cosmic',
        arrow: 'yes',
        className: 'after:border-t-cosmic-secondary after:border-l-cosmic-secondary after:border-r-cosmic-secondary after:border-b-cosmic-secondary'
      },
      {
        variant: 'dark',
        arrow: 'yes',
        className: 'after:border-t-black after:border-l-black after:border-r-black after:border-b-black'
      }
    ]
  }
);

export interface CosmicTooltipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'>,
    VariantProps<typeof tooltipVariants> {
  content: React.ReactNode;
  children: React.ReactNode;
  showDelay?: number;
  hideDelay?: number;
  maxWidth?: string;
  trigger?: 'hover' | 'click';
  always?: boolean;
}

const CosmicTooltip: React.FC<CosmicTooltipProps> = ({
  className,
  variant,
  position,
  effect,
  arrow,
  content,
  children,
  showDelay = 200,
  hideDelay = 100,
  maxWidth,
  trigger = 'hover',
  always = false,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(always);
  const [showTimer, setShowTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (trigger !== 'hover') return;
    
    if (hideTimer) {
      clearTimeout(hideTimer);
      setHideTimer(null);
    }
    
    if (!isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showDelay);
      setShowTimer(timer);
    }
  };

  const handleMouseLeave = () => {
    if (trigger !== 'hover') return;
    
    if (showTimer) {
      clearTimeout(showTimer);
      setShowTimer(null);
    }
    
    if (isVisible && !always) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
      setHideTimer(timer);
    }
  };

  const handleClick = () => {
    if (trigger !== 'click') return;
    
    setIsVisible(prev => !prev);
  };

  const handleTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      <div 
        className={cn(
          tooltipVariants({ variant, position, effect, arrow }),
          isVisible ? 'opacity-100' : 'opacity-0',
          trigger === 'click' && 'pointer-events-auto',
          className
        )}
        style={{
          maxWidth: maxWidth || undefined
        }}
        onClick={handleTooltipClick}
        {...props}
      >
        {content}
      </div>
    </div>
  );
};

export default CosmicTooltip;