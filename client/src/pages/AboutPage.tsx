/**
 * AboutPage.tsx
 * 
 * Revamped with sacred geometry and sound themes.
 */
import { useEffect, useState } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import GeometricSection from "@/components/cosmic/GeometricSection";
import { Play, Pause, Music, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <h1 className="text-5xl font-nebula font-bold text-[#00ebd6] mb-6 cosmic-float">About</h1>

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

        {/* Biography Section with geometric shape */}
        <GeometricSection 
          shape="hexagon"
          backgroundStyle="gradient"
          title="Cosmic Biography"
          className="mb-16 cosmic-slide-up"
          decorative={true}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center p-8">
            <div className="relative rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
              <div className="absolute -top-5 -left-5 z-10">
                <SacredGeometry 
                  type="pentagon-star" 
                  size={60} 
                  color="#fe0064" 
                />
              </div>
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

            <div className="space-y-4 order-1 md:order-2">
              <div className="flex items-center mb-4">
                <Music className="w-6 h-6 text-[#00ebd6] mr-2" />
                <h3 className="text-2xl font-bold text-[#00ebd6]">Sonic Explorer</h3>
              </div>
              <p className="text-xl leading-relaxed">Dale the Whale is an innovative musician whose sounds traverse the cosmic depths and tropical shores of our imagination. Blending celestial synths with organic rhythms, Dale creates a unique auditory experience that transports listeners to vibrant new dimensions.</p>
              <p className="text-xl leading-relaxed">Born under starry skies and raised with a deep connection to the ocean, Dale's musical journey has been shaped by both the mysteries of the cosmos and the fluid, graceful nature of marine life. This duality is reflected in every note, every beat, and every lyric of his transformative compositions.</p>
              <p className="text-xl leading-relaxed">With influences ranging from cosmic jazz to tropical ambient, Dale continues to push boundaries and explore new sonic territories, creating immersive soundscapes that resonate with the rhythm of the universe.</p>
            </div>
          </div>
        </GeometricSection>

        {/* Community Engagement section with unique geometric shape */}
        <GeometricSection
          shape="pentagon"
          backgroundStyle="glass"
          title="Cosmic Community Engagement"
          className="mb-16 shadow-glow-cosmic mt-10 pt-4"
          decorative={true}
        >
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6 mt-4">
              <Volume2 className="w-6 h-6 text-[#fe0064]" />
              <p className="text-xl">Dale is not only known for his innovative sound but also for his dedication to the community. He actively collaborates with like-minded artists and participates in community projects aimed at spreading creative energy and healing positivity.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl border border-[rgba(0,235,214,0.3)] backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                  <SacredGeometry type="metatron-cube" size={100} color="#00ebd6" />
                </div>
                <h3 className="text-xl font-bold text-[#00ebd6] mb-4 relative z-10 text-shadow-lg">Harmonizing With Others</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-[#fe0064] mr-2 mt-1">★</span>
                    <span>Collaborative music projects with emerging and established artists, creating cosmic jams that transcend traditional boundaries.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#fe0064] mr-2 mt-1">★</span>
                    <span>Immersive workshops and masterclasses aimed at nurturing local talent, where participants learn to channel their inner celestial creativity.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl border border-[rgba(0,235,214,0.3)] backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                  <SacredGeometry type="golden-spiral" size={100} color="#00ebd6" />
                </div>
                <h3 className="text-xl font-bold text-[#00ebd6] mb-4 relative z-10 text-shadow-lg">Resonating With Purpose</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-[#fe0064] mr-2 mt-1">★</span>
                    <span>Benefit concerts under the stars, with proceeds supporting ocean conservation and community development initiatives.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#fe0064] mr-2 mt-1">★</span>
                    <span>Interactive digital experiences where fans can share their stories and connect through the universal language of music.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center relative mt-16">
              <div className="absolute left-1/2 -translate-x-1/2 -top-12 opacity-30">
                <SacredGeometry type="vesica-piscis" size={80} color="#fe0064" />
              </div>
              <p className="text-xl max-w-3xl mx-auto relative z-10">Through these initiatives, Dale the Whale continues to foster a creative and inclusive environment that empowers individuals and celebrates the transformative power of music. His community-centered approach reflects his belief that music, like the cosmic forces that inspire it, has the power to unite, heal, and inspire across all boundaries.</p>
            </div>
          </div>
        </GeometricSection>
        
        {/* Artistic Journey image section */}
        <div className="mb-16 mt-10 cosmic-fade-in">
          <h2 className="text-3xl font-bold text-[#00ebd6] mb-8 text-center">Artistic Journey</h2>
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

        {/* Sound Philosophy section with geometric shapes */}
        <GeometricSection
          shape="wave"
          backgroundStyle="gradient"
          title="Sound Philosophy"
          className="mb-16 cosmic-slide-up"
        >
          <div className="grid md:grid-cols-3 gap-4 p-8">
            <div className="cosmic-glow-box p-6 rounded-lg text-center flex flex-col items-center">
              <SacredGeometry type="flower-of-life" size={80} color="#00ebd6" />
              <h3 className="text-xl font-bold text-[#00ebd6] my-4">Harmonic Unity</h3>
              <p>Sound frequencies that align with the natural harmonics of the universe, creating resonance between listener and cosmos.</p>
            </div>

            <div className="cosmic-glow-box p-6 rounded-lg text-center flex flex-col items-center">
              <SacredGeometry type="metatron-cube" size={80} color="#fe0064" />
              <h3 className="text-xl font-bold text-[#00ebd6] my-4">Geometric Rhythms</h3>
              <p>Structured patterns of sound that mirror sacred geometry, forming mathematical relationships that speak to our deepest consciousness.</p>
            </div>

            <div className="cosmic-glow-box p-6 rounded-lg text-center flex flex-col items-center">
              <SacredGeometry type="sri-yantra" size={80} color="#00ebd6" />
              <h3 className="text-xl font-bold text-[#00ebd6] my-4">Oceanic Flow</h3>
              <p>Fluid, evolving soundscapes inspired by the rhythmic movements of ocean waves and the mysterious songs of whales.</p>
            </div>
          </div>
        </GeometricSection>
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