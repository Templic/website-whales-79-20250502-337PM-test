/**
 * HomePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 * Updated to use the new responsive geometric shapes.
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UsersRound, BarChart3 } from "lucide-react";
import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import { DynamicContent } from "@/components/content";
import { createDynamicComponent } from "@/lib/bundle-optimization";
import { MainHeader } from "@/components/layout/MainHeader"; // Added import for MainHeader

// Import geometric shape components from the responsive demo
import { 
  SimpleHexagon, 
  SimpleTriangle,
  SimpleInvertedTriangle,
  SimpleCircle,
  SimpleOctagon
} from '../components/cosmic/SimpleGeometry';

export default function HomePage() {
  useEffect(() => {
    document.title = "Home - Dale Loves Whales";
  }, []);

  return (
    <>
      <MainHeader /> {/* Added MainHeader component */}
      <SpotlightEffect />
      <div className="container mx-auto px-0 py-4 max-w-[1600px]">

        {/* Hero Section */}
        <section className="hero min-h-[90vh] relative flex items-center justify-center text-center text-white mb-8">
          <div className="w-full max-w-[1200px] mx-auto">
            <SimpleHexagon className="w-full max-w-[800px] mx-auto" glowColor="rgba(255, 65, 105, 0.6)">
              <h1 className="cosmic-heading-responsive-lg mb-6 text-shadow shadow-[#fe0064] animate-cosmic font-almendra leading-tight px-4 whitespace-normal text-[#e15554]">
                <DynamicContent 
                  contentKey="home-hero-heading" 
                  fallback="🌊 Ride the Cosmic Wave 🌌"
                  page="home"
                  section="hero" 
                />
              </h1>
              <p className="cosmic-text-responsive mb-8 max-w-[800px] mx-auto leading-relaxed font-cormorant px-4 whitespace-normal text-[#00ebd6]">
                <DynamicContent 
                  contentKey="home-hero-description" 
                  fallback="🐋 Immerse yourself in the sonic universe of Dale Loves Whales 🎵 Experience the vibe, explore the depths, and join us on a journey through sound and consciousness ✨"
                  page="home"
                  section="hero" 
                />
              </p>
              <button 
                onClick={() => window.location.href = '/archived-music'} 
                className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white rounded"
              >
                <DynamicContent 
                  contentKey="home-hero-cta" 
                  fallback="Explore Music"
                  page="home"
                  section="hero" 
                />
              </button>
            </SimpleHexagon>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* About Section */}
            <div className="w-full">
              <SimpleTriangle className="w-full max-w-[350px] mx-auto">
                <h3>
                  <DynamicContent 
                    contentKey="home-activity-title" 
                    fallback="Ideal Activity"
                    page="home"
                    section="activity" 
                  />
                </h3>
                <p>
                  <DynamicContent 
                    contentKey="home-activity-description" 
                    fallback="🌟 Dale Loves Whales blends cosmic rhythms with tropical soul 🌴 Dive deep into his musical journey that bridges the stars with the ocean's depths 🌊"
                    page="home"
                    section="activity" 
                  />
                </p>
                <button 
                  onClick={() => window.location.href = '/about'} 
                  className="bg-blue-500 hover:bg-blue-700 text-white rounded"
                >
                  Learn More
                </button>
              </SimpleTriangle>
            </div>

            {/* Vibes Section */}
            <div className="w-full">
              <SimpleOctagon className="w-full max-w-[350px] mx-auto">
                <h3>
                  <DynamicContent 
                    contentKey="home-vibes-title" 
                    fallback="Cosmic Sound Vibes"
                    page="home"
                    section="vibes" 
                  />
                </h3>
                <p>
                  <DynamicContent 
                    contentKey="home-vibes-description" 
                    fallback="From live performances to collaborative projects, Dale brings a unique sound experience infused with retro-futuristic beats, fluid tropical notes, and immersive visuals."
                    page="home"
                    section="vibes" 
                  />
                </p>
                <button 
                  onClick={() => window.location.href = '/immersive'} 
                  className="bg-purple-500 hover:bg-purple-700 text-white rounded"
                >
                  Explore
                </button>
              </SimpleOctagon>
            </div>

            {/* Journey Section */}
            <div className="w-full">
              <SimpleCircle className="w-full max-w-[350px] mx-auto">
                <h3>
                  <DynamicContent 
                    contentKey="home-journey-title" 
                    fallback="Explore The Journey"
                    page="home"
                    section="journey" 
                  />
                </h3>
                <p>
                  <DynamicContent 
                    contentKey="home-journey-description" 
                    fallback="💫 Join the cosmic voyage and become part of the ever-growing community of cosmic explorers and music lovers 💖"
                    page="home"
                    section="journey" 
                  />
                </p>
                <button 
                  onClick={() => window.location.href = '/cosmic-connectivity'} 
                  className="bg-teal-500 hover:bg-teal-700 text-white rounded"
                >
                  <DynamicContent 
                    contentKey="home-journey-button-cosmic" 
                    fallback="Cosmic Experience"
                    page="home"
                    section="journey" 
                  />
                </button>
              </SimpleCircle>
            </div>
          </div>

          {/* Additional Links Section */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="w-[200px]">
              <SimpleInvertedTriangle className="w-full">
                <h3>New Music</h3>
                <p>Experience our latest sonic creations and explore new sound journeys.</p>
                <button 
                  onClick={() => window.location.href = '/music-release'} 
                  className="bg-green-500 hover:bg-green-700 text-white rounded"
                >
                  <DynamicContent 
                    contentKey="home-journey-button-music" 
                    fallback="New Music"
                    page="home"
                    section="journey" 
                  />
                </button>
              </SimpleInvertedTriangle>
            </div>

            <div className="w-[200px]">
              <SimpleInvertedTriangle className="w-full">
                <h3>Tour Dates</h3>
                <p>Find out when and where you can experience our cosmic performances live.</p>
                <button 
                  onClick={() => window.location.href = '/tour'} 
                  className="bg-amber-500 hover:bg-amber-700 text-white rounded"
                >
                  <DynamicContent 
                    contentKey="home-journey-button-tour" 
                    fallback="Tour Dates"
                    page="home"
                    section="journey" 
                  />
                </button>
              </SimpleInvertedTriangle>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}