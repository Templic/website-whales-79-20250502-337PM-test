/**
 * EngagePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { SpotlightEffect } from "@/components/SpotlightEffect";

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
          <section className="banner bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <img src="/api/placeholder/1200/400" alt="Main Banner" className="w-full rounded-lg mb-6" />
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

          <section className="merchandise bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Featured Merchandise</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
                <img src="https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg" alt="Digital Art" className="w-full rounded-lg mb-4" />
                <h3 className="text-xl font-bold mb-2">Orca Sunrise Cove by Dale The Whale on Etsy.com</h3>
                <p className="mb-4">$45.00</p>
                <a
                  href="https://www.etsy.com/listing/1814098203/dale-loves-whale-digital-art?ls=r&content_source=6ac43cb79853f47bac6e7ec5dc1b9ff1195be02a%253A1814098203"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors w-full"
                >
                  Buy Now
                </a>
              </div>
              <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
                <img src="https://i.etsystatic.com/54804470/r/il/15c48e/6530624025/il_1588xN.6530624025_7yel.jpg" />
                <h3 className="text-xl font-bold mb-2">Orca Sunrise Cove by Dale The Whale on Etsy.com</h3>
                <p className="mb-4">$45.00</p>
                <a
                  href="https://www.etsy.com/listing/1823352422/dale-loves-whales-divine-digital-cosmic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors w-full"
                >
                  Buy Now
                </a>
              </div>
            </div>
          </section>

          <section className="fan-reactions bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Fan Reactions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
                <p className="italic mb-4">"Amazing performance! The cosmic vibes were unreal!"</p>
                <p className="text-sm">- Sarah W.</p>
              </div>
              <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
                <p className="italic mb-4">"Dale's music takes you on a journey through space and time."</p>
                <p className="text-sm">- Michael R.</p>
              </div>
            </div>
          </section>

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
        </div>
      </div>
    </>
  );
}
