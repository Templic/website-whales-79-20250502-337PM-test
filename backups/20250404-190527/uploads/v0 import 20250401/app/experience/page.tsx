import { FrequencyVisualizer3D } from "@/components/frequency-visualizer-3d"
import { BinauralBeatGenerator } from "@/components/binaural-beat-generator"
import { VoiceControlledPlayer } from "@/components/voice-controlled-player"

export default function ExperiencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950">
      {/* Experience Header */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
              Interactive Experiences
            </h1>
            <p className="mt-4 text-white/80 max-w-xl mx-auto">
              Explore cutting-edge tools that bring cosmic healing frequencies to life through immersive visualizations,
              binaural beats, and voice-controlled interfaces.
            </p>
          </div>
        </div>
      </section>

      {/* 3D Frequency Visualizer */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">3D Frequency Visualizer</h2>
          <FrequencyVisualizer3D
            title="Root Chakra Alignment"
            frequency={396}
            chakra="Root Chakra (Muladhara)"
            chakraColor="#ff0000"
          />
          <div className="mt-6 text-center">
            <p className="text-white/70 max-w-2xl mx-auto">
              Experience the healing frequencies in a stunning 3D environment. The visualizer responds to the audio in
              real-time, creating unique patterns that represent the energy of each frequency.
            </p>
          </div>
        </div>
      </section>

      {/* Binaural Beat Generator */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Binaural Beat Generator</h2>
          <BinauralBeatGenerator />
          <div className="mt-6 text-center">
            <p className="text-white/70 max-w-2xl mx-auto">
              Create your own binaural beats to target specific brainwave states. Customize frequencies, wave types, and
              even sync with your heart rate for a personalized meditation experience.
            </p>
          </div>
        </div>
      </section>

      {/* Voice-Controlled Player */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Voice-Controlled Player</h2>
          <VoiceControlledPlayer />
          <div className="mt-6 text-center">
            <p className="text-white/70 max-w-2xl mx-auto">
              Control your music with simple voice commands. Play, pause, skip tracks, and adjust volume hands-free for
              an uninterrupted meditation experience.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-8 backdrop-blur-sm">
            <div className="grid gap-6 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Take Your Experience Further</h2>
                <p className="text-white/80">
                  Explore our full collection of cosmic healing frequencies and combine them with these interactive
                  tools for a transformative journey.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
                <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg border border-white/20">
                  Explore Music
                </button>
                <button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 px-6 py-3 rounded-lg">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

