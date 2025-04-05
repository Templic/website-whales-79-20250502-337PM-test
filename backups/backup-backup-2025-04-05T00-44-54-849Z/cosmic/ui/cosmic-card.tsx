"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CosmicCardProps {
  children: ReactNode;
  className?: string;
  glowEffect?: boolean;
  hoverEffect?: boolean;
  variant?: "default" | "bordered" | "glass";
}

export function CosmicCard({
  children,
  className,
  glowEffect = false,
  hoverEffect = false,
  variant = "default",
}: CosmicCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        variant === "default" && "bg-black/30 backdrop-blur-sm",
        variant === "bordered" && "bg-black/20 border border-white/10 backdrop-blur-sm",
        variant === "glass" && "bg-white/5 backdrop-blur-md border border-white/10",
        glowEffect && "relative after:absolute after:inset-0 after:rounded-xl after:opacity-0 after:transition-opacity after:duration-300 after:pointer-events-none after:bg-gradient-to-r after:from-cyan-500/20 after:via-purple-500/20 after:to-cyan-500/20 after:blur-xl hover:after:opacity-100",
        hoverEffect && "transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}