/**
 * cosmic-text.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CosmicTextProps {
  children: ReactNode
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  color?: "default" | "muted" | "accent"
  delay?: number
  animated?: boolean
}

export function CosmicText({
  children,
  className,
  size = "md",
  color = "default",
  delay = 0,
  animated = true,
}: CosmicTextProps) {
  // Define size classes
  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "text-xs"
      case "sm":
        return "text-sm"
      case "lg":
        return "text-lg"
      case "xl":
        return "text-xl"
      case "md":
      default:
        return "text-base"
    }
  }

  // Define color classes
  const getColorClasses = () => {
    switch (color) {
      case "muted":
        return "text-white/60"
      case "accent":
        return "text-purple-300"
      case "default":
      default:
        return "text-white/90"
    }
  }

  // Define animation variants
  const textVariants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: delay * 0.2,
        ease: "easeOut",
      },
    },
  }

  // For non-animated version
  if (!animated) {
    return <p className={cn(getSizeClasses(), getColorClasses(), className)}>{children}</p>
  }

  return (
    <motion.p
      className={cn(getSizeClasses(), getColorClasses(), className)}
      initial="hidden"
      animate="visible"
      variants={textVariants}
    >
      {children}
    </motion.p>
  )
}

