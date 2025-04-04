
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

export default function CosmicExperienceImmersivePage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950 relative">
      <CosmicBackground />
      
      <ImmersiveHeader
        title="Cosmic Consciousness Portal"
        description="Experience transformative frequencies through personalization, breath synchronization, and spatial audio."
      />

      <Tabs defaultValue="immersive" className="container mx-auto py-8 px-4">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="immersive">
            <Brain className="h-4 w-4 mr-2" />
            Immersive Journey
          </TabsTrigger>
          <TabsTrigger value="frequencies">
            <Waves className="h-4 w-4 mr-2" />
            Sacred Frequencies
          </TabsTrigger>
          <TabsTrigger value="geometry">
            <Infinity className="h-4 w-4 mr-2" />
            Sacred Geometry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="immersive" className="space-y-8">
          <FrequencyAttunementChamber />
          <BreathSynchronizationCeremony />
          <MultidimensionalSoundJourney />
        </TabsContent>

        <TabsContent value="frequencies" className="space-y-8">
          <BinauralBeatGenerator />
          <BreathSyncPlayer tracks={[]} />
        </TabsContent>

        <TabsContent value="geometry" className="space-y-8">
          <SacredGeometryDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
