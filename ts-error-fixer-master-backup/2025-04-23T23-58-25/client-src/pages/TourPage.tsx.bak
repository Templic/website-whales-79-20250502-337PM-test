/**
 * TourPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */import React from "react";
import React from "react";


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
          style={{ minHeight: '700px', display: 'flex', flexDirection: 'column' }}
        >
          <div className="w-full h-full flex-grow overflow-hidden relative bg-black/30 backdrop-blur-sm rounded-xl p-2">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d967162.6791891221!2d-157.87105924999998!3d21.289373449999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1645667421851!5m2!1sen!2sus"
                className="w-full h-full min-h-[650px] rounded-lg border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Hawaiian Islands Map"
              />
            </div>
        </GeometricSection>
      </div>
    </>
  );
}