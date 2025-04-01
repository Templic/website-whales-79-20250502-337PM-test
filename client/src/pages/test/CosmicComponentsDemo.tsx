/* 
  The original import is commented out because SacredGeometry doesn't export these components.
  To fix this error, we would need to either create these components or remove their references.

import {
  HexagonContainer,
  OctagonContainer,
  PentagonContainer,
  TriangleInterlockContainer,
  AdaptiveTextContainer,
} from "../../components/imported/SacredGeometry"
*/
import { CosmicButton } from "../../components/imported/ui/CosmicButton"
import { CosmicHeading } from "../../components/imported/ui/CosmicHeading"
import { CosmicText } from "../../components/imported/ui/CosmicText"
import { CosmicCard } from "../../components/imported/ui/CosmicCard"
import { CosmicSection } from "../../components/imported/ui/CosmicSection"
import { CosmicPortal } from "../../components/imported/ui/CosmicPortal"
import { Star, Moon, Sun, Sparkles } from "lucide-react"

export default function CosmicComponentsDemo() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CosmicSection variant="gradient">
        <div className="max-w-5xl mx-auto">
          <CosmicHeading level={1} align="center" withAccent glow>
            Cosmic Components Demo
          </CosmicHeading>
          <CosmicText className="mt-4 text-center" delay={0.5}>
            This page showcases the various cosmic-themed UI components imported from v0
          </CosmicText>

          {/* Cosmic Buttons */}
          <section className="mt-16">
            <CosmicHeading level={2} align="center">
              Cosmic Buttons
            </CosmicHeading>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <CosmicButton variant="primary" icon={<Sparkles />}>
                Primary Button
              </CosmicButton>
              <CosmicButton variant="secondary" icon={<Moon />}>
                Secondary Button
              </CosmicButton>
              <CosmicButton variant="outline" icon={<Sun />}>
                Outline Button
              </CosmicButton>
              <CosmicButton variant="ghost" icon={<Star />}>
                Ghost Button
              </CosmicButton>
            </div>
          </section>

          {/* Cosmic Headings */}
          <section className="mt-16">
            <CosmicHeading level={2} align="center">
              Cosmic Headings
            </CosmicHeading>
            <div className="mt-8 space-y-4">
              <CosmicHeading level={1}>Level 1 Heading</CosmicHeading>
              <CosmicHeading level={2}>Level 2 Heading</CosmicHeading>
              <CosmicHeading level={3}>Level 3 Heading</CosmicHeading>
              <CosmicHeading level={4}>Level 4 Heading</CosmicHeading>
              <CosmicHeading level={5}>Level 5 Heading</CosmicHeading>
              <CosmicHeading level={6}>Level 6 Heading</CosmicHeading>
            </div>
          </section>

          {/* Cosmic Text */}
          <section className="mt-16">
            <CosmicHeading level={2} align="center">
              Cosmic Text
            </CosmicHeading>
            <div className="mt-8 space-y-4">
              <CosmicText size="xs">Extra Small Text</CosmicText>
              <CosmicText size="sm">Small Text</CosmicText>
              <CosmicText size="md">Medium Text</CosmicText>
              <CosmicText size="lg">Large Text</CosmicText>
              <CosmicText size="xl">Extra Large Text</CosmicText>
              <CosmicText color="muted">Muted Text</CosmicText>
              <CosmicText color="accent">Accent Text</CosmicText>
            </div>
          </section>

          {/* Cosmic Cards */}
          <section className="mt-16">
            <CosmicHeading level={2} align="center">
              Cosmic Card
            </CosmicHeading>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <CosmicCard variant="default" glowColor="rgba(139, 92, 246, 0.5)">
                <div className="p-6">
                  <CosmicHeading level={3}>Default Card</CosmicHeading>
                  <CosmicText className="mt-4">
                    This is a default variant card with a purple glow effect.
                  </CosmicText>
                </div>
              </CosmicCard>
              <CosmicCard variant="subtle" glowColor="rgba(239, 68, 68, 0.5)">
                <div className="p-6">
                  <CosmicHeading level={3}>Subtle Card</CosmicHeading>
                  <CosmicText className="mt-4">
                    This is a subtle variant card with a red glow effect.
                  </CosmicText>
                </div>
              </CosmicCard>
              <CosmicCard variant="outline" glowColor="rgba(16, 185, 129, 0.5)">
                <div className="p-6">
                  <CosmicHeading level={3}>Outline Card</CosmicHeading>
                  <CosmicText className="mt-4">
                    This is an outline variant card with a green glow effect.
                  </CosmicText>
                </div>
              </CosmicCard>
              <CosmicCard glowColor="rgba(59, 130, 246, 0.5)" delay={0.2}>
                <div className="p-6">
                  <CosmicHeading level={3}>Delayed Card</CosmicHeading>
                  <CosmicText className="mt-4">
                    This card has a slight animation delay and blue glow effect.
                  </CosmicText>
                </div>
              </CosmicCard>
            </div>
          </section>

          {/* Sacred Geometry Containers - Commented out pending implementation of container components
          <section className="mt-16">
            <CosmicHeading level={2} align="center">
              Sacred Geometry Containers
            </CosmicHeading>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <HexagonContainer>
                <CosmicHeading level={3}>Hexagon</CosmicHeading>
                <CosmicText className="mt-2">
                  This is a hexagonal container with a pulsing glow effect.
                </CosmicText>
              </HexagonContainer>
              <OctagonContainer>
                <CosmicHeading level={3}>Octagon</CosmicHeading>
                <CosmicText className="mt-2">
                  This is an octagonal container with a pulsing glow effect.
                </CosmicText>
              </OctagonContainer>
              <PentagonContainer>
                <CosmicHeading level={3}>Pentagon</CosmicHeading>
                <CosmicText className="mt-2">
                  This is a pentagonal container with a pulsing glow effect.
                </CosmicText>
              </PentagonContainer>
              <TriangleInterlockContainer>
                <CosmicHeading level={3}>Interlocked Triangles</CosmicHeading>
                <CosmicText className="mt-2">
                  This container has interlocked triangles with a pulsing glow effect.
                </CosmicText>
              </TriangleInterlockContainer>
            </div>
          </section>
          */}

          {/* Cosmic Portals */}
          <section className="mt-16 mb-16">
            <CosmicHeading level={2} align="center">
              Cosmic Portals
            </CosmicHeading>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <CosmicPortal
                title="Music Portal"
                description="Explore cosmic music and frequencies"
                imageSrc="https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
                destination="/music"
                color="from-purple-500 to-indigo-600"
              />
              <CosmicPortal
                title="Meditation Portal"
                description="Immerse yourself in guided meditations"
                imageSrc="https://images.unsplash.com/photo-1549576490-b0b4831ef60a"
                destination="/meditation"
                color="from-blue-500 to-teal-600"
              />
              <CosmicPortal
                title="Journey Portal"
                description="Begin your cosmic journey"
                imageSrc="https://images.unsplash.com/photo-1539321908154-04927596ed74"
                destination="/journey"
                color="from-pink-500 to-purple-600"
              />
            </div>
          </section>
        </div>
      </CosmicSection>
    </div>
  )
}