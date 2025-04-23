/**
 * CosmicButton.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CosmicButtonProps {
  children: ReactNode
  className?: string
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  glowColor?: string
  icon?: ReactNode
  onClick?: () => void
  disabled?: boolean
}

export function CosmicButton({
  children,
  className,
  variant = "primary",
  size = "md",
  glowColor = "rgba(0, 230, 230, 0.5)", // Match our theme primary color
  icon,
  onClick,
  disabled = false,
}: CosmicButtonProps) {
  // Define size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-sm"
      case "lg":
        return "px-6 py-3 text-lg"
      case "md":
      default:
        return "px-4 py-2"
    }
  }

  // Define variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "bg-white/10 hover:bg-white/15 text-white border border-white/20"
      case "outline":
        return "bg-transparent hover:bg-white/5 text-white border border-white/20"
      case "ghost":
        return "bg-transparent hover:bg-white/5 text-white"
      case "primary":
      default:
        return "bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white"
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-full font-medium transition-colors flex items-center justify-center gap-2",
        getSizeClasses(),
        getVariantClasses(),
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      style={{
        boxShadow: variant === "primary" ? `0 0 15px ${glowColor}` : "none",
      }}
    >
      {/* Icon */}
      {icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Text */}
      <span>{children}</span>

      {/* Hover glow effect for primary variant */}
      {variant === "primary" && (
        <span
          className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
          }}
        ></span>
      )}
    </motion.button>
  )
}

/**
 * Original CosmicButton component merged from: client/src/components/common/cosmic-button.tsx
 * Merge date: 2025-04-05
 */
function CosmicButtonOriginal({
  children,
  className,
  variant = "primary",
  size = "md",
  glowColor = "rgba(139, 92, 246, 0.5)",
  icon,
  onClick,
  disabled = false,
}: CosmicButtonProps) {
  // Define size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-sm"
      case "lg":
        return "px-6 py-3 text-lg"
      case "md":
      default:
        return "px-4 py-2"
    }
  }

  // Define variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "bg-white/10 hover:bg-white/15 text-white border border-white/20"
      case "outline":
        return "bg-transparent hover:bg-white/5 text-white border border-white/20"
      case "ghost":
        return "bg-transparent hover:bg-white/5 text-white"
      case "primary":
      default:
        return "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-full font-medium transition-colors flex items-center justify-center gap-2",
        getSizeClasses(),
        getVariantClasses(),
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      style={{
        boxShadow: variant === "primary" ? `0 0 15px ${glowColor}` : "none",
      }}
    >
      {/* Icon */}
      {icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Text */}
      <span>{children}</span>

      {/* Hover glow effect for primary variant */}
      {variant === "primary" && (
        <span
          className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
          }}
        ></span>
      )}
    </motion.button>
  )
}



/**
 * Original CosmicButton component merged from: client/src/components/cosmic/CosmicButton.tsx
 * Merge date: 2025-04-05
 */
function CosmicButtonCosmicOriginal({
  children,
  className,
  variant = "primary",
  size = "md",
  glowColor = "rgba(0, 230, 230, 0.5)", // Match our theme primary color
  icon,
  onClick,
  disabled = false,
}: CosmicButtonProps) {
  // Define size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-sm"
      case "lg":
        return "px-6 py-3 text-lg"
      case "md":
      default:
        return "px-4 py-2"
    }
  }

  // Define variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "bg-white/10 hover:bg-white/15 text-white border border-white/20"
      case "outline":
        return "bg-transparent hover:bg-white/5 text-white border border-white/20"
      case "ghost":
        return "bg-transparent hover:bg-white/5 text-white"
      case "primary":
      default:
        return "bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white"
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-full font-medium transition-colors flex items-center justify-center gap-2",
        getSizeClasses(),
        getVariantClasses(),
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      style={{
        boxShadow: variant === "primary" ? `0 0 15px ${glowColor}` : "none",
      }}
    >
      {/* Icon */}
      {icon && <span className="flex-shrink-0">{icon}</span>}

      {/* Text */}
      <span>{children}</span>

      {/* Hover glow effect for primary variant */}
      {variant === "primary" && (
        <span
          className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, ${glowColor} 0%, rgba(0,0,0,0) 70%)`,
          }}
        ></span>
      )}
    </motion.button>
  )
}