import React from 'react';
import { cn } from '@/lib/utils';
import { useForm, UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';

// CosmicForm
export interface CosmicFormProps<TFormValues extends FieldValues = FieldValues>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
}

export const CosmicForm = <TFormValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: CosmicFormProps<TFormValues>) => {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
      {...props}
    >
      {children}
    </form>
  );
};

// CosmicFormGroup
export interface CosmicFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CosmicFormGroup: React.FC<CosmicFormGroupProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
};

// CosmicFormLabel
export interface CosmicFormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const CosmicFormLabel: React.FC<CosmicFormLabelProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <label
      className={cn('block text-sm font-medium', className)}
      {...props}
    >
      {children}
    </label>
  );
};

// CosmicFormHelperText
export interface CosmicFormHelperTextProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  isError?: boolean;
}

export const CosmicFormHelperText: React.FC<CosmicFormHelperTextProps> = ({
  className,
  children,
  isError = false,
  ...props
}) => {
  return (
    <p
      className={cn(
        'text-xs mt-1',
        isError ? 'text-red-400' : 'text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

export default { CosmicForm, CosmicFormGroup, CosmicFormLabel, CosmicFormHelperText };