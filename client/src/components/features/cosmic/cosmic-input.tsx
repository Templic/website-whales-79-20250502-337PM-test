/**
 * cosmic-input.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CosmicInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  glowing?: boolean;
  variant?: 'default' | 'filled' | 'outline' | 'cosmic';
  error?: boolean;
  errorMessage?: string;
  success?: boolean;
  successMessage?: string;
}

const CosmicInput = forwardRef<HTMLInputElement, CosmicInputProps>(
  (
    {
      className,
      type = 'text',
      icon,
      glowing = false,
      variant = 'default',
      error = false,
      errorMessage,
      success = false,
      successMessage,
      ...props
    },
    ref
  ) => {
    // Base input styles
    const baseStyles = 'w-full focus:outline-none transition-all duration-200 font-rajdhani';

    // Variant styles
    const variantStyles = {
      default: 'bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cosmic-primary/30',
      filled: 'bg-cosmic-bg-dark/30 border-none rounded-md px-3 py-2 text-sm focus:bg-cosmic-bg-dark/40',
      outline: 'bg-transparent border border-cosmic-primary/30 rounded-md px-3 py-2 text-sm focus:border-cosmic-primary focus:ring-2 focus:ring-cosmic-primary/30',
      cosmic: 'cosmic-glass-field rounded-md px-3 py-2 text-sm text-cosmic-text'
    };

    // Determine the state (error takes precedence over success)
    let stateStyles = '';
    if (error) {
      stateStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500/30';
    } else if (success) {
      stateStyles = 'border-green-500 focus:border-green-500 focus:ring-green-500/30';
    }

    // Glowing effect
    const glowStyles = glowing 
      ? 'animate-pulse-glow' 
      : '';

    // Compose the final className
    const inputClassName = cn(
      baseStyles,
      variantStyles[variant],
      stateStyles,
      glowStyles,
      className
    );

    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cosmic-text-light">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={inputClassName}
          ref={ref}
          style={icon ? { paddingLeft: '2.5rem' } : {}}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
        )}
        {!error && success && successMessage && (
          <p className="mt-1 text-xs text-green-500">{successMessage}</p>
        )}
      </div>
    );
  }
);

CosmicInput.displayName = 'CosmicInput';

export default CosmicInput;