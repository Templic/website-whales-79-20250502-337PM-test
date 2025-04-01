import { useState } from "react"
import { CosmicHeading } from "../../components/imported/ui/CosmicHeading"
import { CosmicText } from "../../components/imported/ui/CosmicText"
import { CosmicSection } from "../../components/imported/ui/CosmicSection"
import { CosmicCard } from "../../components/imported/ui/CosmicCard"
import { CosmicButton } from "../../components/imported/ui/CosmicButton"
import { Play, Pause, Volume2, VolumeX, Settings, Music, Mic, Brain, Cloud, Wind, Hexagon } from "lucide-react"
import { BinauralBeatGenerator } from "../../components/imported/audio/BinauralBeatGenerator"
import { BreathSyncPlayer } from "../../components/imported/audio/BreathSyncPlayer"
import { FrequencyVisualizer3D } from "../../components/audio/FrequencyVisualizer3D"
import { SpatialAudioExperience } from "../../components/audio/SpatialAudioExperience"
import { VoiceControlledPlayer } from "../../components/audio/VoiceControlledPlayer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AudioComponentsDemo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [frequency, setFrequency] = useState(432)
  const [volume, setVolume] = useState(50)

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/50 to-black text-white">
      <CosmicSection>
        <div className="max-w-6xl mx-auto px-4">
          <CosmicHeading level={1} align="center" withAccent glow>
            Cosmic Audio Experience
          </CosmicHeading>
          <CosmicText className="mt-4 text-center max-w-3xl mx-auto" delay={0.5}>
            Experience cutting-edge audio technology designed to enhance meditation, focus, and healing. 
            Our cosmic audio tools harness the power of sound frequencies for consciousness expansion.
          </CosmicText>

          {/* Tabs for different components */}
          <div className="mt-12">
            <Tabs defaultValue="frequency-visualizer" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="bg-black/30 backdrop-blur-sm border border-purple-500/20 flex-wrap">
                  <TabsTrigger value="frequency-visualizer" className="data-[state=active]:bg-purple-600">
                    <Music className="mr-2 h-4 w-4" /> 
                    3D Visualizer
                  </TabsTrigger>
                  <TabsTrigger value="voice-control" className="data-[state=active]:bg-purple-600">
                    <Mic className="mr-2 h-4 w-4" />
                    Voice Control
                  </TabsTrigger>
                  <TabsTrigger value="binaural-beats" className="data-[state=active]:bg-purple-600">
                    <Brain className="mr-2 h-4 w-4" />
                    Binaural Beats
                  </TabsTrigger>
                  <TabsTrigger value="spatial-audio" className="data-[state=active]:bg-purple-600">
                    <Cloud className="mr-2 h-4 w-4" />
                    Spatial Audio
                  </TabsTrigger>
                  <TabsTrigger value="breath-sync" className="data-[state=active]:bg-purple-600">
                    <Wind className="mr-2 h-4 w-4" />
                    Breath Sync
                  </TabsTrigger>
                  {/* Sacred Geometry tab will be added back once component is ready */}
                </TabsList>
              </div>

              {/* Frequency Visualizer */}
              <TabsContent value="frequency-visualizer" className="mt-0">
                <div className="my-8">
                  <CosmicHeading level={2} align="center" withAccent>
                    3D Frequency Visualizer
                  </CosmicHeading>
                  <CosmicText className="mt-2 text-center max-w-2xl mx-auto">
                    Explore the ethereal geometry of sound with our interactive 3D visualizer. 
                    Experience how different frequencies manifest in visual form.
                  </CosmicText>

                  <div className="mt-8">
                    <FrequencyVisualizer3D 
                      audioUrl="/audio/meditation-alpha.mp3"
                      height="500px"
                      colorScheme="cosmic"
                      visualizationType="circular"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Voice Control */}
              <TabsContent value="voice-control" className="mt-0">
                <div className="my-8">
                  <CosmicHeading level={2} align="center" withAccent>
                    Voice Controlled Player
                  </CosmicHeading>
                  <CosmicText className="mt-2 text-center max-w-2xl mx-auto">
                    Control your cosmic audio experience with the power of your voice.
                    Simply speak commands to play, pause, adjust volume, and more.
                  </CosmicText>

                  <div className="mt-8">
                    <VoiceControlledPlayer 
                      audioTracks={[
                        { name: "Cosmic Resonance", url: "/audio/meditation-alpha.mp3" },
                        { name: "Delta Dreams", url: "/audio/delta-waves.mp3" },
                        { name: "Theta Meditation", url: "/audio/theta-waves.mp3" },
                        { name: "Alpha Focus", url: "/audio/alpha-focus.mp3" },
                      ]}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Binaural Beats */}
              <TabsContent value="binaural-beats" className="mt-0">
                <div className="my-8">
                  <CosmicHeading level={2} align="center" withAccent>
                    Binaural Beat Generator
                  </CosmicHeading>
                  <CosmicText className="mt-2 text-center max-w-2xl mx-auto">
                    Create custom binaural beats to enhance meditation, focus, creativity, or sleep.
                    Adjust frequencies precisely to target specific brainwave states.
                  </CosmicText>

                  <div className="mt-8">
                    <BinauralBeatGenerator />
                  </div>

                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <CosmicCard>
                      <div className="p-6">
                        <CosmicHeading level={4}>How Binaural Beats Work</CosmicHeading>
                        <CosmicText className="mt-2">
                          Binaural beats occur when two slightly different frequencies are played separately in each ear.
                          The brain perceives the difference between these frequencies as a third "phantom" beat.
                          This process, called frequency following response, can help guide your brain into specific states.
                        </CosmicText>
                      </div>
                    </CosmicCard>

                    <CosmicCard>
                      <div className="p-6">
                        <CosmicHeading level={4}>Brainwave States</CosmicHeading>
                        <div className="mt-4 space-y-3">
                          <div>
                            <h5 className="font-medium text-purple-300">Delta (0.5-4 Hz)</h5>
                            <p className="text-sm text-white/70">Deep sleep, healing, unconscious mind</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-indigo-300">Theta (4-8 Hz)</h5>
                            <p className="text-sm text-white/70">Meditation, creativity, dream state</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-300">Alpha (8-13 Hz)</h5>
                            <p className="text-sm text-white/70">Relaxation, calmness, present awareness</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-green-300">Beta (13-30 Hz)</h5>
                            <p className="text-sm text-white/70">Focus, alertness, active thinking</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-yellow-300">Gamma (30-100 Hz)</h5>
                            <p className="text-sm text-white/70">Higher mental activity, insight</p>
                          </div>
                        </div>
                      </div>
                    </CosmicCard>
                  </div>
                </div>
              </TabsContent>

              {/* Spatial Audio */}
              <TabsContent value="spatial-audio" className="mt-0">
                <div className="my-8">
                  <CosmicHeading level={2} align="center" withAccent>
                    Spatial Audio Experience
                  </CosmicHeading>
                  <CosmicText className="mt-2 text-center max-w-2xl mx-auto">
                    Immerse yourself in three-dimensional soundscapes designed to transport your consciousness.
                    Our spatial audio technology creates the sensation of sounds coming from different directions and distances.
                  </CosmicText>

                  <div className="mt-8">
                    <SpatialAudioExperience />
                  </div>

                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <CosmicCard>
                      <div className="p-6">
                        <CosmicHeading level={4}>What is Spatial Audio?</CosmicHeading>
                        <CosmicText className="mt-2">
                          Spatial audio creates the illusion of three-dimensional sound by carefully controlling how audio
                          reaches each ear. This allows sounds to appear as if they're coming from specific locations
                          in space around you, creating a more immersive experience.
                        </CosmicText>
                      </div>
                    </CosmicCard>

                    <CosmicCard>
                      <div className="p-6">
                        <CosmicHeading level={4}>Benefits</CosmicHeading>
                        <div className="mt-4 space-y-3">
                          <div>
                            <h5 className="font-medium text-purple-300">Enhanced Immersion</h5>
                            <p className="text-sm text-white/70">Creates a more engaging and present sound experience</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-indigo-300">Deeper Meditation</h5>
                            <p className="text-sm text-white/70">Helps with focus by creating a surround sound environment</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-300">Sound Healing</h5>
                            <p className="text-sm text-white/70">Allows for targeted frequency delivery to specific areas</p>
                          </div>
                        </div>
                      </div>
                    </CosmicCard>
                  </div>
                </div>
              </TabsContent>

              {/* Breath Sync */}
              <TabsContent value="breath-sync" className="mt-0">
                <div className="my-8">
                  <CosmicHeading level={2} align="center" withAccent>
                    Breath Synchronization
                  </CosmicHeading>
                  <CosmicText className="mt-2 text-center max-w-2xl mx-auto">
                    Harness the power of conscious breathing with our guided breath synchronization tool.
                    Customize breathing patterns and audio feedback to enhance your meditation practice.
                  </CosmicText>

                  <div className="mt-8">
                    <BreathSyncPlayer />
                  </div>

                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <CosmicCard>
                      <div className="p-6">
                        <CosmicHeading level={4}>The Science of Breathwork</CosmicHeading>
                        <CosmicText className="mt-2">
                          Controlled breathing directly influences your autonomic nervous system, helping to shift
                          between sympathetic (fight-or-flight) and parasympathetic (rest-and-digest) states.
                          Ancient traditions have understood the profound connection between breath and consciousness for millennia.
                        </CosmicText>
                      </div>
                    </CosmicCard>

                    <CosmicCard>
                      <div className="p-6">
                        <CosmicHeading level={4}>Key Benefits</CosmicHeading>
                        <div className="mt-4 space-y-3">
                          <div>
                            <h5 className="font-medium text-purple-300">Reduced Stress</h5>
                            <p className="text-sm text-white/70">Activates the parasympathetic nervous system to lower stress hormones</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-indigo-300">Improved Focus</h5>
                            <p className="text-sm text-white/70">Increases oxygen to the brain enhancing mental clarity and focus</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-300">Emotional Regulation</h5>
                            <p className="text-sm text-white/70">Creates space between stimulus and response for better self-regulation</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-teal-300">Better Sleep</h5>
                            <p className="text-sm text-white/70">Helps relax the body and mind for improved sleep quality</p>
                          </div>
                        </div>
                      </div>
                    </CosmicCard>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Additional Information */}
          <section className="mt-16 mb-16">
            <CosmicHeading level={2} align="center">
              The Science of Sound Healing
            </CosmicHeading>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <CosmicCard>
                <div className="p-6">
                  <CosmicHeading level={3}>Frequency & Consciousness</CosmicHeading>
                  <CosmicText className="mt-4">
                    Every object in the universe has a natural frequency at which it vibrates. 
                    Our consciousness responds to sound frequencies in powerful ways, especially when 
                    these frequencies align with natural biological and cosmic rhythms.
                  </CosmicText>
                </div>
              </CosmicCard>

              <CosmicCard>
                <div className="p-6">
                  <CosmicHeading level={3}>Entrainment</CosmicHeading>
                  <CosmicText className="mt-4">
                    Neural entrainment occurs when your brainwaves synchronize with external rhythmic stimuli.
                    Our audio tools harness this natural phenomenon to guide your brain toward specific states
                    of consciousness, from deep relaxation to heightened focus.
                  </CosmicText>
                </div>
              </CosmicCard>

              <CosmicCard>
                <div className="p-6">
                  <CosmicHeading level={3}>Sacred Acoustics</CosmicHeading>
                  <CosmicText className="mt-4">
                    Ancient traditions recognized the transformative power of sound. From Tibetan singing bowls
                    to Gregorian chants, sacred sound technologies have been used for millennia to alter consciousness
                    and facilitate healing. Our tools blend this ancient wisdom with modern acoustic science.
                  </CosmicText>
                </div>
              </CosmicCard>
            </div>
          </section>
        </div>
      </CosmicSection>
    </div>
  )
}