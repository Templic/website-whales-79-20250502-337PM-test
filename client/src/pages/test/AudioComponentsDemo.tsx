import { useState } from "react"
import { Link } from "wouter"
import { CosmicHeading } from "../../components/features/cosmic/CosmicHeading"
import { CosmicText } from "../../components/features/cosmic/CosmicText"
import { CosmicSection } from "../../components/features/cosmic/CosmicSection"
import { CosmicCard } from "../../components/features/cosmic/CosmicCard"
import { CosmicButton } from "../../components/features/cosmic/CosmicButton"
import Stars from "../../components/cosmic/Stars"
import { AlbumShowcase } from "../../components/features/audio/AlbumShowcase"
import { 
  Play, Pause, Volume2, VolumeX, Music, Mic, Brain, Cloud, Wind, 
  ArrowLeft, ArrowRight, Info, Settings, Headphones, Layers, 
  BookOpen, Zap, RotateCcw, MusicIcon, Radio, Disc, BarChart2
} from "lucide-react"
import { BinauralBeatGenerator } from "../../components/features/audio/binaural-beat-generator"
import { BreathSyncPlayer } from "../../components/features/audio/breath-sync-player"
import { FrequencyVisualizer3D } from "../../components/features/audio/frequency-visualizer-3d"
import { SpatialAudioExperience } from "../../components/features/audio/SpatialAudioExperience"
import { VoiceControlledPlayer } from "../../components/features/audio/voice-controlled-player"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Mock albums for showcase
const mockAlbums = [
  {
    id: 1,
    title: "Cosmic Healing Frequencies",
    description: "A journey through the chakras with healing frequencies",
    image: "/proxy-image(47).jpg",
    year: "2023",
  },
  {
    id: 2,
    title: "Ethereal Meditation",
    description: "Ambient soundscapes for deep meditation",
    image: "/proxy-image(48).jpg",
    year: "2022",
  },
  {
    id: 3,
    title: "Astral Projection",
    description: "Binaural beats for astral travel and lucid dreaming",
    image: "/proxy-image(49).jpg",
    year: "2021",
  },
]

/**
 * AudioComponentsDemo - Centralized repository of all audio-related components
 * Groups components by category and provides documentation
 */
export default function AudioComponentsDemo() {
  const [activeTab, setActiveTab] = useState("binaural");

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950 text-white pb-12">
      <Stars
        count={200}
        speed={0.3}
        color="#ffffff"
        backgroundColor="transparent"
        maxSize={2} 
      />
      
      <div className="container mx-auto px-4 pt-16 relative z-10">
        <header className="mb-12 text-center">
          <CosmicHeading level={1} align="center" withAccent glow className="mb-4">
            Audio Components Archive
          </CosmicHeading>
          
          <CosmicText className="max-w-2xl mx-auto text-lg opacity-80">
            A comprehensive library of all audio-related components used throughout the 
            Cosmic Experience application, from sound generation to visualizations.
          </CosmicText>
          
          <div className="mt-6">
            <Link href="/components">
              <CosmicButton variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Catalog
              </CosmicButton>
            </Link>
          </div>
        </header>
      
        <div className="mb-12">
          <Tabs 
            defaultValue="binaural" 
            className="w-full"
            onValueChange={(value) => {
              setActiveTab(value);
              // Update URL with hash for direct linking
              window.location.hash = value;
            }}
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8 bg-black/30">
              <TabsTrigger value="binaural" id="binaural">
                <Zap className="mr-2 h-4 w-4" />
                Binaural Audio
              </TabsTrigger>
              <TabsTrigger value="albums" id="albums">
                <Disc className="mr-2 h-4 w-4" />
                Albums & Playback
              </TabsTrigger>
              <TabsTrigger value="visualization" id="visualization">
                <BarChart2 className="mr-2 h-4 w-4" />
                Visualizations
              </TabsTrigger>
              <TabsTrigger value="interactive" id="interactive">
                <Headphones className="mr-2 h-4 w-4" />
                Interactive Audio
              </TabsTrigger>
            </TabsList>
            
            {/* Binaural Components Tab */}
            <TabsContent value="binaural" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CosmicSection>
                  <CosmicCard>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Binaural Beat Generator</h2>
                        <Info className="h-5 w-5 text-blue-400" />
                      </div>
                      <p className="text-gray-300 mb-4 text-sm">
                        Generate binaural beats with adjustable frequencies for meditation and focus
                      </p>
                      <BinauralBeatGenerator />
                    </div>
                  </CosmicCard>
                </CosmicSection>

                <CosmicSection>
                  <CosmicCard>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Breath Sync Player</h2>
                        <Info className="h-5 w-5 text-blue-400" />
                      </div>
                      <p className="text-gray-300 mb-4 text-sm">
                        Audio player that synchronizes with breathing patterns for meditation
                      </p>
                      <BreathSyncPlayer />
                    </div>
                  </CosmicCard>
                </CosmicSection>
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="binaural-info">
                  <AccordionTrigger className="text-white">
                    <span className="flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      About Binaural Audio Components
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Component Documentation:</h3>
                      <p className="text-gray-300">
                        Binaural audio components produce two slightly different frequencies 
                        in each ear, creating a perceived third frequency that can help induce 
                        specific brain states. Our components allow customization of base frequency, 
                        beat frequency, and volume with real-time adjustments.
                      </p>
                      <h4 className="font-medium mt-4">Implementation Notes:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                        <li>Uses Web Audio API for high-precision frequency generation</li>
                        <li>Implements frequency presets for different brain states</li>
                        <li>Provides visualization of active frequencies</li>
                        <li>Optimized for low latency and minimal CPU usage</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            {/* Albums & Playback Tab */}
            <TabsContent value="albums" className="space-y-8">
              <div className="bg-black/30 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Album Showcase Component</h2>
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-gray-300 mb-8">
                  Interactive carousel display for album collections with smooth transitions and hover effects
                </p>
                <AlbumShowcase albums={mockAlbums} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <CosmicSection>
                  <CosmicCard>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">Music Player Component</h3>
                      <p className="text-gray-300 mb-4 text-sm">
                        Customizable audio player with visualization and playlist support
                      </p>
                      <div className="flex items-center space-x-4 mt-6 justify-center">
                        <button className="p-3 rounded-full bg-indigo-700 hover:bg-indigo-600 transition-colors">
                          <RotateCcw className="h-5 w-5" />
                        </button>
                        <button className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors">
                          <Play className="h-6 w-6" />
                        </button>
                        <button className="p-3 rounded-full bg-indigo-700 hover:bg-indigo-600 transition-colors">
                          <ArrowRight className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-6 bg-gray-800 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full w-1/3"></div>
                      </div>
                      <div className="flex justify-between text-xs mt-2">
                        <span>1:24</span>
                        <span>3:45</span>
                      </div>
                    </div>
                  </CosmicCard>
                </CosmicSection>
                
                <CosmicSection>
                  <CosmicCard>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">Playlist Component</h3>
                      <p className="text-gray-300 mb-4 text-sm">
                        Customizable playlist interface with drag-and-drop ordering
                      </p>
                      <ul className="space-y-2 mt-4">
                        {[1, 2, 3].map((item) => (
                          <li key={item} className="flex items-center p-2 hover:bg-white/5 rounded-md transition-colors">
                            <MusicIcon className="h-4 w-4 mr-3 text-indigo-400" />
                            <div className="flex-1">
                              <p className="font-medium">Track {item}</p>
                              <p className="text-xs text-gray-400">Artist Name • 3:45</p>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                              <Play className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CosmicCard>
                </CosmicSection>
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="albums-info">
                  <AccordionTrigger className="text-white">
                    <span className="flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      About Album & Playback Components
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Component Documentation:</h3>
                      <p className="text-gray-300">
                        These components provide rich interfaces for browsing, displaying, and playing 
                        music collections. The album showcase features responsive design with 3D-like 
                        effects, while the music player components offer customizable controls and 
                        visualizations to enhance the listening experience.
                      </p>
                      <h4 className="font-medium mt-4">Implementation Notes:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                        <li>Built with responsive design and mobile-friendly controls</li>
                        <li>Supports various audio formats including OGG, MP3, and WAV</li>
                        <li>Includes accessibility features for keyboard navigation</li>
                        <li>Optimized for performance with lazy loading support</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            {/* Visualizations Tab */}
            <TabsContent value="visualization" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CosmicSection>
                  <CosmicCard>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Frequency Visualizer</h2>
                        <BarChart2 className="h-5 w-5 text-blue-400" />
                      </div>
                      <p className="text-gray-300 mb-4 text-sm">
                        3D visualization of audio frequencies with interactive controls
                      </p>
                      <FrequencyVisualizer3D />
                    </div>
                  </CosmicCard>
                </CosmicSection>

                <CosmicSection>
                  <CosmicCard>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">Spectrum Analyzer</h3>
                      <p className="text-gray-300 mb-4 text-sm">
                        Visual representation of audio frequency spectrum in real-time
                      </p>
                      <div className="h-40 bg-black/40 rounded-lg mt-4 flex items-end justify-between p-2">
                        {Array.from({ length: 32 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="w-1.5 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t"
                            style={{ 
                              height: `${Math.sin(i / 3) * 50 + 40}%`,
                              opacity: 0.7 + Math.sin(i / 10) * 0.3
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </CosmicCard>
                </CosmicSection>
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="visualization-info">
                  <AccordionTrigger className="text-white">
                    <span className="flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      About Visualization Components
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Component Documentation:</h3>
                      <p className="text-gray-300">
                        Audio visualization components transform sound into visual representations using 
                        various techniques. Our 3D visualizers leverage WebGL for performant rendering, 
                        while 2D visualizers use Canvas API for efficient animations. These components 
                        analyze audio data using the Web Audio API's AnalyserNode.
                      </p>
                      <h4 className="font-medium mt-4">Implementation Notes:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                        <li>Uses FFT (Fast Fourier Transform) for frequency analysis</li>
                        <li>Implements WebGL for hardware-accelerated 3D graphics</li>
                        <li>Supports customizable visuals with various themes</li>
                        <li>Includes controls for sensitivity, color schemes, and animation speed</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            {/* Interactive Audio Tab */}
            <TabsContent value="interactive" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CosmicSection>
                  <CosmicCard>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Spatial Audio Experience</h2>
                        <Layers className="h-5 w-5 text-blue-400" />
                      </div>
                      <p className="text-gray-300 mb-4 text-sm">
                        Interact with 3D spatial audio for immersive sound experiences
                      </p>
                      <SpatialAudioExperience />
                    </div>
                  </CosmicCard>
                </CosmicSection>

                <CosmicSection>
                  <CosmicCard>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Voice Controlled Player</h2>
                        <Mic className="h-5 w-5 text-blue-400" />
                      </div>
                      <p className="text-gray-300 mb-4 text-sm">
                        Control audio playback with voice commands for hands-free operation
                      </p>
                      <VoiceControlledPlayer />
                    </div>
                  </CosmicCard>
                </CosmicSection>
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="interactive-info">
                  <AccordionTrigger className="text-white">
                    <span className="flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      About Interactive Audio Components
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Component Documentation:</h3>
                      <p className="text-gray-300">
                        Interactive audio components provide unique ways to engage with sound beyond 
                        traditional playback. Spatial audio creates immersive 3D soundscapes, while 
                        voice control enables hands-free operation. These components use advanced Web 
                        APIs including SpeechRecognition and PannerNode for spatial audio positioning.
                      </p>
                      <h4 className="font-medium mt-4">Implementation Notes:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-300 text-sm">
                        <li>Implements Web Audio API's PannerNode for 3D audio positioning</li>
                        <li>Uses Web Speech API for voice command recognition</li>
                        <li>Provides fallback interfaces for browsers without speech support</li>
                        <li>Includes customizable command sets and sensitivity settings</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </div>
        
        <CosmicSection variant="gradient" className="rounded-xl mt-16">
          <div className="text-center p-6">
            <CosmicHeading level={2} align="center" withAccent className="mb-4">
              Audio Component Usage Guidelines
            </CosmicHeading>
            <p className="mb-6 max-w-3xl mx-auto">
              All audio components adhere to web standards for accessibility and performance.
              When implementing these components, ensure proper volume controls and user 
              preferences are respected, and always provide fallback options for browsers
              with limited audio support.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/components">
                <CosmicButton variant="secondary">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Component Catalog
                </CosmicButton>
              </Link>
              <a href={`#${activeTab}`}>
                <CosmicButton variant="primary">
                  <Settings className="mr-2 h-4 w-4" />
                  Current Section
                </CosmicButton>
              </a>
            </div>
          </div>
        </CosmicSection>
      </div>
    </div>
  )
}