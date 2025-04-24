/**
 * cosmic-spinner.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */import React from "react";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CosmicSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "cosmic" | "secondary" | "success" | "warning" | "danger" | "primary";
}

export const CosmicSpinner = React.forwardRef<HTMLDivElement, CosmicSpinnerProps>(
  ({ className, size = "md", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-2",
      lg: "h-10 w-10 border-3",
      xl: "h-16 w-16 border-4",
    };

    const variantClasses = {
      default: "border-gray-200 border-t-gray-800",
      cosmic: "border-gray-200 border-t-cosmic-primary",
      secondary: "border-gray-200 border-t-gray-500",
      success: "border-gray-200 border-t-green-500",
      warning: "border-gray-200 border-t-yellow-500",
      danger: "border-gray-200 border-t-red-500",
      primary: "border-gray-200 border-t-blue-500",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

CosmicSpinner.displayName = "CosmicSpinner";

export default CosmicSpinner;