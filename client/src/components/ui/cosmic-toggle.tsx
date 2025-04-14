/**
 * cosmic-toggle.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Toggle wrapper styling
const toggleWrapperVariants = cva(
  'flex items-center',
  {
    variants: {
      direction: {
        row: 'flex-row space-x-2',
        rowReverse: 'flex-row-reverse space-x-reverse space-x-2',
      }
    },
    defaultVariants: {
      direction: 'row'
    }
  }
);

// Toggle track styling
const toggleTrackVariants = cva(
  'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-gray-700 peer-checked:bg-gray-500',
        cosmic: 'bg-gray-800 peer-checked:bg-cosmic-primary',
        minimal: 'bg-gray-700/50 peer-checked:bg-cosmic-primary/50',
        frosted: 'bg-gray-800/40 backdrop-blur-sm peer-checked:bg-cosmic-primary/70'
      },
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-12'
      },
      state: {
        default: '',
        error: 'bg-red-900/50 peer-checked:bg-red-500',
        success: 'bg-green-900/50 peer-checked:bg-green-500',
        disabled: 'bg-gray-600 peer-checked:bg-gray-500 opacity-50 cursor-not-allowed'
      },
      animation: {
        none: '',
        pulse: 'peer-checked:animate-pulse',
        glow: 'peer-checked:shadow-glow transition-shadow duration-300'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
      animation: 'none'
    }
  }
);

// Toggle thumb styling
const toggleThumbVariants = cva(
  'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5 translate-x-0.5 peer-checked:translate-x-4',
        md: 'h-4.5 w-4.5 translate-x-0.5 peer-checked:translate-x-5',
        lg: 'h-5 w-5 translate-x-1 peer-checked:translate-x-6'
      },
      glow: {
        true: 'peer-checked:shadow-cosmic-glow',
        false: ''
      }
    },
    defaultVariants: {
      size: 'md',
      glow: false
    }
  }
);

// Toggle label styling
const toggleLabelVariants = cva(
  'text-sm select-none',
  {
    variants: {
      variant: {
        default: 'text-gray-200',
        muted: 'text-gray-400',
        cosmic: 'text-cosmic-primary'
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
      },
      disabled: {
        true: 'text-gray-500 cursor-not-allowed',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      disabled: false
    }
  }
);

// Define component interface
export interface CosmicToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof toggleTrackVariants>,
    VariantProps<typeof toggleWrapperVariants> {
  label?: React.ReactNode;
  error?: boolean;
  success?: boolean;
  labelVariant?: VariantProps<typeof toggleLabelVariants>['variant'];
  labelSize?: VariantProps<typeof toggleLabelVariants>['size'];
  labelPosition?: 'left' | 'right';
  thumbGlow?: boolean;
}

const CosmicToggle = forwardRef<HTMLInputElement, CosmicToggleProps>(
  ({ 
    className,
    variant,
    size,
    state,
    animation,
    direction,
    label,
    error,
    success,
    disabled,
    labelVariant = 'default',
    labelSize,
    labelPosition = 'right',
    thumbGlow = false,
    ...props
  }, ref) => {
    // Determine state based on props
    const toggleState = disabled 
      ? 'disabled' 
      : error 
        ? 'error' 
        : success 
          ? 'success' 
          : state;

    // Determine direction based on label position
    const wrapperDirection = labelPosition === 'left' ? 'rowReverse' : 'row';

    const id = props.id || `toggle-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={cn(toggleWrapperVariants({ direction: wrapperDirection }))}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="sr-only peer"
          disabled={disabled}
          {...props}
        />
        <div
          className={cn(
            toggleTrackVariants({ 
              variant, 
              size, 
              state: toggleState,
              animation
            }),
            className
          )}
        >
          <span
            className={cn(
              toggleThumbVariants({ 
                size,
                glow: thumbGlow
              }),
              size === 'sm' ? 'mt-0.75' : size === 'lg' ? 'mt-1' : 'mt-0.75'
            )}
          ></span>
        </div>
        {label && (
          <label 
            htmlFor={id}
            className={cn(
              toggleLabelVariants({ 
                variant: labelVariant, 
                size: labelSize || size,
                disabled
              })
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
CosmicToggle.displayName = 'CosmicToggle';

export default CosmicToggle;