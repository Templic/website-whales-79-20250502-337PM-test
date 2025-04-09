/**
 * CosmicConnectivityPage
 * Main page component for cosmic/sound healing experiences 
 * Integrates frequency visualization, breath syncing, and sound journeys
 */

import { useState, useEffect } from "react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { SacredGeometryDemo } from "@/components/cosmic/SacredGeometryDemo";
import { FrequencyAttunementChamber } from "@/components/immersive/FrequencyAttunementChamber";
import { BreathSynchronizationCeremony } from "@/components/immersive/BreathSynchronizationCeremony";
import { MultidimensionalSoundJourney } from "@/components/immersive/MultidimensionalSoundJourney";
import { BreathSyncPlayer } from "@/components/features/audio/BreathSyncPlayer";
import { BinauralBeatGenerator } from "@/components/features/audio/BinauralBeatGenerator";
import { CosmicButton } from "@/components/features/cosmic/CosmicButton";
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
} from "lucide-react";

export default function CosmicConnectivityPage() {
  // State management for audio tracks and UI feedback
  const [tracks, setTracks] = useState<any[]>([]);
  const { toast } = useToast();

  // Initialize component and show welcome message
  useEffect(() => {
    setTracks([]);

    toast({
      title: "Welcome to Cosmic Connectivity",
      description: "Experience the fusion of sound healing and cosmic consciousness technologies.",
      duration: 5000,
    });
  }, [toast]);

  return (
    <div className="min-h-screen relative">
      {/* Animated cosmic background component */}
      <CosmicBackground opacity={0.4} />

      {/* Main content container */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero section with main experience options */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Cosmic Connectivity</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Explore consciousness through sound, breath, and sacred geometry
          </p>

          {/* Navigation grid for main experiences */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/cosmic-connectivity/frequency">
              <div className="p-6 rounded-lg hover:bg-accent">
                <Waves className="h-8 w-8 mb-4 mx-auto" />
                <h3>Frequency Attunement</h3>
              </div>
            </Link>

            <Link href="/cosmic-connectivity/breath">
              <div className="p-6 rounded-lg hover:bg-accent">
                <Infinity className="h-8 w-8 mb-4 mx-auto" />
                <h3>Breath Synchronization</h3>
              </div>
            </Link>

            <Link href="/cosmic-connectivity/sound">
              <div className="p-6 rounded-lg hover:bg-accent">
                <Music className="h-8 w-8 mb-4 mx-auto" />
                <h3>Sound Journey</h3>
              </div>
            </Link>
          </div>
        </section>

        {/* Interactive experience components */}
        <section className="mb-16">
          <Tabs defaultValue="frequency" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="frequency">Frequency</TabsTrigger>
              <TabsTrigger value="breath">Breath</TabsTrigger>
              <TabsTrigger value="sound">Sound</TabsTrigger>
            </TabsList>

            {/* Frequency attunement tab content */}
            <TabsContent value="frequency">
              <FrequencyAttunementChamber />
            </TabsContent>

            {/* Breath synchronization tab content */}
            <TabsContent value="breath">
              <BreathSynchronizationCeremony />
            </TabsContent>

            {/* Sound journey tab content */}
            <TabsContent value="sound">
              <MultidimensionalSoundJourney />
            </TabsContent>
          </Tabs>
        </section>

        {/* Sacred geometry visualization section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8">Sacred Geometry</h2>
          <SacredGeometryDemo />
        </section>

        {/* Audio control components */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Binaural beat generation panel */}
          <div className="p-6 rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-4">
              <Zap className="inline mr-2" />
              Binaural Beats
            </h3>
            <BinauralBeatGenerator />
          </div>

          {/* Breath synchronization panel */}
          <div className="p-6 rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-4">
              <Star className="inline mr-2" />
              Breath Sync
            </h3>
            <BreathSyncPlayer />
          </div>
        </section>

        {/* Call to action section */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to Begin?</h2>
          <p className="mb-8">Start your cosmic journey with a guided session</p>
          <Link href="/cosmic-connectivity/guided">
            <CosmicButton>
              Begin Journey <ArrowRight className="ml-2" />
            </CosmicButton>
          </Link>
        </section>
      </div>
    </div>
  );
}