import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const progressContainerVariants = cva(
  'relative w-full overflow-hidden rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-gray-700',
        cosmic: 'bg-gray-900',
        nebula: 'bg-gray-900/70 backdrop-blur-sm'
      },
      size: {
        xs: 'h-1',
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
        xl: 'h-6'
      },
      border: {
        none: '',
        thin: 'border border-white/10',
        medium: 'border-2 border-white/10',
        thick: 'border-4 border-white/10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      border: 'none'
    }
  }
);

const progressBarVariants = cva(
  'h-full transition-all ease-in-out duration-500 flex items-center',
  {
    variants: {
      variant: {
        default: 'bg-cosmic-primary',
        cosmic: 'bg-gradient-to-r from-cosmic-primary to-cosmic-accent',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        info: 'bg-blue-500',
        rainbow: 'bg-gradient-to-r from-purple-600 via-blue-500 to-green-400',
        glowing: 'bg-cosmic-highlight shadow-glow-sm'
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        glow: 'animate-glow',
        shimmer: 'animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:50%_100%] bg-no-repeat'
      }
    },
    defaultVariants: {
      variant: 'default',
      animation: 'none'
    }
  }
);

export interface CosmicProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  progress: number;
  showPercentage?: boolean;
  percentagePosition?: 'inside' | 'outside' | 'tooltip';
  label?: string;
  animated?: boolean;
  indeterminate?: boolean;
  // Container props
  variant?: 'default' | 'cosmic' | 'nebula';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  border?: 'none' | 'thin' | 'medium' | 'thick';
  // Bar props
  barVariant?: 'default' | 'cosmic' | 'success' | 'warning' | 'danger' | 'info' | 'rainbow' | 'glowing';
  animation?: 'none' | 'pulse' | 'glow' | 'shimmer';
}

const CosmicProgressBar: React.FC<CosmicProgressBarProps> = ({
  className,
  variant = 'default',
  size,
  border,
  progress = 0,
  animation,
  showPercentage = false,
  percentagePosition = 'outside',
  label,
  animated = false,
  indeterminate = false,
  barVariant = 'default',
  ...props
}) => {
  // Ensure progress is between 0 and 100
  const validProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || (showPercentage && percentagePosition === 'outside')) && (
        <div className="flex justify-between mb-1 text-sm">
          {label && <span>{label}</span>}
          {showPercentage && percentagePosition === 'outside' && (
            <span>{validProgress}%</span>
          )}
        </div>
      )}
      
      <div
        className={cn(progressContainerVariants({ variant, size, border }))}
        {...props}
      >
        <div
          className={cn(
            progressBarVariants({ variant: barVariant || variant, animation }),
            indeterminate ? 'animate-indeterminate w-1/3' : '',
            animated && !indeterminate ? 'transition-width duration-1000 ease-in-out' : ''
          )}
          style={{ width: indeterminate ? undefined : `${validProgress}%` }}
        >
          {showPercentage && percentagePosition === 'inside' && validProgress >= 10 && (
            <span className={cn(
              'text-white px-2',
              size === 'xs' || size === 'sm' ? 'text-[8px]' : 
              size === 'md' ? 'text-xs' : 
              size === 'lg' ? 'text-sm' : 
              'text-base'
            )}>
              {validProgress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CosmicProgressBar;