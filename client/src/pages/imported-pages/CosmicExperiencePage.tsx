import { useEffect, useState } from "react";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import { ParticleBackground } from "@/components/cosmic/ParticleBackground";
import { SacredGeometryDemo } from "@/components/cosmic/SacredGeometryDemo";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { BreathSyncPlayer } from "@/components/audio/BreathSyncPlayer";
import { BinauralBeatGenerator } from "@/components/audio/BinauralBeatGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Music, Infinity, PanelTop, Waves, Moon, Leaf as Lungs, Brain } from "lucide-react";

// Note: We don't need to import Header & Footer since they're part of the Layout component

export default function CosmicExperiencePage() {
  const [backgroundType, setBackgroundType] = useState<"cosmic" | "particles">("cosmic");
  const [tracks, setTracks] = useState<any[]>([]);
  const { toast } = useToast();
  
  // This is a placeholder for the tracks since we don't have actual audio files yet
  useEffect(() => {
    // We're not setting any tracks since we don't have audio files yet
    // The BreathSyncPlayer component will display a placeholder
    setTracks([]);
    
    // Display a friendly message to the user about the audio files
    toast({
      title: "Audio files not available",
      description: "The breath synchronization feature works without music. Actual audio files will be added in a future update.",
      duration: 5000
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Dynamic Background */}
      {backgroundType === "cosmic" ? <CosmicBackground /> : <ParticleBackground />}
      
      {/* Header */}
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
            <TabsTrigger value="components">
              <PanelTop className="h-4 w-4 mr-2" />
              UI Components
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="music" className="space-y-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Synchronized Breath & Music Player</h2>
              <p className="text-gray-300 mb-6">
                This player synchronizes breathing patterns with music playback, creating a deeply immersive experience.
                Select different breathing patterns and follow the visual cues to synchronize your breath.
              </p>
              
              <BreathSyncPlayer tracks={tracks} />
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
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
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Sacred Geometry Visualizations</h2>
              <p className="text-gray-300 mb-6">
                Sacred geometry patterns reveal the mathematical principles that govern our universe.
                Explore these interactive containers shaped in various sacred forms.
              </p>
              
              <SacredGeometryDemo />
            </div>
          </TabsContent>
          
          <TabsContent value="components" className="space-y-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Cosmic UI Components</h2>
              <p className="text-gray-300 mb-6">
                A showcase of UI components designed with cosmic aesthetics, featuring glowing effects,
                gradient colors, and animated interactions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="py-12"></div>
    </div>
  );
}