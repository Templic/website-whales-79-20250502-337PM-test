import { useEffect, useState } from "react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { ParticleBackground } from "@/components/cosmic/ParticleBackground";
import { SacredGeometryDemo } from "@/components/cosmic/SacredGeometryDemo";
import { CosmicButton } from "@/components/features/cosmic/CosmicButton";
import { BreathSyncPlayer } from "@/components/features/audio/BreathSyncPlayer";
import { BinauralBeatGenerator } from "@/components/features/audio/BinauralBeatGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Music, Infinity, PanelTop, Waves, Moon, Leaf as Lungs, Brain } from "lucide-react";
// MainHeader is already included in MainLayout, so we don't need to import it here


export default function CosmicExperiencePage() {
  const [backgroundType, setBackgroundType] = useState<"cosmic" | "particles">("cosmic");
  const [tracks, setTracks] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setTracks([]);
    toast({
      title: "Audio files not available",
      description: "The breath synchronization feature works without music. Actual audio files will be added in a future update.",
      duration: 5000
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* MainHeader is already included in MainLayout, so we don't need to add it here */}
      {backgroundType === "cosmic" ? <CosmicBackground /> : <ParticleBackground />}
      <div className="container mx-auto pt-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-500">
            Cosmic Experience
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Explore the cosmic elements of music, sacred geometry, breath synchronization, and more.
            This showcase brings together components from our cosmic music artist experience.
          </p>
        </div>

        <Tabs defaultValue="music" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-black/20 backdrop-blur-sm">
            <TabsTrigger value="music">
              <Music className="h-4 w-4 mr-2" />
              Music Experience
            </TabsTrigger>
            <TabsTrigger value="sacred">
              <Infinity className="h-4 w-4 mr-2" />
              Sacred Geometry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music" className="space-y-8">
            <div className="bg-gradient-to-br from-black/60 via-purple-900/30 to-black/60 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/5">
              <h2 className="text-2xl font-semibold mb-4">Synchronized Breath & Music Player</h2>
              <p className="text-gray-300 mb-6">
                This player synchronizes breathing patterns with music playback, creating a deeply immersive experience.
                Select different breathing patterns and follow the visual cues to synchronize your breath.
              </p>
              <BreathSyncPlayer tracks={tracks} />
            </div>

            <div className="bg-gradient-to-br from-black/60 via-purple-900/30 to-black/60 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/5">
              <h2 className="text-2xl font-semibold mb-4">Binaural Beat Generator</h2>
              <p className="text-gray-300 mb-6">
                Generate custom binaural beats to induce specific states of consciousness.
                Binaural beats occur when two slightly different frequencies are played separately in each ear,
                creating a third "beat" frequency that can influence brain waves.
              </p>
              <BinauralBeatGenerator />
            </div>
          </TabsContent>

          <TabsContent value="sacred" className="space-y-8">
            <div className="bg-gradient-to-br from-black/60 via-purple-900/30 to-black/60 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/5">
              <h2 className="text-2xl font-semibold mb-4">Sacred Geometry Visualizations</h2>
              <p className="text-gray-300 mb-6">
                Sacred geometry patterns reveal the mathematical principles that govern our universe.
                Explore these interactive containers shaped in various sacred forms.
              </p>
              <SacredGeometryDemo />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="py-12"></div>
    </div>
  );
}