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
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Tour Dates</h1>

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
                <h3 className="text-xl font-bold text-[#00ebd6]">Honolulu, HI</h3>
                <p>Date: August 15, 2025</p>
                <p>Venue: Waikiki Beach Shell</p>
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
                <h3 className="text-xl font-bold text-[#00ebd6]">Big Island, HI</h3>
                <p>Date: September 10, 2025</p>
                <p>Venue: Hilo Bay Concert Hall</p>
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
                <h4 className="text-xl font-bold text-[#00ebd6] mb-2">Maui, HI - 2024</h4>
                <p className="italic">"A magical sunset performance at the historic Lahaina venue."</p>
              </div>
            </div>

            <div className="past-show bg-[rgba(48,52,54,0.5)] rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <img src="/uploads/whale costume joy happiness.jpg" alt="Kauai Show" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h4 className="text-xl font-bold text-[#00ebd6] mb-2">Kauai, HI - 2023</h4>
                <p className="italic">"An enchanting evening under the stars at Hanalei Bay."</p>
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
        >
          <div className="w-full overflow-hidden relative">
            <button className="absolute top-3 left-3 bg-white/90 text-[#303436] px-3 py-1 rounded z-20 text-sm hover:bg-white transition-colors">
              View larger map
            </button>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1883097.0233626748!2d-157.87105924999998!3d21.289373449999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1645667421851!5m2!1sen!2sus"
              className="w-full border-0 min-h-[450px]"
              allowFullScreen
              loading="lazy"
              title="Tour Map"
            />
          </div>
        </GeometricSection>
      </div>
    </>
  );
}