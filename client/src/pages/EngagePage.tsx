/**
 * EngagePage.tsx
 * 
 * Enhanced with cosmic UI elements, animations, and mobile responsiveness.
 * Contains SocialMediaLinks, FanReactions, and FeaturedMerchandise components.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SocialMediaLinks from "@/components/common/SocialMediaLinks";
import FanReactions from "@/components/common/FanReactions";
import FeaturedMerchandise from "@/components/common/FeaturedMerchandise";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import CosmicLoader from "@/components/cosmic/CosmicLoader";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export default function EngagePage() {
  const { reducedMotion } = useAccessibility();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    document.title = "Cosmic Engagement - Dale Loves Whales";
    
    // Check for mobile devices
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Simulate content loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Animation variants respecting reduced motion preferences
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: reducedMotion ? 0 : 0.15,
        duration: reducedMotion ? 0.2 : 0.5 
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: reducedMotion ? 0.2 : 0.5 }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CosmicLoader 
          size="large" 
          message="Connecting to the cosmic network..."
          variant="primary"
          geometryType="sri-yantra"
        />
      </div>
    );
  }

  return (
    <>
      <SpotlightEffect />
      
      {/* Sacred Geometry Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SacredGeometry type="sri-yantra" className="absolute top-40 left-20 opacity-15 w-[400px] h-[400px] text-[#fe0064]" />
        <SacredGeometry type="metatron-cube" className="absolute bottom-40 right-10 opacity-15 w-[350px] h-[350px] text-[#00ebd6]" />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.2 : 0.7 }}
          className="flex flex-col md:flex-row items-center gap-4 mb-10 justify-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#fe0064] to-[#00ebd6] mb-4 md:mb-0 tracking-wider text-center md:text-left">
            Cosmic Engagement
          </h1>
          <SacredGeometry type="golden-spiral" className="w-10 h-10 text-[#5b78ff]" />
        </motion.div>
        
        <motion.div 
          className="space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Banner Section - Enhanced with Cosmic Elements */}
          <motion.section 
            variants={itemVariants}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[rgba(10,48,92,0.4)] to-[rgba(0,235,214,0.1)] p-6 md:p-8 border border-[#00ebd6]/20"
          >
            {/* Background geometric patterns */}
            <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
              <SacredGeometry type="flower-of-life" className="w-[300px] h-[300px] text-[#00ebd6]" />
            </div>
            <div className="absolute top-10 left-10 opacity-10 pointer-events-none">
              <SacredGeometry type="vesica-piscis" className="w-[150px] h-[150px] text-[#fe0064]" />
            </div>
            
            <div className="relative w-full h-48 md:h-64 lg:h-72 bg-gradient-to-br from-[#0a305c] to-[#0c4870] rounded-lg mb-6 overflow-hidden">
              {/* Background glow effects */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#00ebd6]/10 to-transparent opacity-70"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00ebd6]/20 via-transparent to-[#fe0064]/20 opacity-50 blur-md"></div>
              
              {/* Animated sacred geometry elements */}
              <div className="absolute -right-10 top-10 opacity-20">
                <motion.div
                  animate={{ rotate: reducedMotion ? 0 : 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                >
                  <SacredGeometry type="flower-of-life" className="w-40 h-40 text-[#00ebd6]" />
                </motion.div>
              </div>
              <div className="absolute -left-10 bottom-10 opacity-20">
                <motion.div
                  animate={{ rotate: reducedMotion ? 0 : -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                >
                  <SacredGeometry type="sri-yantra" className="w-40 h-40 text-[#fe0064]" />
                </motion.div>
              </div>
              
              {/* Main text content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ffffff] to-[#00ebd6] mb-4">
                  Join Our Cosmic Community
                </h2>
                <p className="text-white/80 max-w-lg text-center">
                  Connect with fellow cosmic travelers and participate in the interdimensional harmonic convergence.
                </p>
              </div>
            </div>
            
            <div className="cta-buttons flex flex-wrap gap-4 justify-center">
              <Link to="/newsletter">
                <button className="bg-gradient-to-r from-[#00ebd6] to-[#0a305c] text-white px-6 py-3 rounded-full hover:from-[#fe0064] hover:to-[#8a0046] transition-all duration-300 shadow-lg whitespace-nowrap flex items-center gap-2">
                  <span>Join The Whale Pod</span>
                  <SacredGeometry type="vesica-piscis" className="w-5 h-5" />
                </button>
              </Link>
              <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer">
                <button className="bg-gradient-to-r from-[#fe0064] to-[#8a0046] text-white px-6 py-3 rounded-full hover:from-[#00ebd6] hover:to-[#0a305c] transition-all duration-300 shadow-lg whitespace-nowrap flex items-center gap-2">
                  <span>Share Your Experience</span>
                  <SacredGeometry type="pentagon-star" className="w-5 h-5" />
                </button>
              </a>
            </div>
          </motion.section>

          {/* Social Media Links Component - Wrapped with motion */}
          <motion.div variants={itemVariants}>
            <SocialMediaLinks />
          </motion.div>

          {/* Fan Reactions Component - Wrapped with motion */}
          <motion.div variants={itemVariants}>
            <FanReactions />
          </motion.div>

          {/* Connect With Us Section - Enhanced with Cosmic Elements */}
          <motion.section 
            variants={itemVariants}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[rgba(91,120,255,0.15)] to-[rgba(254,0,100,0.05)] p-6 md:p-8 border border-[#5b78ff]/20"
          >
            {/* Background decorative elements */}
            <div className="absolute -left-20 -bottom-20 opacity-10 pointer-events-none">
              <SacredGeometry type="merkaba" className="w-[250px] h-[250px] text-[#5b78ff]" />
            </div>
            
            <div className="relative">
              <div className="flex items-center justify-center gap-3 mb-8">
                <SacredGeometry type="metatron-cube" className="w-8 h-8 text-[#00ebd6]" />
                <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00ebd6] to-[#5b78ff]">
                  Cosmic Connections
                </h2>
                <SacredGeometry type="metatron-cube" className="w-8 h-8 text-[#00ebd6]" />
              </div>

              {/* Dale The Whale Section */}
              <div className="mb-12">
                <div className="flex justify-center items-center gap-3 mb-6">
                  <div className="h-px flex-grow bg-gradient-to-r from-transparent to-[#fe0064]/50 max-w-xs"></div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#fe0064] px-4 py-2 rounded-full bg-[#fe0064]/10 border border-[#fe0064]/20 flex items-center gap-2">
                    <SacredGeometry type="pentagon-star" className="w-5 h-5 text-[#fe0064]" />
                    <span>Dale's Cosmic Channels</span>
                    <SacredGeometry type="pentagon-star" className="w-5 h-5 text-[#fe0064]" />
                  </h3>
                  <div className="h-px flex-grow bg-gradient-to-l from-transparent to-[#fe0064]/50 max-w-xs"></div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="cosmic-link-container relative overflow-hidden bg-gradient-to-br from-[rgba(48,52,54,0.5)] to-[rgba(10,48,92,0.3)] p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                    {/* Decorative elements */}
                    <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                      <SacredGeometry type="vesica-piscis" className="w-40 h-40 text-[#00ebd6]" />
                    </div>
                    
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <SacredGeometry type="hexagon" className="w-5 h-5 text-[#00ebd6]" />
                        <h4 className="text-xl font-bold text-[#00ebd6]">Social Media Portals</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <a href="https://www.youtube.com/@DiamondOrca777/featured" target="_blank" rel="noopener noreferrer" 
                          className="group block text-white hover:text-[#00ebd6] transition-colors p-3 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#00ebd6]/20 transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-red-600 rounded-full text-white text-xs group-hover:scale-110 transition-transform">YT</div>
                            <div className="font-medium">Dale's YouTube</div>
                          </div>
                          <div className="mt-1 text-sm opacity-70 group-hover:opacity-100">@DiamondOrca777</div>
                        </a>
                        
                        <a href="https://www.instagram.com/dale_loves_whales" target="_blank" rel="noopener noreferrer"
                          className="group block text-white hover:text-[#00ebd6] transition-colors p-3 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#00ebd6]/20 transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 rounded-full text-white text-xs group-hover:scale-110 transition-transform">IG</div>
                            <div className="font-medium">Dale's Instagram</div>
                          </div>
                          <div className="mt-1 text-sm opacity-70 group-hover:opacity-100">dale_loves_whales</div>
                        </a>
                        
                        <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer"
                          className="group block text-white hover:text-[#00ebd6] transition-colors p-3 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#00ebd6]/20 transition-all duration-300">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 rounded-full text-white text-xs group-hover:scale-110 transition-transform">IG</div>
                            <div className="font-medium">Dale's Music Instagram</div>
                          </div>
                          <div className="mt-1 text-sm opacity-70 group-hover:opacity-100">dalethewhalemusic</div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="cosmic-music-container relative overflow-hidden bg-gradient-to-br from-[rgba(48,52,54,0.5)] to-[rgba(10,48,92,0.3)] p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                    {/* Decorative elements */}
                    <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                      <SacredGeometry type="merkaba" className="w-40 h-40 text-[#00ebd6]" />
                    </div>
                    
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <SacredGeometry type="pentagon-star" className="w-5 h-5 text-[#00ebd6]" />
                        <h4 className="text-xl font-bold text-[#00ebd6]">Cosmic Music & Podcast</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <a href="https://youtu.be/jzpvkq3Krjg" target="_blank" rel="noopener noreferrer"
                          className="group flex items-center gap-3 text-white hover:text-[#00ebd6] p-3 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#00ebd6]/20 transition-all duration-300">
                          <div className="w-12 h-12 flex-shrink-0 rounded bg-gradient-to-br from-[#fe0064]/20 to-[#00ebd6]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <SacredGeometry type="octagon" className="w-6 h-6 text-white group-hover:text-[#00ebd6] transition-colors" />
                          </div>
                          <div>
                            <div className="font-medium">"Feels So Good" Music Video</div>
                            <div className="text-xs text-white/60 group-hover:text-white/80">Experience the interdimensional journey</div>
                          </div>
                        </a>
                        
                        <a href="https://open.spotify.com/album/3NDnzf57NDrUwkv7QJ22Th" target="_blank" rel="noopener noreferrer"
                          className="group flex items-center gap-3 text-white hover:text-[#00ebd6] p-3 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#00ebd6]/20 transition-all duration-300">
                          <div className="w-12 h-12 flex-shrink-0 rounded bg-gradient-to-br from-[#1DB954]/20 to-[#191414]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <div className="w-6 h-6 flex items-center justify-center bg-[#1DB954] rounded-full text-black text-xs">SP</div>
                          </div>
                          <div>
                            <div className="font-medium">Dale's Music On Spotify</div>
                            <div className="text-xs text-white/60 group-hover:text-white/80">Stream the cosmic frequencies</div>
                          </div>
                        </a>
                        
                        <a href="https://creators.spotify.com/pod/show/dale-ham" target="_blank" rel="noopener noreferrer"
                          className="group flex items-center gap-3 text-white hover:text-[#00ebd6] p-3 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#00ebd6]/20 transition-all duration-300">
                          <div className="w-12 h-12 flex-shrink-0 rounded bg-gradient-to-br from-[#1DB954]/20 to-[#191414]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <div className="text-xl">🕊</div>
                          </div>
                          <div>
                            <div className="font-medium">THE IRIDESCENT DOVE Podcast</div>
                            <div className="text-xs text-white/60 group-hover:text-white/80">Wisdom from the higher dimensions</div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AC3-2085 Section */}
              <div>
                <div className="flex justify-center items-center gap-3 mb-6">
                  <div className="h-px flex-grow bg-gradient-to-r from-transparent to-[#00ebd6]/50 max-w-xs"></div>
                  <h3 className="text-xl md:text-2xl font-bold text-[#00ebd6] px-4 py-2 rounded-full bg-[#00ebd6]/10 border border-[#00ebd6]/20 flex items-center gap-2">
                    <SacredGeometry type="golden-spiral" className="w-5 h-5 text-[#00ebd6]" />
                    <span>AC3-2085 Cosmic Network</span>
                    <SacredGeometry type="golden-spiral" className="w-5 h-5 text-[#00ebd6]" />
                  </h3>
                  <div className="h-px flex-grow bg-gradient-to-l from-transparent to-[#00ebd6]/50 max-w-xs"></div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="cosmic-production-container relative overflow-hidden bg-gradient-to-br from-[rgba(48,52,54,0.5)] to-[rgba(10,48,92,0.3)] p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                    {/* Decorative elements */}
                    <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                      <SacredGeometry type="fibonacci-spiral" className="w-40 h-40 text-[#00ebd6]" />
                    </div>
                    
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <SacredGeometry type="merkaba" className="w-5 h-5 text-[#00ebd6]" />
                        <h4 className="text-xl font-bold text-[#00ebd6]">Cosmic Music Production</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <a href="https://www.youtube.com/channel/UCewdO8AO3aBVzgWzeMG5paQ" target="_blank" rel="noopener noreferrer"
                          className="group flex items-center gap-3 text-white hover:text-[#00ebd6] p-3 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#00ebd6]/20 transition-all duration-300">
                          <div className="w-12 h-12 flex-shrink-0 rounded bg-gradient-to-br from-[#fe0064]/20 to-[#00ebd6]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <div className="w-6 h-6 flex items-center justify-center bg-red-600 rounded-full text-white text-xs">YT</div>
                          </div>
                          <div>
                            <div className="font-medium">AC3-2085 YouTube Channel</div>
                            <div className="text-xs text-white/60 group-hover:text-white/80">Experience musical mastery</div>
                          </div>
                        </a>
                        
                        <a href="https://www.instagram.com/ac3productionsllc" target="_blank" rel="noopener noreferrer"
                          className="group flex items-center gap-3 text-white hover:text-[#00ebd6] p-3 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-[#00ebd6]/20 transition-all duration-300">
                          <div className="w-12 h-12 flex-shrink-0 rounded bg-gradient-to-br from-purple-600/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 rounded-full text-white text-xs">IG</div>
                          </div>
                          <div>
                            <div className="font-medium">Chris's Instagram</div>
                            <div className="text-xs text-white/60 group-hover:text-white/80">@ac3productionsllc</div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="cosmic-business-container relative overflow-hidden bg-gradient-to-br from-[rgba(48,52,54,0.5)] to-[rgba(10,48,92,0.3)] p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                    {/* Decorative elements */}
                    <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                      <SacredGeometry type="sri-yantra" className="w-40 h-40 text-[#00ebd6]" />
                    </div>
                    
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <SacredGeometry type="octagon" className="w-5 h-5 text-[#00ebd6]" />
                        <h4 className="text-xl font-bold text-[#00ebd6]">Cosmic Business Inquiries</h4>
                      </div>
                      
                      <div className="space-y-4 p-3 rounded-lg bg-black/20 border border-white/5">
                        <div className="flex items-center gap-3 text-white">
                          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#fe0064]/20 to-[#00ebd6]/20 flex items-center justify-center">
                            <SacredGeometry type="hexagon" className="w-5 h-5 text-[#00ebd6]" />
                          </div>
                          <div>
                            <div className="font-medium">Email</div>
                            <div>
                              <a href="mailto:ac3productionsllc@gmail.com" className="text-[#00ebd6] hover:text-[#5b78ff] transition-colors underline">
                                ac3productionsllc@gmail.com
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-white">
                          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#fe0064]/20 to-[#00ebd6]/20 flex items-center justify-center">
                            <SacredGeometry type="pentagon-star" className="w-5 h-5 text-[#00ebd6]" />
                          </div>
                          <div>
                            <div className="font-medium">Phone</div>
                            <div>
                              <a href="tel:8044375418" className="text-[#00ebd6] hover:text-[#5b78ff] transition-colors underline">
                                804-437-5418
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-white">
                          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#fe0064]/20 to-[#00ebd6]/20 flex items-center justify-center">
                            <SacredGeometry type="golden-spiral" className="w-5 h-5 text-[#00ebd6]" />
                          </div>
                          <div>
                            <div className="font-medium">Book online</div>
                            <div>
                              <a href="https://calendly.com/ac3productionsllc/30min?month=2025-01" target="_blank" rel="noopener noreferrer" className="text-[#00ebd6] hover:text-[#5b78ff] transition-colors underline">
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
            </div>
          </motion.section>

          {/* Featured Merchandise Component - Wrapped with motion */}
          <motion.div variants={itemVariants}>
            <FeaturedMerchandise />
          </motion.div>
          
          {/* Newsletter Sign Up for Cosmic Updates */}
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[rgba(0,235,214,0.2)] to-[rgba(254,0,100,0.1)] p-6 md:p-8 border border-[#00ebd6]/20 mt-12"
          >
            <div className="absolute -left-20 -bottom-20 opacity-10 pointer-events-none">
              <SacredGeometry type="sri-yantra" className="w-80 h-80 text-[#00ebd6]" />
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-lg">
                <div className="flex items-center gap-2 mb-3">
                  <SacredGeometry type="merkaba" className="w-6 h-6 text-[#fe0064]" />
                  <h3 className="text-xl md:text-2xl font-bold text-[#00ebd6]">Cosmic Update Portal</h3>
                </div>
                <p className="text-white/80 mb-2">Stay connected to the cosmic frequencies with our interdimensional newsletter.</p>
              </div>
              
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-[#050f28]/80 border border-[#00ebd6]/30 rounded-full px-5 py-3 focus:outline-none focus:border-[#fe0064] transition-colors w-full"
                />
                <button className="bg-gradient-to-r from-[#00ebd6] to-[#5b78ff] text-white px-6 py-3 rounded-full hover:from-[#fe0064] hover:to-[#8a0046] transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2">
                  <span>Connect Now</span>
                  <SacredGeometry type="pentagon-star" className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
