import React from "react";

/**
 * @deprecated This page has been consolidated into CosmicConnectivityPage.tsx.
 * The breathwork features have been merged into the Aeroaura component.
 * This file is kept for reference purposes only.
 * Last updated: 2025-04-05
 */

import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { ParticleBackground } from "@/components/cosmic/ParticleBackground";
import { SacredGeometryDemo } from "@/components/cosmic/SacredGeometryDemo";
import { ImmersiveHeader } from "@/components/immersive/ImmersiveHeader";
import { FrequencyAttunementChamber } from "@/components/immersive/FrequencyAttunementChamber";
import { BreathSynchronizationCeremony } from "@/components/immersive/BreathSynchronizationCeremony";
import { MultidimensionalSoundJourney } from "@/components/immersive/MultidimensionalSoundJourney";
import { BinauralBeatGenerator } from "@/components/features/audio/BinauralBeatGenerator";
import { BreathSyncPlayer } from "@/components/features/audio/BreathSyncPlayer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Music, Infinity, Waves, Brain } from "lucide-react";

export default function CosmicExperienceImmersivePage_Old() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950 relative z-10">
      <ParticleBackground />
      
      <ImmersiveHeader
        title="Cosmic Consciousness Portal"
        description="Experience transformative frequencies through personalization, breath synchronization, and spatial audio."
      />

      <div className="max-w-[1200px] mx-auto mt-6 mb-12 px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <Tabs defaultValue="immersive" className="p-6 bg-black/30 backdrop-blur-md rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-black/40">
              <TabsTrigger value="immersive" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <Brain className="h-4 w-4 mr-2" />
                Immersive Journey
              </TabsTrigger>
              <TabsTrigger value="frequencies" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <Waves className="h-4 w-4 mr-2" />
                Sacred Frequencies
              </TabsTrigger>
              <TabsTrigger value="geometry" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Infinity className="h-4 w-4 mr-2" />
                Sacred Geometry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="immersive" className="space-y-6">
              <FrequencyAttunementChamber />
              <BreathSynchronizationCeremony />
            </TabsContent>

            <TabsContent value="frequencies" className="space-y-6">
              <BinauralBeatGenerator />
            </TabsContent>

            <TabsContent value="geometry" className="space-y-6">
              <SacredGeometryDemo />
            </TabsContent>
          </Tabs>

          <div className="p-6 bg-black/30 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/10">
            <h3 className="text-2xl font-bold mb-4 text-cyan-300">Multidimensional Sound Journey</h3>
            <MultidimensionalSoundJourney />
            <div className="mt-6">
              <BreathSyncPlayer tracks={[
                {
                  id: 1,
                  title: "Root Chakra Alignment",
                  artist: "ASTRA",
                  duration: "6:32",
                  audioSrc: "/placeholder.mp3",
                  coverArt: "/placeholder.svg?height=300&width=300",
                  chakra: "Root",
                  frequency: 396,
                },
                {
                  id: 2,
                  title: "Sacral Awakening",
                  artist: "ASTRA",
                  duration: "7:14",
                  audioSrc: "/placeholder.mp3",
                  coverArt: "/placeholder.svg?height=300&width=300",
                  chakra: "Sacral",
                  frequency: 417,
                }
              ]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
