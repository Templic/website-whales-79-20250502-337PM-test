import React, { useState, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define the slider track variants
const sliderTrackVariants = cva(
  'relative h-1.5 w-full rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-gray-700',
        cosmic: 'bg-gray-800 border border-cosmic-primary/20',
        frosted: 'bg-gray-800/60 backdrop-blur-sm',
        minimal: 'bg-gray-900',
        glow: 'bg-gray-800 shadow-cosmic shadow-cosmic-primary/20',
        nebula: 'bg-gray-900 border border-purple-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define the slider progress fill variants
const sliderFillVariants = cva(
  'absolute h-full rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-gray-400',
        cosmic: 'bg-gradient-to-r from-cosmic-primary to-cosmic-secondary',
        frosted: 'bg-white/80 backdrop-blur-sm',
        minimal: 'bg-cosmic-primary',
        glow: 'bg-cosmic-primary shadow-glow shadow-cosmic-primary/50',
        nebula: 'bg-gradient-to-r from-purple-500 to-pink-500',
      },
      animate: {
        true: 'transition-all duration-200 ease-out',
        false: '',
      }
    },
    defaultVariants: {
      variant: 'default',
      animate: true,
    },
  }
);

// Define the slider thumb variants
const sliderThumbVariants = cva(
  'absolute -translate-x-1/2 cursor-pointer focus:outline-none',
  {
    variants: {
      variant: {
        default: 'w-4 h-4 bg-white rounded-full border border-gray-300 top-1/2 -translate-y-1/2',
        cosmic: 'w-4 h-4 bg-cosmic-primary rounded-full border border-cosmic-secondary top-1/2 -translate-y-1/2',
        frosted: 'w-5 h-5 bg-white/90 rounded-full backdrop-blur-sm top-1/2 -translate-y-1/2',
        minimal: 'w-3 h-3 bg-cosmic-primary rounded-full top-1/2 -translate-y-1/2',
        glow: 'w-4 h-4 bg-cosmic-primary rounded-full shadow-glow shadow-cosmic-primary/50 top-1/2 -translate-y-1/2',
        nebula: 'w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border border-white/20 top-1/2 -translate-y-1/2',
      },
      thumbVariant: {
        default: '',
        cosmic: 'bg-cosmic-primary border border-cosmic-secondary',
        glowing: 'bg-cosmic-primary shadow-glow shadow-cosmic-primary/50',
        pulsing: 'bg-cosmic-primary shadow-glow shadow-cosmic-primary/50 animate-pulse',
        nebula: 'bg-gradient-to-r from-purple-500 to-pink-500 border border-white/20',
        frosted: 'bg-white/90 backdrop-blur-sm',
        minimal: 'bg-white border-none'
      },
      size: {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
      },
      animate: {
        true: 'transition-all duration-200 ease-out',
        false: '',
      }
    },
    defaultVariants: {
      variant: 'default',
      thumbVariant: 'default',
      size: 'md',
      animate: true,
    },
  }
);

// Define the label variants
const sliderLabelVariants = cva(
  'mb-2 text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'text-gray-200',
        cosmic: 'text-cosmic-primary',
        frosted: 'text-white',
        minimal: 'text-gray-300',
        glow: 'text-cosmic-primary',
        nebula: 'text-purple-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define the value display variants
const sliderValueVariants = cva(
  'ml-2 text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'text-gray-400',
        cosmic: 'text-cosmic-secondary',
        frosted: 'text-white/80',
        minimal: 'text-gray-400',
        glow: 'text-cosmic-primary',
        nebula: 'text-pink-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Main component type
export interface CosmicSliderProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  variant?: 'default' | 'cosmic' | 'frosted' | 'minimal' | 'glow' | 'nebula';
  thumbVariant?: 'default' | 'cosmic' | 'glowing' | 'pulsing' | 'nebula' | 'frosted' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  label?: React.ReactNode;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  trackHeight?: 'thin' | 'default' | 'thick';
  showTicks?: boolean;
  ticks?: number[];
  tickLabels?: string[];
  showTooltip?: boolean;
  tooltipPosition?: 'top' | 'bottom';
}

export const CosmicSlider: React.FC<CosmicSliderProps> = ({
  label,
  variant = 'default',
  thumbVariant = 'default',
  size = 'md',
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  showValue = true,
  valuePrefix = '',
  valueSuffix = '',
  formatValue,
  trackHeight = 'default',
  showTicks = false,
  ticks,
  tickLabels,
  showTooltip = false,
  tooltipPosition = 'top',
  className,
  animate = true,
  disabled,
  ...props
}) => {
  // Internal state to manage the value
  const [internalValue, setInternalValue] = useState<number>(
    value !== undefined 
      ? Number(value) 
      : defaultValue !== undefined 
        ? Number(defaultValue) 
        : Number(min)
  );
  
  // Update internal value when controlled value changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(Number(value));
    }
  }, [value]);
  
  // Reference to the slider track for calculations
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Tooltip state
  const [showingTooltip, setShowingTooltip] = useState(false);
  const [tooltipPosition_, setTooltipPosition] = useState({ left: 0, top: 0 });
  
  // Calculate percentage for positioning
  const percentage = ((internalValue - Number(min)) / (Number(max) - Number(min))) * 100;
  
  // Generate tick marks if needed
  const tickMarks = ticks || 
    (showTicks ? Array.from({ length: 5 }, (_, i) => Number(min) + ((Number(max) - Number(min)) / 4) * i) : []);
  
  // Format the displayed value
  const displayValue = formatValue 
    ? formatValue(internalValue) 
    : `${valuePrefix}${internalValue}${valueSuffix}`;
  
  // Handle slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setInternalValue(newValue);
    
    if (onChange) {
      onChange(e);
    }
  };
  
  // Handle track click for direct positioning
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (trackRef.current && !disabled) {
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      
      const newValue = Number(min) + percentage * (Number(max) - Number(min));
      const steppedValue = Math.round(newValue / Number(step)) * Number(step);
      const clampedValue = Math.min(Number(max), Math.max(Number(min), steppedValue));
      
      setInternalValue(clampedValue);
      
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: clampedValue.toString(),
            name: props.name
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(syntheticEvent);
      }
    }
  };
  
  // Determine track height class
  const trackHeightClass = 
    trackHeight === 'thin' ? 'h-1' :
    trackHeight === 'thick' ? 'h-2' :
    'h-1.5';

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className={cn(sliderLabelVariants({ variant }))}>
            {label}
          </label>
          {showValue && (
            <span className={cn(sliderValueVariants({ variant }))}>
              {displayValue}
            </span>
          )}
        </div>
      )}
      
      <div className="relative py-4">
        {/* Slider track */}
        <div 
          ref={trackRef}
          className={cn(
            sliderTrackVariants({ variant }),
            trackHeightClass,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleTrackClick}
        >
          {/* Filled track */}
          <div 
            className={cn(
              sliderFillVariants({ variant, animate }),
              trackHeightClass
            )}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Ticks */}
          {showTicks && tickMarks.map((tickValue, index) => {
            const tickPercentage = ((tickValue - Number(min)) / (Number(max) - Number(min))) * 100;
            return (
              <div 
                key={index}
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2 bg-gray-500"
                style={{ left: `${tickPercentage}%` }}
              >
                {tickLabels && tickLabels[index] && (
                  <span 
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400"
                  >
                    {tickLabels[index]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Tooltip */}
        {showTooltip && showingTooltip && (
          <div 
            className={cn(
              "absolute z-10 px-2 py-1 text-xs rounded bg-gray-800 text-white transform -translate-x-1/2",
              tooltipPosition === 'top' ? "-top-8" : "bottom-[-2rem]"
            )}
            style={{ left: `${percentage}%` }}
          >
            {displayValue}
          </div>
        )}
      </div>
      
      {/* Hidden HTML input for the actual value */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={internalValue}
        onChange={handleChange}
        className="sr-only"
        disabled={disabled}
        onMouseEnter={() => setShowingTooltip(true)}
        onMouseLeave={() => setShowingTooltip(false)}
        {...props}
      />
      
      {/* Visible thumb */}
      <div 
        className={cn(
          sliderThumbVariants({ variant: 'default', thumbVariant, size, animate }),
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{ 
          left: `${percentage}%`, 
          top: showTicks && tickLabels ? "-0.5rem" : "50%",
          transform: `translateX(-50%) ${showTicks && tickLabels ? "" : "translateY(-50%)"}`
        }}
      />
    </div>
  );
};