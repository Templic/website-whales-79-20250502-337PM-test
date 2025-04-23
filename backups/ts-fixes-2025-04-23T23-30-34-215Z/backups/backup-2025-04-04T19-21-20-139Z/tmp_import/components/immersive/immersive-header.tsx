"use client"

import { motion } from "framer-motion"
import { CosmicText } from "@/components/ui/cosmic/cosmic-text"
import { CosmicSection } from "@/components/ui/cosmic/cosmic-section"

interface ImmersiveHeaderProps {
  title: string
  description: string
}

export function ImmersiveHeader({ title, description }: ImmersiveHeaderProps) {
  return (
    <CosmicSection className="pt-20 pb-12 md:pt-28 md:pb-16 relative">
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <div className="max-w-3xl mx-auto text-center">
        <CosmicText variant="title" glowColor="rgba(139, 92, 246, 0.5)">
          {title}
        </CosmicText>
        <CosmicText variant="body" className="mt-4 text-white/80 max-w-xl mx-auto" delay={0.5}>
          {description}
        </CosmicText>
      </div>
    </CosmicSection>
  )
}

