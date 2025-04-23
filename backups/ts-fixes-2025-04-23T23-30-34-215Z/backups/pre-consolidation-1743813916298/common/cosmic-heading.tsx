/**
 * cosmic-heading.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 */
/**
 * cosmic-heading.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CosmicHeadingProps {
  children: ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
  align?: "left" | "center" | "right"
  glow?: boolean
  animated?: boolean
  font?: "orbitron" | "nebula" | "space" | "default"
  color?: string
  withAccent?: boolean
}

export function CosmicHeading({
  children,
  level = 2,
  className,
  align = "left",
  glow = true,
  animated = true,
  font = "orbitron",
  color = "text-white",
  withAccent = false,
}: CosmicHeadingProps) {
  // Define alignment classes
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align]

  // Define font classes
  const fontClass = {
    orbitron: "font-orbitron",
    nebula: "font-nebula",
    space: "font-space-grotesk",
    default: "",
  }[font]

  // Define base styles
  const baseStyles = cn(alignClass, fontClass, color, "tracking-wider", glow && "drop-shadow-glow", className)

  // Define size classes based on heading level
  const sizeClass = {
    1: "text-4xl md:text-5xl lg:text-6xl font-bold",
    2: "text-3xl md:text-4xl font-bold",
    3: "text-2xl md:text-3xl font-semibold",
    4: "text-xl md:text-2xl font-semibold",
    5: "text-lg md:text-xl font-medium",
    6: "text-base md:text-lg font-medium",
  }[level]

  // Combine all styles
  const styles = cn(baseStyles, sizeClass)

  // Animation variants
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  // Render the appropriate heading level
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements

  // Render with or without animation
  if (animated) {
    return (
      <motion.div initial="hidden" animate="visible" variants={variants} className="relative">
        <HeadingTag className={styles}>{children}</HeadingTag>

        {withAccent && (
          <motion.div
            className="absolute -bottom-2 left-0 h-[3px] bg-gradient-to-r from-purple-500 to-transparent"
            initial={{ width: 0 }}
            animate={{ width: "40%" }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          />
        )}
      </motion.div>
    )
  }

  return (
    <div className="relative">
      <HeadingTag className={styles}>{children}</HeadingTag>

      {withAccent && (
        <div className="absolute -bottom-2 left-0 h-[3px] w-2/5 bg-gradient-to-r from-purple-500 to-transparent" />
      )}
    </div>
  )
}

