/**
 * button.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium font-orbitron ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:translate-y-[-2px] active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#00ebd6] to-[#7c3aed] text-white hover:from-[#00ebd6]/90 hover:to-[#7c3aed]/90 shadow-[0_0_15px_rgba(0,235,214,0.3)] hover:shadow-[0_0_20px_rgba(0,235,214,0.5)]",
        destructive:
          "bg-gradient-to-r from-[#e15554] to-[#7c3aed] text-white hover:from-[#e15554]/90 hover:to-[#7c3aed]/90 shadow-[0_0_15px_rgba(225,85,84,0.3)] hover:shadow-[0_0_20px_rgba(225,85,84,0.5)]",
        outline:
          "border border-[#00ebd6]/30 bg-[#030110]/60 backdrop-blur-md text-[#00ebd6] hover:bg-[#050215]/80 hover:border-[#00ebd6]/50 shadow-[0_0_10px_rgba(0,235,214,0.2)] hover:shadow-[0_0_15px_rgba(0,235,214,0.3)]",
        secondary:
          "border border-[#7c3aed]/20 bg-[#170b3b]/40 backdrop-blur-md text-white hover:bg-[#170b3b]/50 hover:border-[#7c3aed]/30 shadow-[0_0_15px_rgba(124,58,237,0.2)] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]",
        ghost: "text-[#00ebd6] hover:bg-[#00ebd6]/10 hover:text-[#00ebd6] hover:shadow-[0_0_10px_rgba(0,235,214,0.2)]",
        link: "text-[#00ebd6] underline-offset-4 hover:underline hover:text-[#00ebd6]/80",
        // Cosmic variants based on "Feels So Good" album colors
        cosmic: "bg-gradient-to-r from-[#00ebd6] to-[#7c3aed] text-white hover:from-[#00ebd6]/90 hover:to-[#7c3aed]/90 shadow-[0_0_15px_rgba(0,235,214,0.3)] hover:shadow-[0_0_20px_rgba(0,235,214,0.5)] border border-[#00ebd6]/20",
        energetic: "bg-gradient-to-r from-[#fb923c] to-[#e15554] text-white hover:from-[#fb923c]/90 hover:to-[#e15554]/90 shadow-[0_0_15px_rgba(251,146,60,0.3)] hover:shadow-[0_0_20px_rgba(251,146,60,0.5)] border border-[#fb923c]/20",
        ethereal: "border border-[#00ebd6]/30 bg-[#030110]/60 backdrop-blur-md text-[#00ebd6] hover:bg-[#050215]/80 hover:border-[#00ebd6]/50 shadow-[0_0_10px_rgba(0,235,214,0.2)] hover:shadow-[0_0_15px_rgba(0,235,214,0.3)]",
        sunbeam: "bg-gradient-to-r from-[#fb923c] to-[#fcd34d] text-white hover:from-[#fb923c]/90 hover:to-[#fcd34d]/90 shadow-[0_0_15px_rgba(251,146,60,0.3)] hover:shadow-[0_0_20px_rgba(251,146,60,0.5)] border border-[#fb923c]/20",
        stardust: "border border-[#00ebd6]/20 bg-black/30 backdrop-blur-sm text-white hover:bg-black/40 hover:border-[#00ebd6]/30 shadow-[0_0_5px_rgba(0,235,214,0.1)] hover:shadow-[0_0_10px_rgba(0,235,214,0.2)]",
        nebula: "border border-[#7c3aed]/20 bg-[#170b3b]/40 backdrop-blur-md text-white hover:bg-[#170b3b]/50 hover:border-[#7c3aed]/30 shadow-[0_0_15px_rgba(124,58,237,0.2)] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]",
        nova: "bg-gradient-to-r from-[#e15554] to-[#7c3aed] text-white hover:from-[#e15554]/90 hover:to-[#7c3aed]/90 shadow-[0_0_15px_rgba(225,85,84,0.3)] hover:shadow-[0_0_20px_rgba(225,85,84,0.5)] border border-[#e15554]/20",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-md",
        sm: "h-9 rounded-md px-3 py-1.5 text-xs",
        lg: "h-12 rounded-md px-8 py-3 text-base",
        xl: "h-14 rounded-lg px-10 py-4 text-lg",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "cosmic",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), isLoading && "opacity-70 cursor-wait")}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {props.children}
          </span>
        ) : (
          props.children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }