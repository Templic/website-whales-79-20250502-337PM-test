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
  glowColor = "rgba(14, 165, 233, 0.5)",
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
      className={cn("relative overflow-hidden", getVariantStyles(), className)}
      style={{
        clipPath: "polygon(0% 0%, 100% 0%, 97% 90%, 100% 100%, 3% 100%, 0% 90%)",
        borderRadius: "0.75rem",
      }}
    >
      {/* Inner glow effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Geometric accents */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
        <svg viewBox="0 0 100 100" className="w-full h-full text-cosmic-sea-400">
          <circle cx="90" cy="10" r="10" fill="currentColor" opacity="0.3" />
          <path d="M90,10 L70,30 L90,50 Z" fill="currentColor" opacity="0.2" />
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 w-20 h-20 opacity-20">
        <svg viewBox="0 0 100 100" className="w-full h-full text-cosmic-sunset-400">
          <circle cx="10" cy="90" r="10" fill="currentColor" opacity="0.3" />
          <path d="M10,90 L30,70 L50,90 Z" fill="currentColor" opacity="0.2" />
        </svg>
      </div>

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

