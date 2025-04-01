import { useState } from 'react';
import { CosmicBackground } from '@/components/imported/CosmicBackground';
import { ParticleBackground } from '@/components/imported/ParticleBackground';
import { CosmicIcon } from '@/components/imported/CosmicIcons';
import { CosmicCard } from '@/components/imported/CosmicCard';
import { 
  CosmicParallax, 
  CosmicReveal, 
  CosmicMagnetic, 
  CosmicTextScramble 
} from '@/components/imported/CosmicInteractiveEffects';
import { 
  HexagonContainer,
  OctagonContainer,
  PentagonContainer,
  TriangleInterlockContainer,
  FlowerOfLifePattern,
  MetatronsCube,
  SacredGeometryBackground
} from '@/components/imported/SacredGeometry';

export default function CosmicComponentsDemo() {
  const [backgroundType, setBackgroundType] = useState<'cosmic' | 'particle'>('cosmic');

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      {backgroundType === 'cosmic' ? (
        <CosmicBackground opacity={0.8} />
      ) : (
        <ParticleBackground colorScheme="purple" density="medium" />
      )}

      {/* Sacred Geometry Background */}
      <SacredGeometryBackground />

      {/* Container */}
      <div className="container mx-auto px-4 py-20">
        <header className="mb-12 text-center">
          <CosmicTextScramble text="Cosmic Components Demo" className="text-3xl md:text-5xl font-bold text-white mb-4" />
          <p className="text-lg text-white/80 mb-6">
            Interactive demonstration of imported cosmic components
          </p>
          <div className="flex justify-center gap-4">
            <button 
              className={`px-4 py-2 rounded-full ${backgroundType === 'cosmic' ? 'bg-purple-600' : 'bg-purple-600/30'}`}
              onClick={() => setBackgroundType('cosmic')}
            >
              Cosmic Background
            </button>
            <button 
              className={`px-4 py-2 rounded-full ${backgroundType === 'particle' ? 'bg-blue-600' : 'bg-blue-600/30'}`}
              onClick={() => setBackgroundType('particle')}
            >
              Particle Background
            </button>
          </div>
        </header>

        {/* Icons */}
        <section className="mb-16">
          <CosmicReveal>
            <h2 className="text-2xl font-bold text-white mb-6">Cosmic Icons</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-4 justify-items-center">
              {Object.keys(cosmicIconNames).map(name => (
                <CosmicMagnetic key={name} className="flex flex-col items-center">
                  <div className="bg-purple-900/30 p-4 rounded-full mb-2">
                    <CosmicIcon name={name as any} size={32} className="text-white" />
                  </div>
                  <span className="text-xs text-white/70">{name}</span>
                </CosmicMagnetic>
              ))}
            </div>
          </CosmicReveal>
        </section>

        {/* Sacred Geometry */}
        <section className="mb-16">
          <CosmicReveal direction="up">
            <h2 className="text-2xl font-bold text-white mb-8">Sacred Geometry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <HexagonContainer glowColor="rgba(139, 92, 246, 0.8)" className="aspect-square">
                <h3 className="text-xl font-bold text-white mb-2">Hexagon</h3>
                <p className="text-white/80">Harmony and balance</p>
              </HexagonContainer>
              
              <OctagonContainer glowColor="rgba(20, 184, 166, 0.8)" className="aspect-square">
                <h3 className="text-xl font-bold text-white mb-2">Octagon</h3>
                <p className="text-white/80">Rebirth and transition</p>
              </OctagonContainer>
              
              <PentagonContainer glowColor="rgba(217, 70, 239, 0.8)" className="aspect-square">
                <h3 className="text-xl font-bold text-white mb-2">Pentagon</h3>
                <p className="text-white/80">Health and vitality</p>
              </PentagonContainer>

              <TriangleInterlockContainer glowColor="rgba(14, 165, 233, 0.8)" className="aspect-square">
                <h3 className="text-xl font-bold text-white mb-2">Triangle</h3>
                <p className="text-white/80">Ascension and balance</p>
              </TriangleInterlockContainer>
            </div>
          </CosmicReveal>
        </section>

        {/* Cards and Effects */}
        <section className="mb-16">
          <CosmicReveal direction="up">
            <h2 className="text-2xl font-bold text-white mb-8">Cosmic Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <CosmicParallax direction="y" speed={0.5}>
                <CosmicCard glowColor="rgba(139, 92, 246, 0.5)" className="h-full p-6">
                  <div className="text-center">
                    <CosmicIcon name="star" size={48} className="text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Parallax Effect</h3>
                    <p className="text-white/80">This card has a subtle parallax effect when you scroll</p>
                  </div>
                </CosmicCard>
              </CosmicParallax>
              
              <CosmicMagnetic strength={20}>
                <CosmicCard glowColor="rgba(14, 165, 233, 0.5)" className="h-full p-6">
                  <div className="text-center">
                    <CosmicIcon name="atom" size={48} className="text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Magnetic Effect</h3>
                    <p className="text-white/80">This card follows your cursor with a magnetic effect</p>
                  </div>
                </CosmicCard>
              </CosmicMagnetic>
              
              <CosmicCard glowColor="rgba(20, 184, 166, 0.5)" variant="outline" className="h-full p-6">
                <div className="text-center relative">
                  <MetatronsCube className="opacity-30" />
                  <CosmicIcon name="sparkles" size={48} className="text-teal-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Sacred Overlay</h3>
                  <p className="text-white/80">This card has a sacred geometry overlay pattern</p>
                </div>
              </CosmicCard>
            </div>
          </CosmicReveal>
        </section>
        
        {/* Reveal Effect Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Reveal Effects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {["up", "down", "left", "right"].map((direction, index) => (
              <CosmicReveal key={direction} direction={direction as any} delay={index * 0.1}>
                <CosmicCard 
                  glowColor={glowColors[index]} 
                  className="p-6"
                  delay={index * 0.1}
                >
                  <h3 className="text-xl font-bold text-white mb-2 text-center">
                    {direction.charAt(0).toUpperCase() + direction.slice(1)} Direction
                  </h3>
                  <p className="text-white/80 text-center">
                    This element reveals from the {direction} direction
                  </p>
                </CosmicCard>
              </CosmicReveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const cosmicIconNames = {
  waveform: true,
  waves: true,
  music: true,
  headphones: true,
  radio: true,
  mic: true,
  volume: true,
  mute: true,
  disc: true,
  sparkles: true,
  star: true,
  moon: true,
  sun: true,
  zap: true,
  orbit: true,
  satellite: true,
  rocket: true,
  atom: true
};

const glowColors = [
  "rgba(139, 92, 246, 0.5)",
  "rgba(14, 165, 233, 0.5)",
  "rgba(20, 184, 166, 0.5)",
  "rgba(236, 72, 153, 0.5)"
];