/**
 * cosmic-radio.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Radio wrapper styling
const radioWrapperVariants = cva(
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

// Radio group wrapper styling
const radioGroupVariants = cva(
  '',
  {
    variants: {
      direction: {
        row: 'flex flex-row flex-wrap gap-4',
        column: 'flex flex-col gap-2'
      },
      variant: {
        default: '',
        card: 'space-y-2',
        cosmic: 'space-y-2'
      }
    },
    defaultVariants: {
      direction: 'column',
      variant: 'default'
    }
  }
);

// Individual radio card styling
const radioCardVariants = cva(
  'relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-gray-700 hover:border-gray-600 peer-checked:border-cosmic-primary bg-gray-800/50',
        cosmic: 'border-cosmic-primary/20 hover:border-cosmic-primary/40 peer-checked:border-cosmic-primary bg-gray-900/30 peer-checked:bg-cosmic-primary/5',
        frosted: 'border-white/10 hover:border-white/20 peer-checked:border-cosmic-primary/70 bg-gray-900/20 backdrop-blur-sm'
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5'
      },
      state: {
        default: '',
        error: 'border-red-500 peer-checked:border-red-500',
        success: 'border-green-500 peer-checked:border-green-500',
        disabled: 'border-gray-700 bg-gray-800/30 opacity-60 cursor-not-allowed'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default'
    }
  }
);

// Radio input styling (visually hidden)
const radioInputVariants = cva(
  'absolute w-0 h-0 opacity-0',
  {
    variants: {}
  }
);

// Radio custom styling
const radioCustomVariants = cva(
  'flex items-center justify-center rounded-full border transition-all duration-200 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 border-gray-600 hover:border-gray-500 peer-focus:ring-2 peer-focus:ring-cosmic-primary/25',
        cosmic: 'bg-gray-900 border-cosmic-primary/30 hover:border-cosmic-primary/50 peer-focus:ring-2 peer-focus:ring-cosmic-primary/25 peer-checked:border-cosmic-primary',
        filled: 'bg-gray-800 border-gray-600 hover:border-gray-500 peer-focus:ring-2 peer-focus:ring-cosmic-primary/25 peer-checked:bg-cosmic-primary peer-checked:border-cosmic-primary',
        minimal: 'bg-transparent border-gray-600 hover:border-gray-500 peer-focus:ring-2 peer-focus:ring-cosmic-primary/25 peer-checked:border-cosmic-primary'
      },
      size: {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
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

// Radio label styling
const radioLabelVariants = cva(
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

// Radio check dot styling
const radioCheckDotVariants = cva(
  'rounded-full opacity-0 peer-checked:opacity-100 transition-opacity',
  {
    variants: {
      variant: {
        default: 'bg-white',
        cosmic: 'bg-cosmic-primary',
        frosted: 'bg-cyan-300'
      },
      size: {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

// Define component interfaces
export interface CosmicRadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof radioCustomVariants>,
    VariantProps<typeof radioWrapperVariants> {
  label?: React.ReactNode;
  error?: boolean;
  success?: boolean;
  labelVariant?: VariantProps<typeof radioLabelVariants>['variant'];
  labelSize?: VariantProps<typeof radioLabelVariants>['size'];
}

export interface CosmicRadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof radioGroupVariants> {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  error?: string;
  success?: string;
}

export interface CosmicRadioCardProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof radioCardVariants> {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

// Components
const CosmicRadio = forwardRef<HTMLInputElement, CosmicRadioProps>(
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
    ...props
  }, ref) => {
    // Determine state based on props
    const radioState = disabled 
      ? 'disabled' 
      : error 
        ? 'error' 
        : success 
          ? 'success' 
          : state;

    const id = props.id || `radio-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={cn(radioWrapperVariants({ direction }))}>
        <input
          ref={ref}
          id={id}
          type="radio"
          disabled={disabled}
          className={cn(radioInputVariants({}), 'peer', className)}
          {...props}
        />
        <div
          className={cn(
            radioCustomVariants({ 
              variant, 
              size, 
              state: radioState,
              animation
            })
          )}
        >
          <div className={cn(
            radioCheckDotVariants({ 
              variant: variant === 'cosmic' ? 'cosmic' : variant === 'filled' ? 'cosmic' : 'default',
              size
            })
          )}></div>
        </div>
        {label && (
          <label 
            htmlFor={id}
            className={cn(
              radioLabelVariants({ 
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
CosmicRadio.displayName = 'CosmicRadio';

const CosmicRadioGroup = forwardRef<HTMLDivElement, CosmicRadioGroupProps>(
  ({ 
    className,
    direction,
    variant,
    value,
    onChange,
    name,
    error,
    success,
    children,
    ...props
  }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(radioGroupVariants({ direction, variant }), className)}
        {...props}
      >
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return child;
          
          return React.cloneElement(child as React.ReactElement<any>, {
            name,
            checked: child.props.value === value,
            onChange: handleChange,
            error: !!error,
            success: !!success && !error,
          });
        })}
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        {success && !error && <p className="text-sm text-green-500 mt-1">{success}</p>}
      </div>
    );
  }
);
CosmicRadioGroup.displayName = 'CosmicRadioGroup';

const CosmicRadioCard = forwardRef<HTMLInputElement, CosmicRadioCardProps>(
  ({ 
    className,
    variant,
    size,
    state,
    label,
    description,
    error,
    success,
    disabled,
    ...props
  }, ref) => {
    // Determine state based on props
    const cardState = disabled 
      ? 'disabled' 
      : error 
        ? 'error' 
        : success 
          ? 'success' 
          : state;

    const id = props.id || `radio-card-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type="radio"
          disabled={disabled}
          className={cn(radioInputVariants({}), 'peer', className)}
          {...props}
        />
        <label 
          htmlFor={id}
          className={cn(
            radioCardVariants({ 
              variant, 
              size, 
              state: cardState
            }),
            'block'
          )}
        >
          <div className="font-medium mb-1">{label}</div>
          {description && <div className="text-sm text-gray-400">{description}</div>}
        </label>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-current peer-checked:border-cosmic-primary peer-checked:bg-cosmic-primary/20 transition-all"></div>
      </div>
    );
  }
);
CosmicRadioCard.displayName = 'CosmicRadioCard';

export { CosmicRadio, CosmicRadioGroup, CosmicRadioCard };