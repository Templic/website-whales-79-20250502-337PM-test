import { CosmicBackground } from "@/components/ui/cosmic/cosmic-background"
import { CosmicSection } from "@/components/ui/cosmic/cosmic-section"
import { CosmicText } from "@/components/ui/cosmic/cosmic-text"
import { CosmicCard } from "@/components/ui/cosmic/cosmic-card"
import { ImmersiveHeader } from "@/components/immersive/immersive-header"
import { FrequencyAttunementChamber } from "@/components/immersive/frequency-attunement-chamber"
import { BreathSynchronizationCeremony } from "@/components/immersive/breath-synchronization-ceremony"
import { MultidimensionalSoundJourney } from "@/components/immersive/multidimensional-sound-journey"
import Link from "next/link"

export default function ImmersivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950 relative">
      <CosmicBackground />

      {/* Immersive Header */}
      <ImmersiveHeader
        title="Cosmic Consciousness Portal"
        description="Explore our collection of consciousness-expanding tools designed to deepen your connection with healing frequencies through personalization, breath synchronization, and spatial audio."
      />

      {/* Frequency Attunement Chamber */}
      <CosmicSection className="py-10 md:py-12">
        <CosmicText variant="subtitle" className="text-white mb-6" delay={0.2}>
          Frequency Attunement Chamber
        </CosmicText>
        <FrequencyAttunementChamber />
        <div className="mt-4 text-center">
          <CosmicText variant="body" className="text-white/70 max-w-2xl mx-auto" delay={0.3}>
            Attune your consciousness to specific vibrational states. The chamber adapts to your energetic needs and
            allows you to blend environmental resonances for a more immersive experience.
          </CosmicText>
        </div>
      </CosmicSection>

      {/* Breath Synchronization Ceremony */}
      <CosmicSection variant="alt" className="py-10 md:py-12">
        <CosmicText variant="subtitle" className="text-white mb-6" delay={0.2}>
          Breath Synchronization Ceremony
        </CosmicText>
        <BreathSynchronizationCeremony />
        <div className="mt-4 text-center">
          <CosmicText variant="body" className="text-white/70 max-w-2xl mx-auto" delay={0.3}>
            Harmonize your life force with cosmic rhythms. Choose from ancient breathing patterns or create your own
            sacred rhythm to deepen your connection with universal consciousness.
          </CosmicText>
        </div>
      </CosmicSection>

      {/* Multidimensional Sound Journey */}
      <CosmicSection className="py-10 md:py-12">
        <CosmicText variant="subtitle" className="text-white mb-6" delay={0.2}>
          Multidimensional Sound Journey
        </CosmicText>
        <MultidimensionalSoundJourney />
        <div className="mt-4 text-center">
          <CosmicText variant="body" className="text-white/70 max-w-2xl mx-auto" delay={0.3}>
            Experience healing frequencies across dimensions. Sound spirals around your consciousness, creating a portal
            to deeper states of awareness and cosmic connection.
          </CosmicText>
        </div>
      </CosmicSection>

      {/* Call to Action */}
      <CosmicSection variant="alt" className="py-10 md:py-12">
        <CosmicCard className="p-6">
          <div className="grid gap-4 lg:grid-cols-2 items-center">
            <div>
              <CosmicText variant="subtitle" className="text-white mb-3" delay={0.2}>
                Expand Your Cosmic Journey
              </CosmicText>
              <CosmicText variant="body" className="text-white/80" delay={0.3}>
                Integrate these consciousness tools with our full collection of cosmic healing frequencies for a
                transformative experience aligned with your highest vibration.
              </CosmicText>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end">
              <Link
                href="/archive"
                className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg border border-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              >
                Explore Frequencies
              </Link>
              <Link
                href="/experience"
                className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]"
              >
                Begin Transformation
              </Link>
            </div>
          </div>
        </CosmicCard>
      </CosmicSection>
    </div>
  )
}

