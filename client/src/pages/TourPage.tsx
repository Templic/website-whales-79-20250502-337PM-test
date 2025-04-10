/**
 * TourPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */

import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import GeometricSection from "@/components/cosmic/GeometricSection";

export default function TourPage() {
  useEffect(() => {
    document.title = "Tour - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="cosmic-heading-responsive font-bold text-[#00ebd6] mb-6">Tour Dates</h1>

        <GeometricSection 
          variant="secondary" 
          shape="trapezoid" 
          title="Upcoming Tour Dates"
          subtitle="Join Dale Loves Whales on an unforgettable cosmic journey. Find your city and grab your tickets now!"
          alignment="center"
        >
          <div className="tour-items space-y-6">
            <div className="tour-item cosmic-glow-box p-6 rounded-lg flex flex-wrap justify-between items-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="tour-details">
                <h3 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6]">Honolulu, HI</h3>
                <p className="cosmic-text-responsive-sm">Date: August 15, 2025</p>
                <p className="cosmic-text-responsive-sm">Venue: Waikiki Beach Shell</p>
              </div>
              <div className="relative">
                <button disabled className="bg-gray-500 text-white px-6 py-2 rounded-full cursor-not-allowed shadow-lg mt-4 md:mt-0 opacity-70">
                  Sold Out
                </button>
                <div className="absolute -rotate-12 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-red-500 text-red-500 px-2 py-1 text-sm font-bold rounded">
                  SOLD OUT
                </div>
              </div>
            </div>

            <div className="tour-item cosmic-glow-box p-6 rounded-lg flex flex-wrap justify-between items-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="tour-details">
                <h3 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6]">Big Island, HI</h3>
                <p className="cosmic-text-responsive-sm">Date: September 10, 2025</p>
                <p className="cosmic-text-responsive-sm">Venue: Hilo Bay Concert Hall</p>
              </div>
              <div className="relative">
                <button disabled className="bg-gray-500 text-white px-6 py-2 rounded-full cursor-not-allowed shadow-lg mt-4 md:mt-0 opacity-70">
                  Sold Out
                </button>
                <div className="absolute -rotate-12 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-red-500 text-red-500 px-2 py-1 text-sm font-bold rounded">
                  SOLD OUT
                </div>
              </div>
            </div>
          </div>
        </GeometricSection>

        <GeometricSection 
          variant="primary" 
          shape="hexagon" 
          title="Past Shows"
          subtitle="Look back at memorable performances and dive into the cosmic memories."
          alignment="center"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="past-show bg-[rgba(48,52,54,0.5)] rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <img src="/uploads/dale with flowers and staff.jpg" alt="Maui Show" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h4 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6] mb-2">Maui, HI - 2024</h4>
                <p className="cosmic-text-responsive-sm italic">"A magical sunset performance at the historic Lahaina venue."</p>
              </div>
            </div>

            <div className="past-show bg-[rgba(48,52,54,0.5)] rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <img src="/uploads/whale costume joy happiness.jpg" alt="Kauai Show" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h4 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6] mb-2">Kauai, HI - 2023</h4>
                <p className="cosmic-text-responsive-sm italic">"An enchanting evening under the stars at Hanalei Bay."</p>
              </div>
            </div>
          </div>
        </GeometricSection>

        <GeometricSection 
          variant="secondary" 
          shape="shield" 
          title="Tour Locations"
          subtitle="Explore the map to view all past and upcoming cosmic tour stops."
          alignment="center"
          textContained={true}
          backgroundStyle="glass"
          className="mb-16"
          style={{ minHeight: '550px', display: 'flex', flexDirection: 'column' }}
        >
          <div className="w-full h-full flex-grow overflow-hidden relative bg-black/30 backdrop-blur-sm rounded-xl p-2">
            <a 
              href="https://www.google.com/maps/d/viewer?mid=1O20t-0KO1FJ8E8KW3CWgBVm6JtA&hl=en_US&ll=21.289373449999997%2C-157.8710592&z=9" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="absolute top-3 left-3 bg-white/90 text-[#303436] px-3 py-1 rounded z-20 text-sm hover:bg-white transition-colors"
            >
              View larger map
            </a>
            
            {/* Alternative map display using an image with CSS styling to provide a map-like appearance */}
            <div className="w-full h-full min-h-[450px] rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c2738] p-4">
                <div className="text-center mb-6">
                  <h3 className="cosmic-heading-responsive-sm text-[#00ebd6]">Hawaiian Islands Tour Map</h3>
                  <p className="cosmic-text-responsive-sm text-white/80 mt-2">Tour locations across the Hawaiian islands</p>
                </div>
                
                <div className="w-full max-w-3xl aspect-video bg-[#173d56] rounded-lg relative overflow-hidden">
                  {/* Map points */}
                  <div className="absolute top-[30%] left-[35%] h-4 w-4 bg-[#00ebd6] rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-[#00ebd6] rounded-full animate-ping opacity-75"></div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-[#00ebd6]">Honolulu</div>
                  </div>
                  
                  <div className="absolute top-[40%] left-[60%] h-4 w-4 bg-[#fe0064] rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-[#fe0064] rounded-full animate-ping opacity-75"></div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-[#fe0064]">Hilo</div>
                  </div>
                  
                  <div className="absolute top-[25%] left-[20%] h-4 w-4 bg-[#7c3aed] rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-[#7c3aed] rounded-full animate-ping opacity-75"></div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-[#7c3aed]">Lahaina</div>
                  </div>
                  
                  <div className="absolute top-[15%] left-[70%] h-4 w-4 bg-[#f59e0b] rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-[#f59e0b] rounded-full animate-ping opacity-75"></div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-[#f59e0b]">Hanalei</div>
                  </div>
                  
                  {/* Map styling */}
                  <div className="absolute inset-0 bg-[url('/uploads/hawaii-map-silhouette.svg')] bg-contain bg-center bg-no-repeat opacity-50"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(10,30,50,0.5)]"></div>
                </div>
                
                <div className="mt-8 cosmic-text-responsive-sm text-center max-w-2xl text-white/70">
                  <p>View the interactive map by clicking the button in the top left corner</p>
                  <p className="mt-2">A custom map is being displayed due to external map service limitations</p>
                </div>
              </div>
            </div>
          </div>
        </GeometricSection>
      </div>
    </>
  );
}