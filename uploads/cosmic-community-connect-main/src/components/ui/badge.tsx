
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: 
          "border-transparent bg-green-500 text-white hover:bg-green-600",
        cosmic: 
          "border border-cosmic-primary/30 bg-cosmic-primary/20 text-cosmic-light backdrop-blur-sm hover:bg-cosmic-primary/30",
        nebula: 
          "border-transparent bg-gradient-to-r from-cosmic-primary to-cosmic-blue text-white hover:opacity-90",
        stardust: 
          "border border-cosmic-light/20 bg-cosmic-dark/40 text-cosmic-light backdrop-blur-sm hover:bg-cosmic-dark/60",
        blockchain:
          "border border-cosmic-blue/30 bg-gradient-to-r from-cosmic-blue/20 to-cosmic-primary/20 text-cosmic-light backdrop-blur-md hover:from-cosmic-blue/30 hover:to-cosmic-primary/30",
        ethereal:
          "border-none bg-white/5 text-white backdrop-blur-lg shadow-[0_0_10px_rgba(155,135,245,0.3)] hover:shadow-[0_0_15px_rgba(155,135,245,0.5)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
