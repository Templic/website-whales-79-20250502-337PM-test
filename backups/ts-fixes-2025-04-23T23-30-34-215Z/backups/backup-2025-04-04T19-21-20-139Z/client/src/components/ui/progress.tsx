"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

interface CircularProgressProps {
  value: number
  size?: "sm" | "md" | "lg"
  indicatorColor?: string
  trackColor?: string
  className?: string
}

function CircularProgress({
  value,
  size = "md",
  indicatorColor = "bg-primary",
  trackColor = "bg-secondary/30",
  className,
}: CircularProgressProps) {
  const getSize = () => {
    switch (size) {
      case "sm":
        return "h-8 w-8"
      case "lg":
        return "h-16 w-16"
      case "md":
      default:
        return "h-12 w-12"
    }
  }

  const getStrokeWidth = () => {
    switch (size) {
      case "sm":
        return 3
      case "lg":
        return 5
      case "md":
      default:
        return 4
    }
  }

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className={cn("relative flex items-center justify-center", getSize(), className)}>
      {/* Track */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
        <circle
          className={trackColor}
          cx="50"
          cy="50"
          r={radius}
          strokeWidth={getStrokeWidth()}
          fill="none"
        />
      </svg>
      
      {/* Indicator */}
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          className={cn("transition-all duration-300 ease-in-out", indicatorColor)}
          cx="50"
          cy="50"
          r={radius}
          strokeWidth={getStrokeWidth()}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Value */}
      <div className="text-xs font-medium">{Math.round(value)}%</div>
    </div>
  )
}

export { Progress, CircularProgress }