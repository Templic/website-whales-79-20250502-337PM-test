/**
 * EngagePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 * Updated to include new components: SocialMediaLinks and FanReactions.
 * FeaturedMerchandise component moved to the bottom of the page.
 * Revamped with cosmic-ocean aesthetic and sacred geometry elements.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SocialMediaLinks from "@/components/common/SocialMediaLinks";
import FanReactions from "@/components/common/FanReactions";
import FeaturedMerchandise from "@/components/common/FeaturedMerchandise";
import SacredGeometry from "@/components/ui/sacred-geometry";
import { FaYoutube, FaInstagram, FaSpotify, FaPodcast, FaMusic, FaEnvelope, FaPhone, FaCalendarAlt, FaUsers } from 'react-icons/fa';

export default function EngagePage() {
  useEffect(() => {
    document.title = "Engage - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      
      {/* Sacred geometry elements in page margins - reduced and optimized */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry variant="merkaba" size={120} animated={true} />
        </div>
        <div className="absolute bottom-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry variant="dodecahedron" size={120} animated={true} />
        </div>
        
        {/* Right margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry variant="icosahedron" size={120} animated={true} />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-5xl font-bold text-[#00ebd6] mb-6 cosmic-float font-nebula tracking-wider">Engage</h1>
        <div className="space-y-8">
          {/* Main Banner Section */}
          <section className="banner cosmic-glow-box p-8 rounded-xl cosmic-pulse relative overflow-hidden">
            <img 
              src="/assets/golden whales deep blue DREAMS 😍❤️😍 Boundless Potential By DÄLË THĒ 💙 WHALE 🐳 etsy .jpg" 
              alt="Dale Loves Whales Banner"
              className="w-full rounded-lg mb-6 object-cover h-80" 
            />
            <div className="cta-buttons flex flex-wrap gap-4 justify-center">
              <Link to="/newsletter">
                <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-all shadow-lg hover:shadow-[0_0_15px_rgba(254,0,100,0.7)] whitespace-nowrap">
                  Join The Whale Pod
                </button>
              </Link>
              <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer">
                <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-all shadow-lg hover:shadow-[0_0_15px_rgba(254,0,100,0.7)] whitespace-nowrap">
                  Share Your Experience
                </button>
              </a>
            </div>
            
            {/* Sacred geometry element on bottom right */}
            <div className="absolute -bottom-6 -right-6 opacity-30">
              <SacredGeometry variant="hexagon" size={120} animated={true} intensity="subtle" />
            </div>
          </section>

          {/* New Social Media Links Component */}
          <SocialMediaLinks />

          {/* New Fan Reactions Component */}
          <FanReactions />

          {/* Sacred geometry divider - increased spacing and optimized for performance */}
          <div className="relative py-12 sm:py-16 flex justify-center">
            <div className="sacred-geometry-container absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 z-0">
              <div className="hidden sm:block">
                <SacredGeometry variant="merkaba" size={160} animated={false} intensity="subtle" />
              </div>
              <div className="block sm:hidden">
                <SacredGeometry variant="merkaba" size={120} animated={false} intensity="subtle" />
              </div>
            </div>
          </div>

          {/* Featured Art Image */}
          <section className="art-feature relative max-w-4xl mx-auto px-4">
            <div className="relative">
              {/* Reduced the number of sacred geometry elements and fixed LSP errors */}
              <div className="absolute -top-8 left-4 opacity-10 z-0 hidden md:block">
                <SacredGeometry variant="pentagon" size={60} animated={false} intensity="subtle" />
              </div>
              
              <img 
                src="/assets/Orca Sunrise Cove by Dale The Whale on etsy.jpg" 
                alt="Orca Sunrise Cove" 
                className="w-full h-auto max-h-[300px] sm:max-h-[350px] md:max-h-[400px] object-contain rounded-lg shadow-xl z-10 relative" 
              />
              
              <div className="absolute -bottom-8 right-4 opacity-10 z-0 hidden md:block">
                <SacredGeometry variant="octagon" size={60} animated={false} intensity="subtle" />
              </div>
            </div>
          </section>

          {/* Connect With Us Section - Restored gradient background */}
          <section className="social-media p-4 md:p-8 shadow-lg backdrop-blur-sm relative overflow-hidden">
            {/* Background with sacred geometry */}
            <div className="absolute inset-0 bg-[rgba(10,50,92,0.6)]">
              <div className="absolute top-0 left-0 opacity-10">
                <SacredGeometry variant="octagon" size={160} animated={false} />
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <SacredGeometry variant="octagon" size={160} animated={false} />
              </div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#00ebd6] mb-4 text-center">Dive Into Our Cosmic Ocean</h2>
              <div className="text-center mb-8">
                <a 
                  href="/community" 
                  className="inline-block px-4 py-2 bg-[#00ebd6]/20 text-white hover:text-[#00ebd6] border border-[#00ebd6] rounded-lg shadow-lg transition-all hover:shadow-[0_0_15px_rgba(0,235,214,0.5)] mx-auto"
                >
                  <span className="flex items-center">
                    <FaUsers className="mr-2" />
                    Visit Our Community
                  </span>
                </a>
              </div>

              {/* Dale The Whale Section */}
              <div className="mb-12">
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-[#fe0064] text-center border-b border-[#fe0064] pb-2">🐳 Dale The Whale Music & Content 🐳</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <div className="relative group min-h-[270px] flex">
                    {/* Octagon shape container with clip-path */}
                    <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                         clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                    
                    <div className="relative z-10 p-4 sm:p-6 py-8 flex flex-col items-center w-full">
                      {/* Sacred geometry hidden on mobile for performance */}
                      <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                        <SacredGeometry variant="octagon" size={60} animated={false} />
                      </div>
                      
                      <h4 className="text-lg font-bold mb-4 text-[#00ebd6] text-center">Cosmic Social Channels</h4>
                      <div className="space-y-3 w-full">
                        <a href="https://www.youtube.com/@DiamondOrca777/featured" target="_blank" rel="noopener noreferrer" 
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaYoutube className="text-red-500 text-sm" />
                            <span className="text-sm">Dale's YouTube:</span>
                          </div>
                          <div className="text-center text-sm">@DiamondOrca777</div>
                        </a>
                        <a href="https://www.instagram.com/dale_loves_whales" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaInstagram className="text-pink-500 text-sm" />
                            <span className="text-sm">dale_loves_whales</span>
                          </div>
                        </a>
                        <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaInstagram className="text-pink-500 text-sm" />
                            <span className="text-sm">dalethewhalemusic</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="relative group min-h-[270px] flex">
                    {/* Octagon shape container with clip-path */}
                    <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                         clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                    
                    <div className="relative z-10 p-4 sm:p-6 py-8 flex flex-col items-center w-full">
                      {/* Sacred geometry hidden on mobile for performance */}
                      <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                        <SacredGeometry variant="octagon" size={60} animated={false} />
                      </div>
                      
                      <h4 className="text-lg font-bold mb-4 text-[#00ebd6] text-center">Ethereal Sounds & Words</h4>
                      <div className="space-y-3 w-full">
                        <a href="https://youtu.be/jzpvkq3Krjg" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaMusic className="text-purple-400 text-sm" />
                            <span className="text-sm">"Feels So Good" Music Video</span>
                          </div>
                        </a>
                        <a href="https://open.spotify.com/album/3NDnzf57NDrUwkv7QJ22Th" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaSpotify className="text-green-500 text-sm" />
                            <span className="text-sm">Dale's Music On Spotify</span>
                          </div>
                        </a>
                        <a href="https://creators.spotify.com/pod/show/dale-ham" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaPodcast className="text-purple-400 text-sm" />
                            <span className="text-sm">THE IRIDESCENT DOVE Podcast</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AC3-2085 Section */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-[#fe0064] text-center border-b border-[#fe0064] pb-2">🎵 AC3-2085 Music & Business 🎵</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <div className="relative group min-h-[230px] flex">
                    {/* Octagon shape container with clip-path */}
                    <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                         clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                    
                    <div className="relative z-10 p-4 sm:p-6 py-8 flex flex-col items-center w-full">
                      {/* Sacred geometry hidden on mobile for performance */}
                      <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                        <SacredGeometry variant="octagon" size={60} animated={false} />
                      </div>
                      
                      <h4 className="text-lg font-bold mb-4 text-[#00ebd6] text-center">Celestial Productions</h4>
                      <div className="space-y-3 w-full">
                        <a href="https://www.youtube.com/channel/UCewdO8AO3aBVzgWzeMG5paQ" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaYoutube className="text-red-500 text-sm" />
                            <span className="text-sm">AC3-2085 YouTube Channel</span>
                          </div>
                        </a>
                        <a href="https://www.instagram.com/ac3productionsllc" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaInstagram className="text-pink-500 text-sm" />
                            <span className="text-sm">ac3productionsllc</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="relative group min-h-[230px] flex">
                    {/* Octagon shape container with clip-path */}
                    <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                         clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                    
                    <div className="relative z-10 p-4 sm:p-6 py-8 flex flex-col items-center w-full">
                      {/* Sacred geometry hidden on mobile for performance */}
                      <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                        <SacredGeometry variant="octagon" size={60} animated={false} />
                      </div>
                      
                      <h4 className="text-lg font-bold mb-4 text-[#00ebd6] text-center">Universal Connections</h4>
                      <div className="space-y-3 w-full">
                        <div className="block text-white space-y-2 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <FaEnvelope className="text-blue-400 text-sm" />
                            <a href="mailto:ac3productionsllc@gmail.com" className="text-sm hover:text-[#00ebd6] transition-colors">ac3productionsllc@gmail.com</a>
                          </div>
                          <div className="flex items-center gap-2 justify-center">
                            <FaPhone className="text-green-400 text-sm" />
                            <a href="tel:8044375418" className="text-sm hover:text-[#00ebd6] transition-colors">804-437-5418</a>
                          </div>
                          <div className="flex flex-col items-center gap-2 justify-center">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-purple-400 text-sm mr-2" />
                              <span className="text-sm">Book online:</span>
                            </div>
                            <a href="https://calendly.com/ac3productionsllc/30min" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="text-xs hover:text-[#00ebd6] transition-colors">
                               calendly.com/ac3productionsllc
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Merchandise - Images made clickable to Etsy */}
          <div className="featured-merchandise-banners grid md:grid-cols-2 gap-6 mb-12">
            <a
              href="https://www.etsy.com/listing/1814098203/dale-loves-whale-digital-art?ls=r&content_source=6ac43cb79853f47bac6e7ec5dc1b9ff1195be02a%253A1814098203"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl"
            >
              <img 
                src="https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg" 
                alt="Orca Sunrise Cove by Dale The Whale on Etsy" 
                className="w-full h-48 object-cover rounded-xl transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <span className="text-white p-4 font-bold">Shop on Etsy →</span>
              </div>
            </a>
            <a
              href="https://www.etsy.com/listing/1823352422/dale-loves-whales-divine-digital-cosmic"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl"
            >
              <img 
                src="https://i.etsystatic.com/54804470/r/il/15c48e/6530624025/il_1588xN.6530624025_7yel.jpg" 
                alt="Dale Loves Whales Divine Digital Cosmic Art" 
                className="w-full h-48 object-cover rounded-xl transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <span className="text-white p-4 font-bold">Shop on Etsy →</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
