import { useState } from 'react';
import { BinauralBeatGenerator } from '@/components/imported/audio/BinauralBeatGenerator';
import { BreathSyncPlayer } from '@/components/imported/audio/BreathSyncPlayer';
import { ParticleBackground } from '@/components/imported/ParticleBackground';
import { CosmicCard } from '@/components/imported/CosmicCard';
import { CosmicReveal } from '@/components/imported/CosmicInteractiveEffects';

export default function AudioComponentsDemo() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <ParticleBackground colorScheme="blue" density="low" />

      {/* Container */}
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-cosmic">
            Cosmic Audio Components
          </h1>
          <p className="text-lg text-white/80 mb-6">
            Interactive audio tools for frequency healing and breathwork
          </p>
        </header>

        <div className="space-y-12">
          <CosmicReveal>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Binaural Beat Generator</h2>
              <div className="rounded-lg overflow-hidden">
                <BinauralBeatGenerator 
                  defaultLeftFreq={200}
                  defaultRightFreq={208}
                  defaultVolume={50}
                  defaultWaveType="sine"
                  defaultPreset="Relaxation"
                />
              </div>
              <CosmicCard className="mt-4 p-4">
                <div className="text-white/80 text-sm">
                  <h3 className="text-white font-medium mb-2">How Binaural Beats Work</h3>
                  <p>
                    When two slightly different frequencies are played in each ear separately, your brain creates a third tone—the binaural beat. This "phantom" frequency is the mathematical difference between the two tones, and can help entrain brainwaves to specific states.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/20 p-2 rounded">
                      <strong className="text-blue-400">Delta (0.5-4Hz):</strong> Deep sleep, healing
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <strong className="text-purple-400">Theta (4-8Hz):</strong> Meditation, creativity
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <strong className="text-teal-400">Alpha (8-12Hz):</strong> Relaxation, calmness
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <strong className="text-amber-400">Beta (12-30Hz):</strong> Focus, alertness
                    </div>
                  </div>
                </div>
              </CosmicCard>
            </section>
          </CosmicReveal>

          <CosmicReveal delay={0.2}>
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Breath Synchronization Player</h2>
              <div className="rounded-lg overflow-hidden">
                <BreathSyncPlayer defaultVolume={70} />
              </div>
              <CosmicCard className="mt-4 p-4" glowColor="rgba(14, 165, 233, 0.5)">
                <div className="text-white/80 text-sm">
                  <h3 className="text-white font-medium mb-2">Benefits of Breath Synchronization</h3>
                  <p>
                    Synchronizing your breath with sound is a powerful way to deepen your meditative practice. Research shows that conscious breathing combined with sound therapy can reduce stress, improve focus, and enhance the overall healing experience.
                  </p>
                  <div className="mt-3">
                    <p className="text-blue-300 font-medium">Tips for Practice:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1 text-white/70">
                      <li>Find a quiet place where you won't be disturbed</li>
                      <li>Use headphones for the best binaural beat experience</li>
                      <li>Start with shorter sessions (5-10 minutes) and gradually increase</li>
                      <li>Try different breathing patterns to see what works best for you</li>
                    </ul>
                  </div>
                </div>
              </CosmicCard>
            </section>
          </CosmicReveal>
        </div>
      </div>
    </div>
  );
}