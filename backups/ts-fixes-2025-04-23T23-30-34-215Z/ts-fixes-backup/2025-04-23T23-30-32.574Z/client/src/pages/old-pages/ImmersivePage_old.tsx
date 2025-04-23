/**
 * ImmersivePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */import React from "react";

import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { ImmersiveHeader } from "@/components/immersive/ImmersiveHeader";
import { FrequencyAttunementChamber } from "@/components/immersive/FrequencyAttunementChamber";
import { BreathSynchronizationCeremony } from "@/components/immersive/BreathSynchronizationCeremony";
import { MultidimensionalSoundJourney } from "@/components/immersive/MultidimensionalSoundJourney";
import { CosmicButton } from "@/components/features/cosmic/CosmicButton";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function ImmersivePage_old() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-900 relative">
      <CosmicBackground />

      {/* Immersive Header */}
      <ImmersiveHeader
        title="Cosmic Consciousness Portal"
        description="Explore our collection of consciousness-expanding tools designed to deepen your connection with healing frequencies through personalization, breath synchronization, and spatial audio."
      />

      {/* Frequency Attunement Chamber */}
      <div className="container mx-auto py-10 md:py-12 px-4">
        <h2 className="text-2xl font-semibold mb-6 text-white">Frequency Attunement Chamber</h2>
        <FrequencyAttunementChamber />
        <div className="mt-4 text-center">
          <p className="text-gray-300 max-w-2xl mx-auto">
            Attune your consciousness to specific vibrational states. The chamber adapts to your energetic needs and
            allows you to blend environmental resonances for a more immersive experience.
          </p>
        </div>
      </div>

      {/* Breath Synchronization Ceremony */}
      <div className="container mx-auto py-10 md:py-12 px-4 bg-gradient-to-r from-black/40 via-transparent to-black/40">
        <h2 className="text-2xl font-semibold mb-6 text-white">Breath Synchronization Ceremony</h2>
        <BreathSynchronizationCeremony />
        <div className="mt-4 text-center">
          <p className="text-gray-300 max-w-2xl mx-auto">
            Harmonize your life force with cosmic rhythms. Choose from ancient breathing patterns or create your own
            sacred rhythm to deepen your connection with universal consciousness.
          </p>
        </div>
      </div>

      {/* Multidimensional Sound Journey */}
      <div className="container mx-auto py-10 md:py-12 px-4">
        <h2 className="text-2xl font-semibold mb-6 text-white">Multidimensional Sound Journey</h2>
        <MultidimensionalSoundJourney />
        <div className="mt-4 text-center">
          <p className="text-gray-300 max-w-2xl mx-auto">
            Experience healing frequencies across dimensions. Sound spirals around your consciousness, creating a portal
            to deeper states of awareness and cosmic connection.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto py-10 md:py-12 px-4 bg-gradient-to-r from-black/40 via-transparent to-black/40">
        <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
          <div className="grid gap-4 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-3 text-white">Expand Your Cosmic Journey</h2>
              <p className="text-gray-300">
                Integrate these consciousness tools with our full collection of cosmic healing frequencies for a
                transformative experience aligned with your highest vibration.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-end">
              <Link
                href="/cosmic-experience"
                onClick={(e) => { e.preventDefault(); window.location.href = '/cosmic-experience'; }}
              >
                <CosmicButton variant="secondary">
                  Explore Experiences
                </CosmicButton>
              </Link>
              <Link
                href="/cosmic-experience"
                onClick={(e) => { e.preventDefault(); window.location.href = '/cosmic-experience'; }}
              >
                <CosmicButton 
                  variant="primary"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Begin Transformation
                </CosmicButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}