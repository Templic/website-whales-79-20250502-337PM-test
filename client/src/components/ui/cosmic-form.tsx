import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Label } from '@/components/ui/label';

// Form container styling
const formContainerVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: 'space-y-5',
        compact: 'space-y-3',
        separated: 'space-y-8',
        cosmic: 'space-y-6 p-6 bg-gray-900/30 border border-cosmic-primary/20 rounded-lg',
        frosted: 'space-y-6 p-6 bg-gray-900/20 backdrop-blur-md border border-white/10 rounded-lg'
      },
      layout: {
        default: '',
        inline: 'flex items-end gap-4 flex-wrap',
        grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
      }
    },
    defaultVariants: {
      variant: 'default',
      layout: 'default'
    }
  }
);

// Form group styling (label + input container)
const formGroupVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: 'space-y-2',
        compact: 'space-y-1',
        inline: 'flex items-center gap-3'
      },
      state: {
        default: '',
        error: '',
        success: '',
      }
    },
    defaultVariants: {
      variant: 'default',
      state: 'default'
    }
  }
);

// Form label styling
const formLabelVariants = cva(
  'block text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'text-gray-200',
        cosmic: 'text-cosmic-primary',
        gradient: 'text-transparent bg-clip-text bg-gradient-to-r from-cosmic-primary to-cosmic-accent',
        muted: 'text-gray-400'
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
      },
      weight: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold'
      },
      required: {
        true: 'after:content-["*"] after:ml-0.5 after:text-cosmic-accent',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      weight: 'medium',
      required: false
    }
  }
);

// Form helper text styling
const formHelperTextVariants = cva(
  'text-sm mt-1',
  {
    variants: {
      variant: {
        default: 'text-gray-400',
        error: 'text-red-400',
        success: 'text-green-400',
        warning: 'text-yellow-400',
        info: 'text-blue-400'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// Define component interfaces
export interface CosmicFormProps
  extends React.FormHTMLAttributes<HTMLFormElement>,
    VariantProps<typeof formContainerVariants> {}

export interface CosmicFormGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formGroupVariants> {
  error?: string;
  success?: string;
}

export interface CosmicFormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof formLabelVariants> {}

export interface CosmicFormHelperTextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof formHelperTextVariants> {}

// Components
export const CosmicForm = forwardRef<HTMLFormElement, CosmicFormProps>(
  ({ className, variant, layout, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(formContainerVariants({ variant, layout }), className)}
        {...props}
      />
    );
  }
);
CosmicForm.displayName = 'CosmicForm';

export const CosmicFormGroup = forwardRef<HTMLDivElement, CosmicFormGroupProps>(
  ({ className, variant, state, error, success, children, ...props }, ref) => {
    const statusState = error ? 'error' : success ? 'success' : state;
    
    return (
      <div
        ref={ref}
        className={cn(formGroupVariants({ variant, state: statusState }), className)}
        {...props}
      >
        {children}
        {error && (
          <p className={cn(formHelperTextVariants({ variant: 'error' }))}>
            {error}
          </p>
        )}
        {success && !error && (
          <p className={cn(formHelperTextVariants({ variant: 'success' }))}>
            {success}
          </p>
        )}
      </div>
    );
  }
);
CosmicFormGroup.displayName = 'CosmicFormGroup';

export const CosmicFormLabel = forwardRef<HTMLLabelElement, CosmicFormLabelProps>(
  ({ className, variant, size, weight, required, ...props }, ref) => {
    return (
      <Label
        ref={ref}
        className={cn(formLabelVariants({ variant, size, weight, required }), className)}
        {...props}
      />
    );
  }
);
CosmicFormLabel.displayName = 'CosmicFormLabel';

export const CosmicFormHelperText = forwardRef<HTMLParagraphElement, CosmicFormHelperTextProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(formHelperTextVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
CosmicFormHelperText.displayName = 'CosmicFormHelperText';

// Re-export the input component we previously created
export { default as CosmicInput } from './cosmic-input';