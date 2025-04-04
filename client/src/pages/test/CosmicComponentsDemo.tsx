
import { useEffect } from "react"
import { CosmicButton } from "../../components/features/cosmic/CosmicButton"
import { CosmicHeading } from "../../components/features/cosmic/CosmicHeading"
import { CosmicText } from "../../components/features/cosmic/CosmicText"
import { CosmicCard } from "../../components/features/cosmic/CosmicCard"
import { CosmicSection } from "../../components/features/cosmic/CosmicSection"
import { CosmicPortal } from "../../components/features/cosmic/CosmicPortal"
import { AccessibilityControls } from "../../components/common/AccessibilityControls"
import { Star, Moon, Sun, Sparkles, Music, Waves } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CosmicComponentsDemo() {
  const { toast } = useToast()
  
  useEffect(() => {
    document.title = "Cosmic UI Components Demo"
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <CosmicSection variant="gradient">
        <div className="max-w-5xl mx-auto px-4">
          <CosmicHeading level={1} align="center" withAccent glow>
            Cosmic UI Components
          </CosmicHeading>
          <CosmicText className="mt-4 text-center" delay={0.5}>
            A showcase of UI components designed with cosmic aesthetics, featuring glowing effects, gradient colors, and animated interactions.
          </CosmicText>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="text-xl font-medium">Cosmic Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <CosmicButton>Primary</CosmicButton>
                <CosmicButton variant="secondary">Secondary</CosmicButton>
                <CosmicButton variant="outline">Outline</CosmicButton>
                <CosmicButton variant="ghost">Ghost</CosmicButton>
              </div>
              
              <h3 className="text-xl font-medium">With Icons</h3>
              <div className="flex flex-wrap gap-4">
                <CosmicButton icon={<Music className="h-4 w-4" />}>
                  Music
                </CosmicButton>
                <CosmicButton 
                  variant="secondary" 
                  icon={<Waves className="h-4 w-4" />}
                >
                  Waves
                </CosmicButton>
              </div>
              
              <h3 className="text-xl font-medium">Sizes</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <CosmicButton size="sm">Small</CosmicButton>
                <CosmicButton size="md">Medium</CosmicButton>
                <CosmicButton size="lg">Large</CosmicButton>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-medium">Custom Glow Colors</h3>
              <div className="flex flex-wrap gap-4">
                <CosmicButton glowColor="rgba(6, 182, 212, 0.6)">
                  Cyan Glow
                </CosmicButton>
                <CosmicButton glowColor="rgba(20, 184, 166, 0.6)">
                  Teal Glow
                </CosmicButton>
                <CosmicButton glowColor="rgba(14, 165, 233, 0.6)">
                  Sky Glow
                </CosmicButton>
              </div>
              
              <h3 className="text-xl font-medium">Interactive Example</h3>
              <div className="flex flex-wrap gap-4">
                <CosmicButton
                  onClick={() => {
                    toast({
                      title: "Cosmic Event Triggered",
                      description: "You've activated a cosmic interaction!",
                    })
                  }}
                >
                  Click Me
                </CosmicButton>
              </div>
            </div>
          </div>

          {/* Additional Components */}
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-8">Other Cosmic Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <CosmicCard>
                <CosmicHeading level={3}>Cosmic Card</CosmicHeading>
                <CosmicText>Experience the cosmic design system</CosmicText>
              </CosmicCard>
              
              <CosmicCard variant="glow">
                <CosmicHeading level={3}>Glowing Card</CosmicHeading>
                <CosmicText>With ethereal glow effects</CosmicText>
              </CosmicCard>
              
              <CosmicCard>
                <CosmicHeading level={3}>Interactive Card</CosmicHeading>
                <CosmicText>Hover for cosmic animations</CosmicText>
              </CosmicCard>
            </div>
          </div>
        </div>
      </CosmicSection>
    </div>
  )
}
