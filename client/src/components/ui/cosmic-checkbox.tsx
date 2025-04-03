import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

// Checkbox wrapper styling
const checkboxWrapperVariants = cva(
  'flex items-center',
  {
    variants: {
      direction: {
        row: 'flex-row space-x-2',
        rowReverse: 'flex-row-reverse space-x-reverse space-x-2',
        column: 'flex-col space-y-1.5',
        columnReverse: 'flex-col-reverse space-y-reverse space-y-1.5'
      }
    },
    defaultVariants: {
      direction: 'row'
    }
  }
);

// Checkbox input styling (visually hidden)
const checkboxInputVariants = cva(
  'absolute w-0 h-0 opacity-0',
  {
    variants: {}
  }
);

// Checkbox custom styling
const checkboxCustomVariants = cva(
  'flex items-center justify-center border transition-all duration-200 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 border-gray-600 hover:border-gray-500 peer-focus:ring-2 peer-focus:ring-cosmic-primary/25',
        cosmic: 'bg-gray-900 border-cosmic-primary/30 hover:border-cosmic-primary/50 peer-focus:ring-2 peer-focus:ring-cosmic-primary/25 peer-checked:border-cosmic-primary peer-checked:bg-cosmic-primary/20',
        filled: 'bg-gray-800 border-gray-600 hover:border-gray-500 peer-focus:ring-2 peer-focus:ring-cosmic-primary/25 peer-checked:bg-cosmic-primary peer-checked:border-cosmic-primary',
        minimal: 'bg-transparent border-gray-600 hover:border-gray-500 peer-focus:ring-2 peer-focus:ring-cosmic-primary/25 peer-checked:border-cosmic-primary'
      },
      size: {
        sm: 'w-3.5 h-3.5 rounded-sm',
        md: 'w-4 h-4 rounded-sm',
        lg: 'w-5 h-5 rounded-md'
      },
      state: {
        default: '',
        error: 'border-red-500 peer-focus:ring-red-500/25',
        success: 'border-green-500 peer-focus:ring-green-500/25',
        disabled: 'bg-gray-700/50 border-gray-600 cursor-not-allowed'
      },
      animation: {
        none: '',
        scale: 'peer-checked:scale-90 peer-checked:scale-100',
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

// Checkbox label styling
const checkboxLabelVariants = cva(
  'text-sm',
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
export interface CosmicCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof checkboxCustomVariants>,
    VariantProps<typeof checkboxWrapperVariants> {
  label?: React.ReactNode;
  error?: boolean;
  success?: boolean;
  labelVariant?: VariantProps<typeof checkboxLabelVariants>['variant'];
  labelSize?: VariantProps<typeof checkboxLabelVariants>['size'];
  checkIcon?: React.ReactNode;
}

const CosmicCheckbox = forwardRef<HTMLInputElement, CosmicCheckboxProps>(
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
    checkIcon,
    ...props
  }, ref) => {
    // Determine state based on props
    const checkboxState = disabled 
      ? 'disabled' 
      : error 
        ? 'error' 
        : success 
          ? 'success' 
          : state;

    const id = props.id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={cn(checkboxWrapperVariants({ direction }))}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          disabled={disabled}
          className={cn(checkboxInputVariants({}), 'peer', className)}
          {...props}
        />
        <div
          className={cn(
            checkboxCustomVariants({ 
              variant, 
              size, 
              state: checkboxState,
              animation
            })
          )}
        >
          <div className="opacity-0 peer-checked:opacity-100 transition-opacity">
            {checkIcon || <Check className={cn(size === 'sm' ? 'h-2.5 w-2.5' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3')} />}
          </div>
        </div>
        {label && (
          <label 
            htmlFor={id}
            className={cn(
              checkboxLabelVariants({ 
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
CosmicCheckbox.displayName = 'CosmicCheckbox';

export default CosmicCheckbox;