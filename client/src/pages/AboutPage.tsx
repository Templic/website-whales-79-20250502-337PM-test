/**
 * AboutPage.tsx
 * 
 * Revamped with sacred geometry and sound themes.
 * Updated to use the new responsive geometric shapes.
 */
import { useEffect, useState } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import { Play, Pause, Music, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import geometric shape components from the responsive demo
import { 
  SimpleHexagon, 
  SimpleOctagon,
  SimpleCircle,
  SimpleStarburst
} from '../components/cosmic/SimpleGeometry';

export default function AboutPage() {
  useEffect(() => {
    document.title = "About - Dale Loves Whales";
  }, []);

  const [audioPlaying, setAudioPlaying] = useState(false);

  // Simulated audio control - in a real implementation this would connect to actual audio
  const toggleAudio = () => {
    setAudioPlaying(!audioPlaying);
  };

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="cosmic-heading-responsive-lg font-nebula font-bold text-[#00ebd6] mb-6 cosmic-float text-center">About</h1>

        {/* Sacred geometry decoration - floating in background */}
        <div className="fixed top-20 right-10 opacity-20 z-0 cosmic-pulse hidden lg:block">
          <SacredGeometry 
            type="flower-of-life" 
            size={200} 
            color="#00ebd6" 
            animate={true} 
          />
        </div>

        <div className="fixed bottom-20 left-10 opacity-20 z-0 cosmic-pulse hidden lg:block">
          <SacredGeometry 
            type="sri-yantra" 
            size={180} 
            color="#fe0064" 
            animate={true} 
          />
        </div>

        {/* Biography Section using SimpleHexagon */}
        <div className="mb-16 cosmic-slide-up">
          <div className="mx-auto max-w-[650px]">
            <SimpleHexagon className="w-full">
              <h3>Cosmic Biography</h3>
              <p>Dale the Whale is an innovative musician whose sounds traverse the cosmic depths and tropical shores of our imagination. Blending celestial synths with organic rhythms, Dale creates a unique auditory experience that transports listeners to vibrant new dimensions.</p>
              <button 
                onClick={toggleAudio} 
                className="bg-blue-500 hover:bg-blue-700 text-white rounded"
              >
                {audioPlaying ? 'Pause Music' : 'Play Music'}
              </button>
            </SimpleHexagon>
          </div>
        </div>

        {/* Central image with audio controls */}
        <div className="mx-auto mb-12 px-4 relative" style={{ maxWidth: "min(85%, 700px)" }}>
          <div className="relative rounded-xl overflow-hidden shadow-2xl w-full">
            <img
              src="/images/dale-with-flowers-and-staff.jpg"
              alt="Dale the Whale portrait with cosmic overlay"
              className="w-full h-auto relative z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(254,0,100,0.3)] to-[rgba(0,235,214,0.3)]" />

            <div className="absolute bottom-4 right-4 z-10 backdrop-blur-sm bg-black/40 rounded-full p-2">
              <Button 
                onClick={toggleAudio} 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-[#00ebd6]/20 text-white hover:bg-[#00ebd6]/40"
              >
                {audioPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
            </div>

            {/* Audio waveform visualization (simulated) */}
            <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end justify-center z-10 px-4">
              <div className={cn("audio-bar h-1 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-1" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-4 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-2" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-2 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-3" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-6 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-4" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-3 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-5" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-5 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-1" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-7 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-2" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-2 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-3" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-4 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-4" : "")} style={{width: "3px"}}></div>
              <div className={cn("audio-bar h-6 bg-[#00ebd6] mx-0.5 rounded-full", audioPlaying ? "animate-sound-bar-5" : "")} style={{width: "3px"}}></div>
            </div>
          </div>
        </div>

        {/* Artist journey details section with grid of geometric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Sonic Explorer */}
          <div className="w-full">
            <SimpleOctagon className="w-full max-w-[350px] mx-auto">
              <h3>Sonic Explorer</h3>
              <p>Born under starry skies and raised with a deep connection to the ocean, Dale's musical journey has been shaped by both the mysteries of the cosmos and the fluid, graceful nature of marine life.</p>
              <button className="bg-purple-500 hover:bg-purple-700 text-white rounded">
                Learn More
              </button>
            </SimpleOctagon>
          </div>

          {/* Musical Style */}
          <div className="w-full">
            <SimpleCircle className="w-full max-w-[350px] mx-auto">
              <h3>Musical Style</h3>
              <p>This duality is reflected in every note, every beat, and every lyric of his transformative compositions. With influences ranging from cosmic jazz to tropical ambient, Dale creates soundscapes that resonate with the universe.</p>
              <button className="bg-teal-500 hover:bg-teal-700 text-white rounded">
                Listen
              </button>
            </SimpleCircle>
          </div>

          {/* Community Engagement */}
          <div className="w-full">
            <SimpleOctagon className="w-full max-w-[350px] mx-auto">
              <h3>Community Engagement</h3>
              <p>Dale is not only known for his innovative sound but also for his dedication to the community. He actively collaborates with like-minded artists and participates in projects aimed at spreading creative energy.</p>
              <button className="bg-red-500 hover:bg-red-700 text-white rounded">
                Connect
              </button>
            </SimpleOctagon>
          </div>
        </div>

        {/* Harmonizing & Resonating section */}
        <div className="mb-16 shadow-glow-cosmic mt-10 pt-4">
          <h2 className="cosmic-heading-responsive font-bold text-[#00ebd6] mb-8 text-center">Harmonizing With Others</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl border border-[rgba(0,235,214,0.3)] backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10">
                <SacredGeometry type="metatron-cube" size={100} color="#00ebd6" />
              </div>
              <h3 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6] mb-4 relative z-10 text-shadow-lg">Harmonizing With Others</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#fe0064] mr-2 mt-1">★</span>
                  <span className="cosmic-text-responsive-sm">Collaborative music projects with emerging and established artists, creating cosmic jams that transcend traditional boundaries.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#fe0064] mr-2 mt-1">★</span>
                  <span className="cosmic-text-responsive-sm">Immersive workshops and masterclasses aimed at nurturing local talent, where participants learn to channel their inner celestial creativity.</span>
                </li>
              </ul>
            </div>

            <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl border border-[rgba(0,235,214,0.3)] backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10">
                <SacredGeometry type="golden-spiral" size={100} color="#00ebd6" />
              </div>
              <h3 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6] mb-4 relative z-10 text-shadow-lg">Resonating With Purpose</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#fe0064] mr-2 mt-1 flex-shrink-0">★</span>
                  <span className="cosmic-text-responsive-sm">Benefit concerts under the stars, with proceeds supporting ocean conservation and community development initiatives.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#fe0064] mr-2 mt-1 flex-shrink-0">★</span>
                  <span className="cosmic-text-responsive-sm">Interactive digital experiences where fans can share their stories and connect through the universal language of music.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Artistic Journey image section */}
        <div className="mb-16 mt-10 cosmic-fade-in">
          <h2 className="cosmic-heading-responsive font-bold text-[#00ebd6] mb-8 text-center">Artistic Journey</h2>
          <div className="relative rounded-xl overflow-hidden shadow-lg max-w-3xl mx-auto">
            <img
              src="/images/dale-with-flowers-and-staff.jpg"
              alt="Dale's artistic journey"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(0,0,0,0.7)] to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Cosmic Connections</h3>
              <p className="text-white drop-shadow-md">Exploring the intersection of music, nature, and spiritual awakening through Dale's unique sonic vision.</p>
            </div>
          </div>
        </div>

        {/* Sound Philosophy section with responsive shape cards */}
        <div className="mb-16 mt-16">
          <h2 className="cosmic-heading-responsive font-bold text-[#00ebd6] mb-8 text-center">Sound Philosophy</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="w-full">
              <SimpleHexagon className="w-full max-w-[280px] mx-auto">
                <h3>Harmonic Unity</h3>
                <p>Sound frequencies that align with the natural harmonics of the universe, creating resonance between listener and cosmos.</p>
                <button className="bg-blue-500 hover:bg-blue-700 text-white rounded">
                  Experience
                </button>
              </SimpleHexagon>
            </div>

            <div className="w-full">
              <SimpleHexagon className="w-full max-w-[280px] mx-auto">
                <h3>Geometric Rhythms</h3>
                <p>Structured patterns of sound that mirror sacred geometry, forming mathematical relationships that speak to our deepest consciousness.</p>
                <button className="bg-green-500 hover:bg-green-700 text-white rounded">
                  Discover
                </button>
              </SimpleHexagon>
            </div>

            <div className="w-full">
              <SimpleHexagon className="w-full max-w-[280px] mx-auto">
                <h3>Oceanic Flow</h3>
                <p>Fluid, evolving soundscapes inspired by the rhythmic movements of ocean waves and the mysterious songs of whales.</p>
                <button className="bg-yellow-500 hover:bg-yellow-700 text-white rounded">
                  Flow
                </button>
              </SimpleHexagon>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations for audio visualization */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes sound-bar-1 {
          0%, 100% { height: 3px; }
          50% { height: 12px; }
        }
        @keyframes sound-bar-2 {
          0%, 100% { height: 5px; }
          50% { height: 15px; }
        }
        @keyframes sound-bar-3 {
          0%, 100% { height: 7px; }
          50% { height: 18px; }
        }
        @keyframes sound-bar-4 {
          0%, 100% { height: 4px; }
          50% { height: 10px; }
        }
        @keyframes sound-bar-5 {
          0%, 100% { height: 6px; }
          50% { height: 14px; }
        }

        .animate-sound-bar-1 {
          animation: sound-bar-1 0.9s ease-in-out infinite;
        }
        .animate-sound-bar-2 {
          animation: sound-bar-2 1.1s ease-in-out infinite;
        }
        .animate-sound-bar-3 {
          animation: sound-bar-3 0.7s ease-in-out infinite;
        }
        .animate-sound-bar-4 {
          animation: sound-bar-4 1.3s ease-in-out infinite;
        }
        .animate-sound-bar-5 {
          animation: sound-bar-5 0.8s ease-in-out infinite;
        }
      `}} />
    </>
  );
}