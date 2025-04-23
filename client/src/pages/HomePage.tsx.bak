/**
 * HomePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */import React from "react";
import React from "react";

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UsersRound, BarChart3 } from "lucide-react";
import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import GeometricSection from "@/components/cosmic/GeometricSection.simplified";
import { DynamicContent } from "@/components/content";
import { createDynamicComponent } from "@/lib/bundle-optimization";

export default function HomePage() {
  useEffect(() => {
    document.title = "Home - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">


        {/* Hero Section */}
        <section className="hero min-h-[90vh] relative flex items-center justify-center text-center text-white mb-8">
          <GeometricSection
            variant="cosmic"
            shape="hexagon"
            alignment="center"
            backgroundStyle="glass"
            className="hero-content relative z-10 max-w-[800px]"
          >
            <h1 className="cosmic-heading-responsive-lg mb-6 text-shadow shadow-[#fe0064] animate-cosmic font-almendra leading-tight px-4 whitespace-normal text-[#e15554]">
              <DynamicContent 
                contentKey="home-hero-heading" 
                fallback="🌊 Ride the Cosmic Wave 🌌"
                page="home"
                section="hero" 
              />
            </h1>
            <div className="cosmic-text-responsive mb-8 max-w-[800px] mx-auto leading-relaxed font-cormorant px-4 whitespace-normal text-[#00ebd6]">
              <DynamicContent 
                contentKey="home-hero-description" 
                fallback="🐋 Immerse yourself in the sonic universe of Dale Loves Whales 🎵 Experience the vibe, explore the depths, and join us on a journey through sound and consciousness ✨"
                page="home"
                section="hero" 
              />
            </div>
            <Link href="/archived-music"
              className="cta-button bg-[#00ebd6] text-[#303436] px-8 py-3 text-xl rounded-[50px] border-none
                cursor-pointer transition-colors duration-300 hover:bg-[#fe0064] hover:text-white
                shadow-[0_0_15px_#00ebd6] hover:shadow-[0_0_20px_#fe0064] inline-block">
              <DynamicContent 
                contentKey="home-hero-cta" 
                fallback="Explore Music"
                page="home"
                section="hero" 
              />
            </Link>
          </GeometricSection>
        </section>

        {/* Main Content */}
        <main className="max-w-[1200px] mx-auto px-4 py-8">
          {/* About Section */}
          <GeometricSection
            variant="cosmic"
            shape="diamond"
            title={
              <DynamicContent 
                contentKey="home-activity-title" 
                fallback="Ideal Activity"
                page="home"
                section="activity" 
              />
            }
            alignment="center"
            backgroundStyle="gradient"
            className="mb-16 px-8 py-12 mx-auto max-w-[90%] overflow-hidden"
          >
            <div className="max-w-[90%] md:max-w-[80%] mx-auto cosmic-padding-responsive relative z-10">
              <div className="cosmic-text-responsive font-cormorant whitespace-normal text-[#00ebd6]">
                <DynamicContent 
                  contentKey="home-activity-description" 
                  fallback="🌟 Dale Loves Whales blends cosmic rhythms with tropical soul 🌴 Dive deep into his musical journey that bridges the stars with the ocean's depths 🌊"
                  page="home"
                  section="activity" 
                />
              </div>
            </div>
          </GeometricSection>

          {/* Services Section */}
          <GeometricSection
            variant="cosmic"
            shape="hexagon" 
            title={
              <DynamicContent 
                contentKey="home-vibes-title" 
                fallback="Cosmic Sound Vibes"
                page="home"
                section="vibes" 
              />
            }
            alignment="center"
            className="mb-16 px-8 py-12 mx-auto max-w-[90%]"
          >
            <div className="max-w-[80%] mx-auto cosmic-text-container">
              <div className="cosmic-text-responsive text-[#00ebd6]">
                <DynamicContent 
                  contentKey="home-vibes-description" 
                  fallback="From live performances to collaborative projects, Dale brings a unique sound experience infused with retro-futuristic beats, fluid tropical notes, and immersive visuals."
                  page="home"
                  section="vibes" 
                />
              </div>
            </div>
          </GeometricSection>

          {/* Explore The Journey Section - with more symmetric rectangular shape like the reference image */}
          <GeometricSection
            variant="cosmic"
            shape="diamond"
            title={
              <DynamicContent 
                contentKey="home-journey-title" 
                fallback="Explore The Journey"
                page="home"
                section="journey" 
              />
            }
            alignment="center"
            className="mb-16 mx-auto max-w-[90%]"
            backgroundStyle="gradient"
            textContained={true}
            style={{ padding: '8% 15%' }} // Enhanced padding to create more space inside the diamond
          >
            <div className="max-w-[98%] mx-auto cosmic-text-container">
              <div className="cosmic-text-responsive mb-6 text-[#00ebd6] font-cormorant whitespace-normal">
                <DynamicContent 
                  contentKey="home-journey-description" 
                  fallback="💫 Join the cosmic voyage and become part of the ever-growing community of cosmic explorers and music lovers 💖"
                  page="home"
                  section="journey" 
                />
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link href="/music-release">
                  <Button variant="outline" className="text-[#00ebd6] border-[#00ebd6] hover:bg-[#00ebd6]/20 min-w-[140px]">
                    <DynamicContent 
                      contentKey="home-journey-button-music" 
                      fallback="New Music"
                      page="home"
                      section="journey" 
                    />
                  </Button>
                </Link>
                <Link href="/tour">
                  <Button variant="outline" className="text-[#7c3aed] border-[#7c3aed] hover:bg-[#7c3aed]/20 min-w-[140px]">
                    <DynamicContent 
                      contentKey="home-journey-button-tour" 
                      fallback="Tour Dates"
                      page="home"
                      section="journey" 
                    />
                  </Button>
                </Link>
                <Link href="/cosmic-connectivity">
                  <Button variant="outline" className="text-[#e15554] border-[#e15554] hover:bg-[#e15554]/20 min-w-[140px]">
                    <DynamicContent 
                      contentKey="home-journey-button-cosmic" 
                      fallback="Cosmic Experience"
                      page="home"
                      section="journey" 
                    />
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