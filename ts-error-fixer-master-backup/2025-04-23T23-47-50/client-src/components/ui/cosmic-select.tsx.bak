/**
 * cosmic-select.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { forwardRef } from 'react';
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

// Select container styling
const selectContainerVariants = cva(
  'relative w-full',
  {
    variants: {
      variant: {
        default: '',
        cosmic: '',
        frosted: '',
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// Select styling
const selectVariants = cva(
  'w-full appearance-none focus:outline-none transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 border border-gray-700 text-white hover:border-gray-600 focus:border-gray-500 focus:ring-1 focus:ring-cosmic-primary/50',
        cosmic: 'bg-gray-900 border border-cosmic-primary/30 text-white hover:border-cosmic-primary/50 focus:border-cosmic-primary focus:ring-1 focus:ring-cosmic-primary/50',
        frosted: 'bg-gray-900/50 backdrop-blur-sm border border-white/10 text-white hover:border-white/20 focus:border-white/30 focus:ring-1 focus:ring-cosmic-primary/30',
      },
      size: {
        sm: 'text-xs py-1 pl-2 pr-8 rounded-md',
        md: 'text-sm py-2 pl-3 pr-9 rounded-md',
        lg: 'text-base py-2.5 pl-4 pr-10 rounded-md'
      },
      state: {
        default: '',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500/50',
        disabled: 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed'
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto'
      },
      withIcon: {
        true: 'pl-10',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
      fullWidth: true,
      withIcon: false
    }
  }
);

// Icon styling
const selectIconContainerVariants = cva(
  'absolute inset-y-0 flex items-center pointer-events-none',
  {
    variants: {
      position: {
        left: 'left-0 pl-3',
        right: 'right-0 pr-3'
      }
    },
    defaultVariants: {
      position: 'left'
    }
  }
);

// Define component interfaces
export interface CosmicSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'prefix'>,
    VariantProps<typeof selectVariants> {
  prefix?: React.ReactNode;
  error?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  containerClassName?: string;
}

const CosmicSelect = forwardRef<HTMLSelectElement, CosmicSelectProps>(
  ({ 
    className, 
    variant, 
    size, 
    state, 
    fullWidth, 
    withIcon, 
    prefix, 
    error, 
    success,
    icon,
    iconPosition = 'left',
    disabled,
    containerClassName,
    children,
    ...props 
  }, ref) => {
    // Determine the state based on props
    const selectState = disabled 
      ? 'disabled' 
      : error 
        ? 'error' 
        : success 
          ? 'success' 
          : state;

    // Determine if the select should have increased left padding for the icon
    const hasLeftIcon = !!icon && iconPosition === 'left';

    return (
      <div className={cn(selectContainerVariants({ variant }), containerClassName)}>
        {prefix && <div className="mb-1 text-sm text-gray-400">{prefix}</div>}
        
        {hasLeftIcon && (
          <div className={cn(selectIconContainerVariants({ position: 'left' }))}>
            {icon}
          </div>
        )}
        
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            selectVariants({ 
              variant, 
              size, 
              state: selectState, 
              fullWidth,
              withIcon: hasLeftIcon
            }), 
            className
          )}
          {...props}
        >
          {children}
        </select>
        
        <div className={cn(selectIconContainerVariants({ position: 'right' }))}>
          {icon && iconPosition === 'right' ? icon : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
    );
  }
);
CosmicSelect.displayName = 'CosmicSelect';

export default CosmicSelect;