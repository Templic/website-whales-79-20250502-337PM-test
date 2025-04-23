import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CosmicSectionProps {
  children: ReactNode
  className?: string
  variant?: "default" | "alt" | "dark" | "gradient"
  containerClassName?: string
  id?: string
}

export function CosmicSection({
  children,
  className,
  variant = "default",
  containerClassName,
  id,
}: CosmicSectionProps) {
  // Define section background based on variant
  const getSectionBackground = () => {
    switch (variant) {
      case "alt":
        return "bg-gradient-to-b from-black/40 to-purple-950/20"
      case "dark":
        return "bg-black/60 backdrop-blur-lg"
      case "gradient":
        return "bg-gradient-to-r from-purple-950/30 via-indigo-950/30 to-purple-950/30"
      case "default":
      default:
        return "bg-transparent"
    }
  }

  return (
    <section id={id} className={cn("relative py-16 md:py-24", getSectionBackground(), className)}>
      <div className={cn("container px-4 md:px-6 relative z-10", containerClassName)}>{children}</div>
    </section>
  )
}