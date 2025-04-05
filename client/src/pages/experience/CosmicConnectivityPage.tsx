/**
 * CosmicConnectivityPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 * Updated 2025-04-05: Merged breathwork features from cosmic-experience-immersive
 */
import { useState, useEffect } from "react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { SacredGeometryDemo } from "@/components/cosmic/SacredGeometryDemo";
import { FrequencyAttunementChamber } from "@/components/immersive/FrequencyAttunementChamber";
import { MultidimensionalSoundJourney } from "@/components/immersive/MultidimensionalSoundJourney";
import { BinauralBeatGenerator } from "@/components/features/audio/BinauralBeatGenerator";
import { CosmicButton } from "@/components/features/cosmic/CosmicButton";
import { Aeroaura } from "@/components/features/cosmic/Aeroaura";
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
  Star,
  Wind,
  Brain,
} from "lucide-react";

export default function CosmicConnectivityPage() {
  // Initialize with default tracks to prevent errors
  const [tracks, setTracks] = useState<any[]>([
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
    },
    {
      id: 3,
      title: "Solar Plexus Activation",
      artist: "ASTRA",
      duration: "5:48",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Solar Plexus",
      frequency: 528,
    }
  ]);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch tracks here if needed in the future
    // For now, we're already initializing with default tracks

    toast({
      title: "Welcome to Cosmic Connectivity",
      description:
        "Experience the fusion of sound healing and cosmic consciousness technologies.",
      duration: 5000,
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
            Explore the integrated cosmic sound healing experience that connects
            your consciousness to healing frequencies through advanced
            personalization, breath synchronization, and multidimensional sound
            journeys.
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
              <h3 className="text-xl font-medium text-white mb-1">
                Powered by the Frequencies from
              </h3>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-400">
                "Feels So Good"
              </h2>
              <p className="text-sm text-gray-300 mt-2">
                Immerse yourself in the healing vibrations of Dale the Whale's
                consciousness-expanding soundscapes
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout for Cosmic Experience */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
          {/* Left Column - Aeroaura Component */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-purple-500/10">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
                <Wind className="mr-2 h-6 w-6 text-purple-400" />
                Aeroaura
              </h2>
              <p className="text-gray-300 mb-6">
                Glory in excel Deity — an integrated breathwork experience that combines
                synchronized breathing patterns with cosmic music. Harmonize your breath
                with the universe to reveal deeper states of consciousness.
              </p>
              <Aeroaura tracks={tracks} />
            </div>
          </div>

          {/* Right Column - Sacred Geometry & Sound Journey */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-black/80 via-indigo-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-indigo-500/10">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
                <Infinity className="mr-2 h-6 w-6 text-indigo-400" />
                Sacred Geometry
              </h2>
              <p className="text-gray-300 mb-6">
                Visualize the fundamental patterns of creation through sacred geometry.
                These visual representations of cosmic order can enhance your meditative
                practice and breathing exercises.
              </p>
              <SacredGeometryDemo />
            </div>

            <div className="bg-gradient-to-br from-black/80 via-cyan-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-cyan-500/10">
              <h2 className="text-2xl font-semibold mb-4 text-white flex items-center">
                <Brain className="mr-2 h-6 w-6 text-cyan-400" />
                Frequency Attunement
              </h2>
              <p className="text-gray-300 mb-6">
                Attune your consciousness to specific healing frequencies with our
                binaural beat generator. Create custom frequency combinations to induce
                states of deep meditation, focus, or relaxation.
              </p>
              <BinauralBeatGenerator />
            </div>
          </div>
        </div>

        {/* Main Cosmic Tabs */}
        <Tabs defaultValue="frequency" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl">
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
          </TabsList>

          {/* Frequency Attunement Tab */}
          <TabsContent value="frequency" className="space-y-8">
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-cyan-500/10">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Frequency Attunement Chamber
              </h2>
              <FrequencyAttunementChamber />
              <div className="mt-4 text-center">
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Attune your consciousness to specific vibrational states. The
                  chamber adapts to your energetic needs and allows you to blend
                  environmental resonances for a more immersive experience.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Breath Synchronization Tab */}
          <TabsContent value="breath" className="space-y-8">
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-red-500/10">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Aeroaura - Integrated Breathwork Experience
              </h2>
              <p className="text-gray-300 mb-6">
                Our integrated breathwork experience combines the breath synchronization ceremony
                and the breath-synchronized player into a single powerful tool. Choose different
                breathing patterns, synchronize with music, and follow the visual cues to
                harmonize your breath with the cosmic frequencies.
              </p>
              <Aeroaura tracks={tracks} />
            </div>
          </TabsContent>

          {/* Sound Journey Tab */}
          <TabsContent value="sound" className="space-y-8">
            <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-purple-500/10">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Multidimensional Sound Journey
              </h2>
              <MultidimensionalSoundJourney />
              <div className="mt-4 text-center">
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Experience healing frequencies across dimensions. Sound
                  spirals around your consciousness, creating a portal to deeper
                  states of awareness and cosmic connection.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto py-10 md:py-12 px-4">
        <div className="bg-gradient-to-r from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
          <div className="grid gap-4 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-3 text-white">
                Begin Your Transformation
              </h2>
              <p className="text-gray-300">
                Experience a comprehensive journey through cosmic consciousness
                technologies with our integrated tools designed to elevate your
                vibrational state and connect you with universal energy.
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