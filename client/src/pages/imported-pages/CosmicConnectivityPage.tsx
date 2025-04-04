import { useState, useEffect } from "react";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import { SacredGeometryDemo } from "@/components/cosmic/SacredGeometryDemo";
import { FrequencyAttunementChamber } from "@/components/immersive/FrequencyAttunementChamber";
import { BreathSynchronizationCeremony } from "@/components/immersive/BreathSynchronizationCeremony";
import { MultidimensionalSoundJourney } from "@/components/immersive/MultidimensionalSoundJourney";
import { BreathSyncPlayer } from "@/components/audio/BreathSyncPlayer";
import { BinauralBeatGenerator } from "@/components/audio/BinauralBeatGenerator";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Music, 
  Infinity, 
  Waves, 
  ArrowRight,
  Globe, 
  Zap, 
  Star
} from "lucide-react";

export default function CosmicConnectivityPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setTracks([]);
    
    toast({
      title: "Welcome to Cosmic Connectivity",
      description: "Experience the fusion of sound healing and cosmic consciousness technologies.",
      duration: 5000
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-indigo-950/20 to-purple-950/30 text-white relative">
      {/* Dynamic Background with cosmic purple, cyan, and red theme */}
      <CosmicBackground 
        color="dark-purple" 
        nebulaEffect={true} 
        particleCount={200}
        opacity={0.7}
      />

      {/* Header */}
      <div className="container mx-auto pt-24 pb-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-red-400 to-purple-500">
            Cosmic Connectivity
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Explore the integrated cosmic sound healing experience that connects your consciousness 
            to healing frequencies through advanced personalization, breath synchronization, and
            multidimensional sound journeys.
          </p>
        </div>

        {/* Album Cover - Dale the Whale's "Feels So Good" Integration */}
        <div className="max-w-lg mx-auto mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-red-500/10 to-purple-500/10 rounded-xl backdrop-blur-sm z-0"></div>
          <div className="relative z-10 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-lg overflow-hidden shadow-lg shadow-purple-500/20 border border-white/10">
              {/* Album cover image would go here - using a gradient placeholder */}
              <div className="w-full h-full bg-gradient-to-br from-cyan-500 via-purple-500 to-red-500 flex items-center justify-center">
                <Star className="h-12 w-12 text-white/80" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-medium text-white mb-1">Powered by the Frequencies from</h3>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-400">
                "Feels So Good"
              </h2>
              <p className="text-sm text-gray-300 mt-2">
                Immerse yourself in the healing vibrations of Dale the Whale's consciousness-expanding soundscapes
              </p>
            </div>
          </div>
        </div>

        {/* Main Cosmic Tabs */}
        <Tabs defaultValue="frequency" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl">
            <TabsTrigger value="frequency">
              <Zap className="h-4 w-4 mr-2" />
              Frequency Attunement
            </TabsTrigger>
            <TabsTrigger value="breath">
              <Waves className="h-4 w-4 mr-2" />
              Breath Synchronization
            </TabsTrigger>
            <TabsTrigger value="sound">
              <Music className="h-4 w-4 mr-2" />
              Sound Journey
            </TabsTrigger>
            <TabsTrigger value="sacred">
              <Infinity className="h-4 w-4 mr-2" />
              Sacred Geometry
            </TabsTrigger>
          </TabsList>

          {/* Frequency Attunement Tab */}
          <TabsContent value="frequency" className="space-y-8">
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-cyan-500/10">
              <h2 className="text-2xl font-semibold mb-6 text-white">Frequency Attunement Chamber</h2>
              <FrequencyAttunementChamber />
              <div className="mt-4 text-center">
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Attune your consciousness to specific vibrational states. The chamber adapts to your energetic needs and
                  allows you to blend environmental resonances for a more immersive experience.
                </p>
              </div>
            </div>
            
            {/* Binaural Beat Generator */}
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-cyan-500/10">
              <h2 className="text-2xl font-semibold mb-4">Binaural Beat Generator</h2>
              <p className="text-gray-300 mb-6">
                Generate custom binaural beats to induce specific states of consciousness. 
                Binaural beats occur when two slightly different frequencies are played separately in each ear, 
                creating a third "beat" frequency that can influence brain waves.
              </p>
              <BinauralBeatGenerator />
            </div>
          </TabsContent>

          {/* Breath Synchronization Tab */}
          <TabsContent value="breath" className="space-y-8">
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-red-500/10">
              <h2 className="text-2xl font-semibold mb-6 text-white">Breath Synchronization Ceremony</h2>
              <BreathSynchronizationCeremony />
              <div className="mt-4 text-center">
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Harmonize your life force with cosmic rhythms. Choose from ancient breathing patterns or create your own
                  sacred rhythm to deepen your connection with universal consciousness.
                </p>
              </div>
            </div>
            
            {/* Synchronized Breath & Music Player */}
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-red-500/10">
              <h2 className="text-2xl font-semibold mb-4">Synchronized Breath & Music Player</h2>
              <p className="text-gray-300 mb-6">
                This player synchronizes breathing patterns with music playback, creating a deeply immersive experience.
                Select different breathing patterns and follow the visual cues to synchronize your breath.
              </p>
              <BreathSyncPlayer tracks={tracks} />
            </div>
          </TabsContent>

          {/* Sound Journey Tab */}
          <TabsContent value="sound" className="space-y-8">
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-purple-500/10">
              <h2 className="text-2xl font-semibold mb-6 text-white">Multidimensional Sound Journey</h2>
              <MultidimensionalSoundJourney />
              <div className="mt-4 text-center">
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Experience healing frequencies across dimensions. Sound spirals around your consciousness, creating a portal
                  to deeper states of awareness and cosmic connection.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Sacred Geometry Tab */}
          <TabsContent value="sacred" className="space-y-8">
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-purple-500/10">
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

      {/* Call to Action */}
      <div className="container mx-auto py-10 md:py-12 px-4">
        <div className="bg-gradient-to-r from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
          <div className="grid gap-4 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-3 text-white">Begin Your Transformation</h2>
              <p className="text-gray-300">
                Experience a comprehensive journey through cosmic consciousness technologies with our
                integrated tools designed to elevate your vibrational state and connect you with universal energy.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end">
              <Link href="/shop">
                <CosmicButton 
                  variant="secondary"
                  className="bg-gradient-to-r from-cyan-700/80 to-cyan-900/80 hover:from-cyan-600/80 hover:to-cyan-800/80"
                >
                  Explore Products
                </CosmicButton>
              </Link>
              <Link href="/music-release">
                <CosmicButton 
                  variant="primary"
                  icon={<ArrowRight className="h-4 w-4" />}
                  className="bg-gradient-to-r from-purple-700/80 to-purple-900/80 hover:from-purple-600/80 hover:to-purple-800/80"
                >
                  Listen to Music
                </CosmicButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12"></div>
    </div>
  );
}