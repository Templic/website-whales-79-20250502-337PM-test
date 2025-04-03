import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cosmic: "bg-cosmic-primary text-white hover:bg-cosmic-primary/90",
        success: "bg-green-500 text-white hover:bg-green-600",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
        danger: "bg-red-500 text-white hover:bg-red-600",
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        glow: "bg-cosmic-primary text-white hover:bg-cosmic-primary/90 shadow-[0_0_15px_rgba(155,135,245,0.5)] hover:shadow-[0_0_25px_rgba(155,135,245,0.7)] hover:-translate-y-1 transition-all duration-300",
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Cosmic Button with Link support
interface CosmicButtonProps extends ButtonProps {
  href?: string;
}

const CosmicButton: React.FC<CosmicButtonProps> = ({ 
  href, 
  children, 
  className, 
  variant, 
  size, 
  ...props 
}) => {
  const classes = cn(buttonVariants({ variant, size, className }));
  
  if (href) {
    return (
      <Link to={href} className={classes}>
        {children}
      </Link>
    );
  }
  
  return (
    <Button 
      variant={variant} 
      size={size}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
};

export { Button, CosmicButton, buttonVariants };
export default CosmicButton;