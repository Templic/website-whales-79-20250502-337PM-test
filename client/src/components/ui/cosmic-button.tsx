import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../../lib/utils";

export interface CosmicButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "cosmic"
    | "highlight"
    | "primary";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  isLoading?: boolean;
}

const CosmicButton = React.forwardRef<HTMLButtonElement, CosmicButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    
    // Determine the appropriate class based on the variant and size
    // Handle primary variant as a special case (not in the variants map initially)
    let variantClasses = "";
    
    if (variant === "primary") {
      variantClasses = "bg-cosmic-primary text-white shadow-sm hover:bg-cosmic-primary/90 transition duration-300";
    } else {
      variantClasses = buttonVariants.variants.variant[variant as keyof typeof buttonVariants.variants.variant] || "";
    }
    
    const sizeClasses = buttonVariants.variants.size[size] || "";
    
    // Custom loading spinner for cosmic buttons
    const loadingSpinner = (
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative",
          variantClasses,
          sizeClasses,
          variant === "cosmic" && "cosmic-button",
          className
        )}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && loadingSpinner}
        <span className={isLoading ? "invisible" : ""}>{children}</span>
      </Comp>
    );
  }
);

CosmicButton.displayName = "CosmicButton";

export default CosmicButton;