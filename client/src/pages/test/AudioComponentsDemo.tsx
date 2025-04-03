import { useState } from "react"
import { CosmicHeading } from "../../components/imported/ui/CosmicHeading"
import { CosmicText } from "../../components/imported/ui/CosmicText"
import { CosmicSection } from "../../components/imported/ui/CosmicSection"
import { CosmicCard } from "../../components/imported/ui/CosmicCard"
import { CosmicButton } from "../../components/imported/ui/CosmicButton"
import { Play, Pause, Volume2, VolumeX, Music, Mic, Brain, Cloud, Wind } from "lucide-react"
import { BinauralBeatGenerator } from "../../components/imported/audio/BinauralBeatGenerator"
import { BreathSyncPlayer } from "../../components/imported/audio/BreathSyncPlayer"
import { FrequencyVisualizer3D } from "../../components/audio/FrequencyVisualizer3D"
import { SpatialAudioExperience } from "../../components/audio/SpatialAudioExperience"
import { VoiceControlledPlayer } from "../../components/audio/VoiceControlledPlayer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AudioComponentsDemo() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Audio Components Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CosmicSection>
          <CosmicCard>
            <h2 className="text-2xl font-semibold mb-4">Binaural Beat Generator</h2>
            <BinauralBeatGenerator />
          </CosmicCard>
        </CosmicSection>

        <CosmicSection>
          <CosmicCard>
            <h2 className="text-2xl font-semibold mb-4">Breath Sync Player</h2>
            <BreathSyncPlayer />
          </CosmicCard>
        </CosmicSection>

        <CosmicSection>
          <CosmicCard>
            <h2 className="text-2xl font-semibold mb-4">Frequency Visualizer</h2>
            <FrequencyVisualizer3D />
          </CosmicCard>
        </CosmicSection>
      </div>
    </div>
  )
}