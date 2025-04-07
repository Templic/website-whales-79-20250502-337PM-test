/**
 * TourPage.tsx
 * 
 * Enhanced with cosmic design elements and mobile responsiveness.
 */

import { useEffect, useState } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import GeometricSection from "@/components/cosmic/GeometricSection";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion } from "framer-motion";

export default function TourPage() {
  const { reducedMotion } = useAccessibility();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    document.title = "Cosmic Tour - Dale Loves Whales";
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animation variants respecting reduced motion preferences
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: reducedMotion ? 0 : 0.1,
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

  return (
    <>
      <SpotlightEffect />
      
      {/* Sacred Geometry Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <SacredGeometry type="fibonacci-spiral" className="absolute top-40 right-20 opacity-15 w-[400px] h-[400px] text-[#00ebd6]" />
        <SacredGeometry type="flower-of-life" className="absolute bottom-40 left-10 opacity-15 w-[350px] h-[350px] text-[#fe0064]" />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.2 : 0.7 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00ebd6] to-[#5b78ff] text-center md:text-left">
            Cosmic Tour Dates
          </h1>
          <SacredGeometry type="merkaba" className="w-10 h-10 text-[#fe0064]" />
        </motion.div>

        <GeometricSection 
          variant="secondary" 
          shape="trapezoid" 
          title="Upcoming Cosmic Journeys"
          subtitle="Join Dale Loves Whales on an unforgettable interdimensional music experience. Find your cosmic portal and secure your ticket."
          alignment="center"
        >
          <motion.div 
            className="tour-items space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="tour-item relative overflow-hidden p-6 rounded-xl bg-gradient-to-br from-[rgba(0,235,214,0.15)] to-[rgba(91,120,255,0.05)] backdrop-blur-sm border border-[#00ebd6]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transform hover:-translate-y-1 transition-transform duration-300"
            >
              {/* Decorative sacred geometry */}
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <SacredGeometry type="flower-of-life" className="w-40 h-40 text-[#00ebd6]" />
              </div>
              
              <div className="tour-details flex-grow">
                <div className="flex items-center gap-2">
                  <SacredGeometry type="vesica-piscis" className="w-5 h-5 text-[#fe0064]" />
                  <h3 className="text-xl md:text-2xl font-bold text-[#00ebd6]">Honolulu, HI</h3>
                </div>
                <div className="ml-7 mt-2 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="text-[#5b78ff]">✧</span> 
                    <span>Date: August 15, 2025</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#5b78ff]">✧</span> 
                    <span>Venue: Waikiki Beach Shell</span>
                  </p>
                </div>
              </div>
              
              <div className="relative w-full md:w-auto">
                <button disabled className="w-full md:w-auto bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-full cursor-not-allowed shadow-lg opacity-70 flex items-center justify-center gap-2">
                  <span>Sold Out</span>
                  <SacredGeometry type="pentagon-star" className="w-4 h-4 text-white" />
                </button>
                <div className="absolute -rotate-12 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-red-500 text-red-500 px-3 py-1 text-sm font-bold rounded bg-black/20 backdrop-blur-sm">
                  SOLD OUT
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="tour-item relative overflow-hidden p-6 rounded-xl bg-gradient-to-br from-[rgba(0,235,214,0.15)] to-[rgba(91,120,255,0.05)] backdrop-blur-sm border border-[#00ebd6]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transform hover:-translate-y-1 transition-transform duration-300"
            >
              {/* Decorative sacred geometry */}
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <SacredGeometry type="sri-yantra" className="w-40 h-40 text-[#00ebd6]" />
              </div>
              
              <div className="tour-details flex-grow">
                <div className="flex items-center gap-2">
                  <SacredGeometry type="hexagon" className="w-5 h-5 text-[#fe0064]" />
                  <h3 className="text-xl md:text-2xl font-bold text-[#00ebd6]">Big Island, HI</h3>
                </div>
                <div className="ml-7 mt-2 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="text-[#5b78ff]">✧</span> 
                    <span>Date: September 10, 2025</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#5b78ff]">✧</span> 
                    <span>Venue: Hilo Bay Concert Hall</span>
                  </p>
                </div>
              </div>
              
              <div className="relative w-full md:w-auto">
                <button disabled className="w-full md:w-auto bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-full cursor-not-allowed shadow-lg opacity-70 flex items-center justify-center gap-2">
                  <span>Sold Out</span>
                  <SacredGeometry type="pentagon-star" className="w-4 h-4 text-white" />
                </button>
                <div className="absolute -rotate-12 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-red-500 text-red-500 px-3 py-1 text-sm font-bold rounded bg-black/20 backdrop-blur-sm">
                  SOLD OUT
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="tour-item relative overflow-hidden p-6 rounded-xl bg-gradient-to-br from-[rgba(254,0,100,0.15)] to-[rgba(91,120,255,0.05)] backdrop-blur-sm border border-[#fe0064]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transform hover:-translate-y-1 transition-transform duration-300"
            >
              {/* Decorative sacred geometry */}
              <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                <SacredGeometry type="golden-spiral" className="w-40 h-40 text-[#fe0064]" />
              </div>
              
              <div className="tour-details flex-grow">
                <div className="flex items-center gap-2">
                  <SacredGeometry type="octagon" className="w-5 h-5 text-[#00ebd6]" />
                  <h3 className="text-xl md:text-2xl font-bold text-[#fe0064]">Maui, HI</h3>
                </div>
                <div className="ml-7 mt-2 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="text-[#5b78ff]">✧</span> 
                    <span>Date: October 22, 2025</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#5b78ff]">✧</span> 
                    <span>Venue: Lahaina Cosmic Center</span>
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-auto mt-4 md:mt-0">
                <button className="w-full md:w-auto bg-gradient-to-r from-[#00ebd6] to-[#5b78ff] text-[#050f28] px-8 py-3 rounded-full shadow-lg hover:from-[#5b78ff] hover:to-[#00ebd6] transition-all duration-300 flex items-center justify-center gap-2">
                  <span>Get Tickets</span>
                  <SacredGeometry type="pentagon-star" className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </GeometricSection>

        <GeometricSection 
          variant="primary" 
          shape="hexagon" 
          title="Cosmic Memories"
          subtitle="Relive the interstellar performances and dive into the harmonic resonance of past journeys."
          alignment="center"
        >
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="past-show relative overflow-hidden rounded-xl bg-gradient-to-br from-[rgba(0,235,214,0.15)] to-transparent border border-[#00ebd6]/20 transform hover:scale-102 transition-transform duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#050f28] via-transparent to-transparent z-10"></div>
              <img src="/uploads/dale with flowers and staff.jpg" alt="Maui Show" className="w-full h-52 md:h-64 object-cover" />
              <div className="p-6 relative z-20">
                <div className="flex items-center gap-2 mb-2">
                  <SacredGeometry type="pentagon-star" className="w-5 h-5 text-[#fe0064]" />
                  <h4 className="text-xl font-bold text-[#00ebd6]">Maui, HI - 2024</h4>
                </div>
                <p className="italic border-l-2 border-[#00ebd6]/40 pl-3">"A magical sunset performance at the historic Lahaina venue. The crowd's energy transcended dimensions."</p>
                
                <div className="mt-4 flex gap-3">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#00ebd6]/10 text-[#00ebd6] text-xs border border-[#00ebd6]/20">
                    Photos
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#00ebd6]/10 text-[#00ebd6] text-xs border border-[#00ebd6]/20">
                    Videos
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#00ebd6]/10 text-[#00ebd6] text-xs border border-[#00ebd6]/20">
                    Setlist
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="past-show relative overflow-hidden rounded-xl bg-gradient-to-br from-[rgba(254,0,100,0.15)] to-transparent border border-[#fe0064]/20 transform hover:scale-102 transition-transform duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#050f28] via-transparent to-transparent z-10"></div>
              <img src="/uploads/whale costume joy happiness.jpg" alt="Kauai Show" className="w-full h-52 md:h-64 object-cover" />
              <div className="p-6 relative z-20">
                <div className="flex items-center gap-2 mb-2">
                  <SacredGeometry type="hexagon" className="w-5 h-5 text-[#00ebd6]" />
                  <h4 className="text-xl font-bold text-[#fe0064]">Kauai, HI - 2023</h4>
                </div>
                <p className="italic border-l-2 border-[#fe0064]/40 pl-3">"An enchanting evening under the stars at Hanalei Bay. The spirits of the whales sang alongside us."</p>
                
                <div className="mt-4 flex gap-3">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#fe0064]/10 text-[#fe0064] text-xs border border-[#fe0064]/20">
                    Photos
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#fe0064]/10 text-[#fe0064] text-xs border border-[#fe0064]/20">
                    Videos
                  </span>
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#fe0064]/10 text-[#fe0064] text-xs border border-[#fe0064]/20">
                    Setlist
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </GeometricSection>

        <GeometricSection 
          variant="secondary" 
          shape="shield" 
          title="Cosmic Tour Map"
          subtitle="Navigate the cosmic coordinates of our musical journey across space and time."
          alignment="center"
          textContained={true}
          backgroundStyle="glass"
          className="mb-16"
        >
          <div className="w-full overflow-hidden relative rounded-xl border border-[#00ebd6]/20">
            {/* Decorative elements */}
            <div className="absolute top-3 left-3 z-30">
              <SacredGeometry type="metatron-cube" className="w-6 h-6 text-[#fe0064] opacity-70 absolute -left-3 -top-3" />
              <button className="bg-gradient-to-r from-[#00ebd6] to-[#5b78ff] text-[#050f28] px-4 py-2 rounded-md z-20 text-sm hover:from-[#5b78ff] hover:to-[#00ebd6] transition-all duration-300 flex items-center gap-2">
                <span>Expand Cosmic Map</span>
                <SacredGeometry type="vesica-piscis" className="w-4 h-4" />
              </button>
            </div>
            
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-[#050f28] to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#050f28] to-transparent"></div>
              <div className="absolute top-0 left-0 h-full w-12 bg-gradient-to-r from-[#050f28] to-transparent"></div>
              <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-[#050f28] to-transparent"></div>
            </div>
            
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1883097.0233626748!2d-157.87105924999998!3d21.289373449999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1645667421851!5m2!1sen!2sus"
              className="w-full border-0 min-h-[450px] md:min-h-[500px]"
              allowFullScreen
              loading="lazy"
              title="Tour Map"
            />
          </div>
        </GeometricSection>
        
        {/* Newsletter Sign Up for Tour Updates */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[rgba(91,120,255,0.2)] to-[rgba(254,0,100,0.1)] p-6 md:p-8 border border-[#5b78ff]/20 mt-8 mb-8"
        >
          <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
            <SacredGeometry type="metatron-cube" className="w-80 h-80 text-[#5b78ff]" />
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-3">
                <SacredGeometry type="sri-yantra" className="w-6 h-6 text-[#fe0064]" />
                <h3 className="text-xl md:text-2xl font-bold text-[#00ebd6]">Cosmic Tour Alerts</h3>
              </div>
              <p className="text-white/80 mb-2">Be the first to know when we're bringing our cosmic vibrations to your dimension.</p>
            </div>
            
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-[#050f28]/80 border border-[#5b78ff]/30 rounded-full px-5 py-3 focus:outline-none focus:border-[#00ebd6] transition-colors w-full"
              />
              <button className="bg-gradient-to-r from-[#fe0064] to-[#5b78ff] text-white px-6 py-3 rounded-full hover:from-[#5b78ff] hover:to-[#fe0064] transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2">
                <span>Get Alerts</span>
                <SacredGeometry type="pentagon-star" className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}