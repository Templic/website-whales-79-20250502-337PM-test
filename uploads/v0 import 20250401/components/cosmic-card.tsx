"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CosmicCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  variant?: "default" | "subtle" | "outline"
  delay?: number
}

export function CosmicCard({
  children,
  className,
  glowColor = "rgba(139, 92, 246, 0.5)",
  variant = "default",
  delay = 0,
}: CosmicCardProps) {
  // Define variants
  const getVariantStyles = () => {
    switch (variant) {
      case "subtle":
        return "bg-black/20 backdrop-blur-md border border-white/5"
      case "outline":
        return "bg-transparent backdrop-blur-sm border border-white/10"
      case "default":
      default:
        return "bg-black/40 backdrop-blur-lg border border-white/10"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.2 }}
      className={cn("relative rounded-xl overflow-hidden", getVariantStyles(), className)}
    >
      {/* Inner glow effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-20"
        style={{
          boxShadow: `inset 0 0 20px ${glowColor}`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

