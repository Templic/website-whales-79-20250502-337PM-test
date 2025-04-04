"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CosmicTextProps {
  children: ReactNode
  variant?: "title" | "subtitle" | "body" | "accent"
  className?: string
  align?: "left" | "center" | "right"
  glowColor?: string
  delay?: number
}

export function CosmicText({
  children,
  variant = "body",
  className,
  align = "inherit",
  glowColor = "rgba(139, 92, 246, 0.5)",
  delay = 0,
}: CosmicTextProps) {
  const getTextStyles = () => {
    switch (variant) {
      case "title":
        return "text-3xl md:text-5xl font-bold font-orbitron tracking-tight"
      case "subtitle":
        return "text-xl md:text-2xl font-semibold font-orbitron"
      case "accent":
        return "text-lg md:text-xl font-medium text-purple-400"
      case "body":
      default:
        return "text-base md:text-lg"
    }
  }

  const getTextAlign = () => {
    switch (align) {
      case "left":
        return "text-left"
      case "center":
        return "text-center"
      case "right":
        return "text-right"
      default:
        return ""
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={cn(getTextStyles(), getTextAlign(), className)}
      style={
        variant === "title"
          ? {
              textShadow: `0 0 10px ${glowColor}`,
            }
          : {}
      }
    >
      {children}
    </motion.div>
  )
}

