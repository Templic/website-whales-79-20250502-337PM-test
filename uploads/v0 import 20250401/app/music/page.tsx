import type { Metadata } from "next"
import { CosmicSection } from "@/components/ui/cosmic/cosmic-section"
import { CosmicText } from "@/components/ui/cosmic/cosmic-text"
import { MusicReleaseSection } from "@/components/music/music-release-section"
import { MusicPromotionArea } from "@/components/music/music-promotion-area"
import { MusicArchive } from "@/components/music/music-archive"
import { SacredGeometryBackground } from "@/components/ui/cosmic/sacred-geometry"
import {
  HexagonContainer,
  OctagonContainer,
  PentagonContainer,
  TriangleInterlockContainer,
} from "@/components/ui/cosmic/sacred-geometry"

export const metadata: Metadata = {
  title: "Music Harmonics | ASTRA - Cosmic Healing Frequencies",
  description:
    "Experience transformative sound healing through cosmic frequencies designed to balance chakras and elevate consciousness.",
}

export default function MusicPage() {
  return (
    <>
      <SacredGeometryBackground />

      {/* Hero Section */}
      <CosmicSection className="pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <CosmicText variant="title" className="mb-4">
            Cosmic Frequency Harmonics
          </CosmicText>
          <CosmicText variant="body" className="text-cosmic-sea-200 mb-8">
            Experience the transformative power of sacred sound frequencies, designed to align your energy centers and
            elevate consciousness through geometric harmonic principles.
          </CosmicText>
        </div>
      </CosmicSection>

      {/* New Releases Section */}
      <CosmicSection variant="alt" className="py-16">
        <HexagonContainer className="mb-16">
          <CosmicText variant="title" className="mb-8 text-center">
            New Releases
          </CosmicText>
          <MusicReleaseSection />
        </HexagonContainer>
      </CosmicSection>

      {/* Promotion Area */}
      <CosmicSection variant="gradient" className="py-16">
        <OctagonContainer className="mb-16">
          <CosmicText variant="title" className="mb-8 text-center">
            Upcoming Events & Releases
          </CosmicText>
          <MusicPromotionArea />
        </OctagonContainer>
      </CosmicSection>

      {/* Archive Section */}
      <CosmicSection variant="dark" className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <PentagonContainer>
            <CosmicText variant="subtitle" className="mb-6 text-center">
              Frequency Collections
            </CosmicText>
            <MusicArchive type="collections" />
          </PentagonContainer>

          <TriangleInterlockContainer>
            <CosmicText variant="subtitle" className="mb-6 text-center">
              Individual Tracks
            </CosmicText>
            <MusicArchive type="individual" />
          </TriangleInterlockContainer>
        </div>
      </CosmicSection>
    </>
  )
}

