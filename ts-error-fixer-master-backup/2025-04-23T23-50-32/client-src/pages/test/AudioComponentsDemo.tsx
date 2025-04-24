import React from "react";
import { useState } from "react"
import { CosmicHeading } from "../../components/features/cosmic/CosmicHeading"
import { CosmicText } from "../../components/features/cosmic/CosmicText"
import { CosmicSection } from "../../components/features/cosmic/CosmicSection"
import { CosmicCard } from "../../components/features/cosmic/CosmicCard"
import { CosmicButton } from "../../components/features/cosmic/CosmicButton"
import { Play, Pause, Volume2, VolumeX, Music, Mic, Brain, Cloud, Wind } from "lucide-react"
import { BinauralBeatGenerator } from "../../components/features/audio/binaural-beat-generator"
import { BreathSyncPlayer } from "../../components/features/audio/breath-sync-player"
import { FrequencyVisualizer3D } from "../../components/features/audio/frequency-visualizer-3d"
import { SpatialAudioExperience } from "../../components/features/audio/SpatialAudioExperience"
import { VoiceControlledPlayer } from "../../components/features/audio/voice-controlled-player"
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