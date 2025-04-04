/**
 * HomePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UsersRound, BarChart3 } from "lucide-react";
import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import GeometricSection from "@/components/cosmic/GeometricSection";

export default function HomePage() {
  useEffect(() => {
    document.title = "Home - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        

        {/* Hero Section */}
        <section className="hero min-h-[90vh] relative flex items-center justify-center text-center text-white mb-8 border-t-4 border-[#00ebd6]"
          style={{
            background: `linear-gradient(rgba(48, 52, 54, 0.7), rgba(10, 50, 92, 0.8)),
              url(https://onlyinhawaii.org/wp-content/uploads/2011/03/Rainbow-Falls.jpg)
              no-repeat center center / cover`
          }}>
          <div className="hero-content relative z-10 max-w-[800px] p-8">
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] mb-4 text-shadow shadow-[#fe0064] animate-cosmic">
              Ride the Cosmic Wave
            </h1>
            <p className="text-[clamp(1rem,2.5vw,1.5rem)] mb-8">
              Immerse yourself in the sonic universe of Dale Loves Whales. Experience the vibe, explore the depths.
            </p>
            <p className="text-[clamp(1rem,2.5vw,1.5rem)] mb-8">
              Immerse yourself in the sonic universe of Dale Loves Whales. Experience the vibe, explore the depths.
            </p>
            <Link href="/music"
              className="cta-button bg-[#00ebd6] text-[#303436] px-8 py-3 text-xl rounded-[50px] border-none
                cursor-pointer transition-colors duration-300 hover:bg-[#fe0064] hover:text-white
                shadow-[0_0_15px_#00ebd6] hover:shadow-[0_0_20px_#fe0064] inline-block">
              Explore Music
            </Link>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-[1200px] mx-auto px-4 py-8">
          {/* About Section */}
          <GeometricSection
            variant="secondary"
            shape="diamond"
            title="Ideal Activity"
            alignment="center"
            className="mb-16 px-8 py-12 mx-auto max-w-[90%]"
          >
            <div className="max-w-[80%] mx-auto">
              <p className="text-xl leading-relaxed">
                Dale Loves Whales blends cosmic rhythms with tropical soul. Dive deep into his musical journey that bridges the stars with the ocean's depths.
              </p>
            </div>
          </GeometricSection>

          {/* Services Section */}
          <GeometricSection
            variant="cosmic"
            shape="hexagon" 
            title="Cosmic Sound Vibes"
            alignment="center"
            className="mb-16 px-8 py-12 mx-auto max-w-[90%]"
          >
            <div className="max-w-[80%] mx-auto">
              <p className="text-xl leading-relaxed">
                From live performances to collaborative projects, Dale brings a unique sound experience infused with retro-futuristic beats, fluid tropical notes, and immersive visuals.
              </p>
            </div>
          </GeometricSection>
          
          {/* Explore The Journey Section - with more symmetric rectangular shape like the reference image */}
          <GeometricSection
            variant="cosmic"
            shape="rectangular" 
            title="Explore The Journey"
            alignment="center"
            className="mb-16 mx-auto max-w-[90%]"
            textContained={true}
            backgroundStyle="dark"
          >
            <div className="max-w-[80%] mx-auto">
              <p className="text-xl leading-relaxed mb-6 text-[#00ebd6]">
                Join the cosmic voyage and become part of the ever-growing community of cosmic explorers and music lovers.
              </p>
              <div className="flex justify-center gap-6 flex-wrap">
                <Link href="/music-release">
                  <Button variant="outline" className="text-[#00ebd6] border-[#00ebd6] hover:bg-[#00ebd6]/20 min-w-[160px]">
                    New Releases
                  </Button>
                </Link>
                <Link href="/tour">
                  <Button variant="outline" className="text-[#7c3aed] border-[#7c3aed] hover:bg-[#7c3aed]/20 min-w-[160px]">
                    Tour Dates
                  </Button>
                </Link>
                <Link href="/cosmic-experience">
                  <Button variant="outline" className="text-[#e15554] border-[#e15554] hover:bg-[#e15554]/20 min-w-[160px]">
                    Cosmic Experience
                  </Button>
                </Link>
              </div>
            </div>
          </GeometricSection>
        </main>
      </div>
    </>
  );
}