/**
 * cosmic-button.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cva, type VariantProps } from 'class-variance-authority';

// Create a specialized type for our cosmic variants
type CosmicVariant = 
  | 'cosmic'
  | 'energetic'
  | 'ethereal'
  | 'moonlight'
  | 'stardust'
  | 'nebula'
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'primary'; // Added for compatibility with merged components

// Define the cosmic button variants
const cosmicButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        cosmic: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 cosmic-hover-glow",
        energetic: "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 cosmic-hover-glow",
        ethereal: "bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600 cosmic-hover-glow",
        moonlight: "bg-gradient-to-r from-gray-700 to-slate-800 text-white hover:from-gray-800 hover:to-slate-900 cosmic-hover-glow",
        stardust: "border border-purple-300 bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 cosmic-glass-effect",
        nebula: "border border-indigo-300/30 bg-indigo-950/30 backdrop-blur-md text-white hover:bg-indigo-900/40 cosmic-glass-effect",
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90", // Added for compatibility with merged components
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Define our custom props interface
export interface CosmicButtonProps extends 
  React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CosmicVariant;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children: React.ReactNode;
  // Added for compatibility with merged components
  icon?: React.ReactNode;
}

// Create our CosmicButton component
const CosmicButton = forwardRef<HTMLButtonElement, CosmicButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    // Return a styled button using our cosmic variants
    return (
      <button
        className={cn(cosmicButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

CosmicButton.displayName = 'CosmicButton';

export { CosmicButton };
export default CosmicButton;