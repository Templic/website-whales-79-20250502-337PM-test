/**
 * TourPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */

import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import GeometricSection from "@/components/cosmic/GeometricSection";
import HawaiianIslandsMap from "@/components/tour/HawaiianIslandsMap";

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
          <div className="tour-items space-y-4 sm:space-y-6">
            <div className="tour-item cosmic-glow-box p-4 sm:p-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="tour-details mb-4 sm:mb-0">
                <h3 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6]">Honolulu, HI</h3>
                <p className="cosmic-text-responsive-sm">Date: August 15, 2025</p>
                <p className="cosmic-text-responsive-sm">Venue: Waikiki Beach Shell</p>
              </div>
              <div className="relative self-end sm:self-center">
                <button disabled className="bg-gray-500 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full cursor-not-allowed shadow-lg opacity-70 text-sm sm:text-base">
                  Sold Out
                </button>
                <div className="absolute -rotate-12 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-red-500 text-red-500 px-2 py-1 text-xs sm:text-sm font-bold rounded">
                  SOLD OUT
                </div>
              </div>
            </div>

            <div className="tour-item cosmic-glow-box p-4 sm:p-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="tour-details mb-4 sm:mb-0">
                <h3 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6]">Big Island, HI</h3>
                <p className="cosmic-text-responsive-sm">Date: September 10, 2025</p>
                <p className="cosmic-text-responsive-sm">Venue: Hilo Bay Concert Hall</p>
              </div>
              <div className="relative self-end sm:self-center">
                <button disabled className="bg-gray-500 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full cursor-not-allowed shadow-lg opacity-70 text-sm sm:text-base">
                  Sold Out
                </button>
                <div className="absolute -rotate-12 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-red-500 text-red-500 px-2 py-1 text-xs sm:text-sm font-bold rounded">
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
          className="mt-8 sm:mt-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="past-show bg-[rgba(48,52,54,0.5)] rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <div className="w-full aspect-video overflow-hidden">
                <img 
                  src="/uploads/dale with flowers and staff.jpg" 
                  alt="Maui Show" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/images/placeholders/maui-show.jpg";
                  }}
                />
              </div>
              <div className="p-4 sm:p-6">
                <h4 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6] mb-1 sm:mb-2">Maui, HI - 2024</h4>
                <p className="cosmic-text-responsive-sm italic">"A magical sunset performance at the historic Lahaina venue."</p>
              </div>
            </div>

            <div className="past-show bg-[rgba(48,52,54,0.5)] rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <div className="w-full aspect-video overflow-hidden">
                <img 
                  src="/uploads/whale costume joy happiness.jpg" 
                  alt="Kauai Show" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/images/placeholders/kauai-show.jpg";
                  }}
                />
              </div>
              <div className="p-4 sm:p-6">
                <h4 className="cosmic-heading-responsive-sm font-bold text-[#00ebd6] mb-1 sm:mb-2">Kauai, HI - 2023</h4>
                <p className="cosmic-text-responsive-sm italic">"An enchanting evening under the stars at Hanalei Bay."</p>
              </div>
            </div>
          </div>
        </GeometricSection>

        <GeometricSection 
          variant="secondary" 
          shape="shield" 
          title="Interactive Tour Map"
          subtitle="Explore Dale's Hawaiian Islands tour locations - click on map markers for details"
          alignment="center"
          textContained={true}
          backgroundStyle="glass"
          className="mt-8 sm:mt-12 mb-16"
          style={{ minHeight: '550px', display: 'flex', flexDirection: 'column' }}
        >
          <div className="w-full h-full flex-grow overflow-hidden relative bg-black/30 backdrop-blur-sm rounded-xl p-2">
            <a 
              href="https://www.google.com/maps/d/viewer?mid=1O20t-0KO1FJ8E8KW3CWgBVm6JtA&hl=en_US&ll=21.289373449999997%2C-157.8710592&z=9" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="absolute top-3 left-3 bg-white/90 text-[#303436] px-3 py-1 rounded z-20 text-sm hover:bg-white transition-colors"
            >
              View Google Map
            </a>
            
            {/* Interactive Hawaiian Islands Map */}
            <div className="w-full h-full min-h-[450px] rounded-lg overflow-hidden relative">
              <HawaiianIslandsMap className="h-full w-full" />
            </div>
          </div>
        </GeometricSection>
      </div>
    </>
  );
}