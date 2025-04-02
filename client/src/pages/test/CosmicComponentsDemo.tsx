import { useEffect } from "react"
import { CosmicButton } from "../../components/imported/ui/CosmicButton"
import { CosmicHeading } from "../../components/imported/ui/CosmicHeading"
import { CosmicText } from "../../components/imported/ui/CosmicText"
import { CosmicCard } from "../../components/imported/ui/CosmicCard"
import { CosmicSection } from "../../components/imported/ui/CosmicSection"
import { CosmicPortal } from "../../components/imported/ui/CosmicPortal"
import { AccessibilityControls } from "../../components/imported/AccessibilityControls"
import { Star, Moon, Sun, Sparkles } from "lucide-react"

export default function CosmicComponentsDemo() {
  return (
    <div className="min-h-screen bg-black text-white">
      <AccessibilityControls className="fixed top-4 right-4 z-50" />

      <CosmicSection variant="gradient">
        <div className="max-w-5xl mx-auto px-4">
          <CosmicHeading level={1} align="center" withAccent glow>
            Cosmic UI Components
          </CosmicHeading>
          <CosmicText className="mt-4 text-center" delay={0.5}>
            A showcase of UI components designed with cosmic aesthetics, featuring glowing effects, gradient colors, and animated interactions.
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

          {/* Cosmic Cards */}
          <section className="mt-16">
            <CosmicHeading level={2} align="center">
              Cosmic Cards
            </CosmicHeading>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <CosmicCard>
                <CosmicHeading level={3}>Feature Card</CosmicHeading>
                <CosmicText>Experience the cosmic design system</CosmicText>
              </CosmicCard>
              <CosmicCard variant="glow">
                <CosmicHeading level={3}>Glowing Card</CosmicHeading>
                <CosmicText>With ethereal glow effects</CosmicText>
              </CosmicCard>
            </div>
          </section>

          {/* Cosmic Portals */}
          <section className="mt-16 mb-16">
            <CosmicHeading level={2} align="center">
              Cosmic Portals
            </CosmicHeading>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <CosmicPortal
                title="Journey Portal"
                description="Begin your cosmic journey"
                imageSrc="/images/cosmic-journeys.jpg"
                destination="/journey"
                color="from-purple-500 to-indigo-600"
              />
              <CosmicPortal
                title="Experience Portal"
                description="Immerse in cosmic experiences"
                imageSrc="/images/oceanic-collection.jpg"
                destination="/experience"
                color="from-blue-500 to-teal-600"
              />
              <CosmicPortal
                title="Archive Portal"
                description="Explore the cosmic archives"
                imageSrc="/images/generated-icon.png"
                destination="/archive"
                color="from-pink-500 to-purple-600"
              />
            </div>
          </section>
        </div>
      </CosmicSection>
    </div>
  )
}