/**
 * CosmicConnectivityPage.tsx
 * 
 * Reengineered & Optimized - 2025-04-05
 * Merged tab-based components into a single unified cosmic experience
 */
import { useState, useEffect, useMemo } from "react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { SacredGeometryVisualizer } from "@/components/features/cosmic/sacred-geometry-visualizer";
import { FrequencyAttunementChamber } from "@/components/immersive/FrequencyAttunementChamber";
import { MultidimensionalSoundJourney } from "@/components/immersive/MultidimensionalSoundJourney";
import { BinauralBeatGenerator } from "@/components/features/audio/BinauralBeatGenerator";
import { CosmicButton } from "@/components/features/cosmic/CosmicButton";
import { Aeroaura } from "@/components/features/cosmic/Aeroaura";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Link } from "wouter";
import {
  Music,
  Infinity,
  Waves,
  ArrowRight,
  Zap,
  Star,
  Wind,
  Brain,
  Sparkles
} from "lucide-react";

export default function CosmicConnectivityPage() {
  // Initialize with default tracks to prevent errors
  const [tracks] = useState<any[]>([
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
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudioError = (err: any) => {
    console.error('Audio playback failed:', err);
    setError('Failed to play audio. Please try again.');
  };

  // Track component visibility for performance optimization
  const [visibleComponents, setVisibleComponents] = useState({
    aeroaura: true,
    sacredGeometry: true,
    frequencyAttunement: true,
    multidimensionalJourney: true
  });

  const isMobile = useMediaQuery('(max-width: 768px)');

  // Optimize rendering by memoizing component visibility
  const isComponentVisible = useMemo(() => ({
    aeroaura: visibleComponents.aeroaura,
    sacredGeometry: visibleComponents.sacredGeometry,
    frequencyAttunement: visibleComponents.frequencyAttunement,
    multidimensionalJourney: visibleComponents.multidimensionalJourney
  }), [visibleComponents]);

  useEffect(() => {
    // Show welcome message
    toast({
      title: "Welcome to Cosmic Connectivity",
      description:
        "Experience the unified cosmic sound healing and consciousness expansion journey.",
      duration: 5000,
    });

    // Mark page as loaded
    setIsPageLoaded(true);

    // Cleanup function
    return () => {
      // Any cleanup needed when component unmounts
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-indigo-950/20 to-purple-950/30 text-white relative">
      {/* Dynamic Background with cosmic purple, cyan, and red theme */}
      <CosmicBackground
        color="dark-purple"
        nebulaEffect={true}
        particleCount={180} 
        opacity={0.75}
      />

      {/* Header */}
      <div className="container mx-auto pt-20 pb-10 px-4">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-red-400 to-purple-500">
            Cosmic Connectivity
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Explore the integrated cosmic sound healing experience that connects
            your consciousness to healing frequencies through advanced
            personalization, breath synchronization, and multidimensional sound.
          </p>
        </div>

        {/* Album Cover - Featured Content */}
        <div className="max-w-4xl mx-auto mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-red-500/10 to-purple-500/10 rounded-xl backdrop-blur-sm z-0"></div>
          <div className="relative z-10 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-lg overflow-hidden shadow-lg shadow-purple-500/20 border border-white/10">
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
                consciousness-expanding soundscapes that blend ancient wisdom with
                modern frequency science
              </p>
            </div>
          </div>
        </div>

        {/* Section: Integrated Cosmic Experience */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">
              Integrated Cosmic Experience
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Our merged systems combine breathwork, frequency attunement, and dimensional sound
              into a seamless journey for cosmic consciousness expansion.
            </p>
          </div>

          {/* Aeroaura Component - Integrated Breathwork */}
          <div className="mb-12 bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-purple-500/10">
            <div className="flex items-center mb-4">
              <Wind className="mr-2 h-7 w-7 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">
                Aeroaura - Integrated Breathwork
              </h2>
            </div>
            <p className="text-gray-300 mb-6 max-w-4xl">
              Glory in excel Deity — an integrated breathwork experience that combines
              synchronized breathing patterns with cosmic music. Harmonize your breath
              with the universe to reveal deeper states of consciousness and activate chakra energy fields.
            </p>
            {isComponentVisible.aeroaura && <Aeroaura tracks={tracks} />}
          </div>

          {/* Frequency Attunement Section - Merged with Binaural Beat Generator */}
          <div className="mb-12 bg-gradient-to-br from-black/80 via-cyan-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-cyan-500/10">
            <div className="flex items-center mb-4">
              <Zap className="mr-2 h-7 w-7 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">
                Frequency Attunement Chamber
              </h2>
            </div>
            <p className="text-gray-300 mb-6 max-w-4xl">
              Attune your consciousness to specific healing frequencies with our advanced chamber.
              Choose from carefully calibrated presets or create custom frequency combinations to 
              induce states of deep meditation, focus, relaxation, and enhanced creativity.
            </p>
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                {isComponentVisible.frequencyAttunement && <FrequencyAttunementChamber />}
              </div>
              <div>
                <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-5 h-full">
                  <h3 className="text-xl font-medium mb-4 text-white flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-cyan-400" />
                    Binaural Beat Generator
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Create custom binaural beats to induce specific brainwave states. 
                    Amplify the effects of the attunement chamber with targeted neural entrainment.
                  </p>
                  {isComponentVisible.frequencyAttunement && <BinauralBeatGenerator />}
                </div>
              </div>
            </div>
          </div>

          {/* Multidimensional Sound Experience */}
          <div className="mb-12 bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-purple-500/10">
            <div className="flex items-center mb-4">
              <Music className="mr-2 h-7 w-7 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">
                Multidimensional Sound Journey
              </h2>
            </div>
            <p className="text-gray-300 mb-6 max-w-4xl">
              Experience healing frequencies across dimensions. Sound spirals around your consciousness,
              creating a portal to deeper states of awareness and cosmic connection. Combine different
              sound layers to craft your unique interdimensional sound experience.
            </p>
            {isComponentVisible.multidimensionalJourney && <MultidimensionalSoundJourney />}
          </div>

          {/* Sacred Geometry Visualization */}
          <div className="mb-12 bg-gradient-to-br from-black/80 via-indigo-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-indigo-500/10">
            <div className="flex items-center mb-4">
              <Infinity className="mr-2 h-7 w-7 text-indigo-400" />
              <h2 className="text-2xl font-semibold text-white">
                Sacred Geometry Visualizer
              </h2>
            </div>
            <p className="text-gray-300 mb-6 max-w-4xl">
              Visualize the fundamental patterns of creation through sacred geometry.
              These visual representations of cosmic order enhance your meditative
              practice and breathing exercises by aligning your visual cortex with
              the mathematical principles of the universe.
            </p>
            {isComponentVisible.sacredGeometry && <SacredGeometryVisualizer />}
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
            <div className="grid gap-4 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-2xl font-semibold mb-3 text-white flex items-center">
                  <Sparkles className="mr-2 h-6 w-6 text-cyan-400" />
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
      </div>

      <div className="py-8"></div>
    </div>
  );
}