/**
 * EngagePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 * Updated to include new components: SocialMediaLinks and FanReactions.
 * FeaturedMerchandise component moved to the bottom of the page.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SocialMediaLinks from "@/components/common/SocialMediaLinks";
import FanReactions from "@/components/common/FanReactions";
import FeaturedMerchandise from "@/components/common/FeaturedMerchandise";

export default function EngagePage() {
  useEffect(() => {
    document.title = "Engage - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Engage</h1>
        <div className="space-y-8">
          {/* Main Banner Section */}
          <section className="banner bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="w-full h-64 bg-gradient-to-r from-[#0a305c] to-[#00ebd6] rounded-lg mb-6 flex items-center justify-center">
              <h2 className="text-4xl font-bold text-white">Join Our Community</h2>
            </div>
            <div className="cta-buttons flex flex-wrap gap-4 justify-center">
              <Link to="/newsletter">
                <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg whitespace-nowrap">
                  Join The Whale Pod
                </button>
              </Link>
              <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer">
                <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg whitespace-nowrap">
                  Share Your Experience
                </button>
              </a>
            </div>
          </section>

          {/* New Social Media Links Component */}
          <SocialMediaLinks />

          {/* New Fan Reactions Component */}
          <FanReactions />

          {/* Connect With Us Section */}
          <section className="social-media bg-[rgba(10,50,92,0.6)] p-4 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-[#00ebd6] mb-8 text-center">Connect With Us</h2>

            {/* Dale The Whale Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-[#fe0064] text-center border-b border-[#fe0064] pb-2">🐳 Dale The Whale Music & Content 🐳</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg space-y-3">
                  <h4 className="text-xl font-bold mb-4 text-[#00ebd6]">Social Media</h4>
                  <div className="space-y-4">
                    <a href="https://www.youtube.com/@DiamondOrca777/featured" target="_blank" rel="noopener noreferrer" 
                      className="block text-white hover:text-[#00ebd6] transition-colors p-2 min-h-[60px]">
                      <div>Dale's YouTube:</div>
                      <div>@DiamondOrca777</div>
                    </a>
                    <a href="https://www.instagram.com/dale_loves_whales" target="_blank" rel="noopener noreferrer"
                      className="block text-white hover:text-[#00ebd6] transition-colors p-2 min-h-[60px]">
                      <div>Dale's Instagram:</div>
                      <div>dale_loves_whales</div>
                    </a>
                    <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer"
                      className="block text-white hover:text-[#00ebd6] transition-colors p-2 min-h-[60px]">
                      <div>Dale's Instagram:</div>
                      <div>dalethewhalemusic</div>
                    </a>
                  </div>
                </div>

                <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg space-y-3">
                  <h4 className="text-xl font-bold mb-4 text-[#00ebd6]">Music & Podcast</h4>
                  <div className="space-y-4">
                    <a href="https://youtu.be/jzpvkq3Krjg" target="_blank" rel="noopener noreferrer"
                      className="block text-white hover:text-[#00ebd6] transition-colors p-2 min-h-[60px]">
                      <div>"Feels So Good" Music Video</div>
                    </a>
                    <a href="https://open.spotify.com/album/3NDnzf57NDrUwkv7QJ22Th" target="_blank" rel="noopener noreferrer"
                      className="block text-white hover:text-[#00ebd6] transition-colors p-2 min-h-[60px]">
                      <div>Dale's Music On Spotify</div>
                    </a>
                    <a href="https://creators.spotify.com/pod/show/dale-ham" target="_blank" rel="noopener noreferrer"
                      className="block text-white hover:text-[#00ebd6] transition-colors p-2 min-h-[60px]">
                      <div>🕊🕉 THE IRIDESCENT DOVE Podcast</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* AC3-2085 Section */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-[#fe0064] text-center border-b border-[#fe0064] pb-2">🎵 AC3-2085 Music & Business 🎵</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg space-y-3">
                  <h4 className="text-xl font-bold mb-4 text-[#00ebd6]">Music Production</h4>
                  <div className="space-y-4">
                    <a href="https://www.youtube.com/channel/UCewdO8AO3aBVzgWzeMG5paQ" target="_blank" rel="noopener noreferrer"
                      className="block text-white hover:text-[#00ebd6] transition-colors p-2 min-h-[60px]">
                      <div>AC3-2085 YouTube Channel</div>
                    </a>
                    <a href="https://www.instagram.com/ac3productionsllc" target="_blank" rel="noopener noreferrer"
                      className="block text-white hover:text-[#00ebd6] transition-colors p-2 min-h-[60px]">
                      <div>Chris's Instagram:</div>
                      <div>ac3productionsllc</div>
                    </a>
                  </div>
                </div>

                <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg space-y-3">
                  <h4 className="text-xl font-bold mb-4 text-[#00ebd6]">Business Inquiries</h4>
                  <div className="space-y-4">
                    <div className="block text-white space-y-2 p-2">
                      <div>Email: <a href="mailto:ac3productionsllc@gmail.com" className="hover:text-[#00ebd6] transition-colors">ac3productionsllc@gmail.com</a></div>
                      <div>Phone: <a href="tel:8044375418" className="hover:text-[#00ebd6] transition-colors">804-437-5418</a></div>
                      <div>Book online: <a href="https://calendly.com/ac3productionsllc/30min?month=2025-01" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6] transition-colors">calendly.com/ac3productionsllc/30min</a></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Merchandise Component (moved to the bottom) */}
          <FeaturedMerchandise />
        </div>
      </div>
    </>
  );
}
