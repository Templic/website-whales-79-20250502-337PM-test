/**
 * cosmic-form.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  useForm, 
  UseFormReturn, 
  FieldValues,
  UseFormProps,
  SubmitHandler
} from "react-hook-form";

export interface CosmicFormProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  children: React.ReactNode;
  className?: string;
}

export interface CosmicFormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  isError?: boolean;
  isSuccess?: boolean;
}

export interface CosmicFormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export interface CosmicFormHelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
  isError?: boolean;
  isSuccess?: boolean;
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
      className={cn("space-y-4", className)}
      {...props}
    >
      {children}
    </form>
  );
};

export const CosmicFormGroup: React.FC<CosmicFormGroupProps> = ({
  children,
  className,
  isError,
  isSuccess,
  ...props
}) => {
  return (
    <div
      className={cn(
        "space-y-2",
        isError && "cosmic-form-group-error",
        isSuccess && "cosmic-form-group-success",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CosmicFormLabel: React.FC<CosmicFormLabelProps> = ({
  children,
  className,
  required,
  ...props
}) => {
  return (
    <label
      className={cn(
        "block text-sm font-medium leading-6 text-foreground",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
  );
};

export const CosmicFormHelperText: React.FC<CosmicFormHelperTextProps> = ({
  children,
  className,
  isError,
  isSuccess,
  ...props
}) => {
  return (
    <p
      className={cn(
        "mt-2 text-sm",
        isError && "text-destructive",
        isSuccess && "text-green-600",
        !isError && !isSuccess && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

// Also export a default object for backward compatibility
const CosmicFormComponents = {
  CosmicForm,
  CosmicFormGroup,
  CosmicFormLabel,
  CosmicFormHelperText
};


/**
 * Original CosmicForm component merged from: client/src/components/ui/cosmic-form.tsx
 * Merge date: 2025-04-05
 */
const CosmicFormOriginal = <TFormValues extends FieldValues>({
  form, 
  onSubmit, 
  children, 
  className, 
  ...props
}: CosmicFormProps<TFormValues>) => {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-4", className)}
      {...props}
    >
      {children}
    </form>
  );
};

const CosmicFormGroupOriginal: React.FC<CosmicFormGroupProps> = ({
  children,
  className,
  isError,
  isSuccess,
  ...props
}) => {
  return (
    <div
      className={cn(
        "space-y-2",
        isError && "cosmic-form-group-error",
        isSuccess && "cosmic-form-group-success",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CosmicFormLabelOriginal: React.FC<CosmicFormLabelProps> = ({
  children,
  className,
  required,
  ...props
}) => {
  return (
    <label
      className={cn(
        "block text-sm font-medium leading-6 text-foreground",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
  );
};

const CosmicFormHelperTextOriginal: React.FC<CosmicFormHelperTextProps> = ({
  children,
  className,
  isError,
  isSuccess,
  ...props
}) => {
  return (
    <p
      className={cn(
        "mt-2 text-sm",
        isError && "text-destructive",
        isSuccess && "text-green-600",
        !isError && !isSuccess && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

// Also export a default object for backward compatibility
const CosmicFormComponentsOriginal = {
  CosmicFormOriginal,
  CosmicFormGroupOriginal,
  CosmicFormLabelOriginal,
  CosmicFormHelperTextOriginal
};

export default CosmicFormComponents;
