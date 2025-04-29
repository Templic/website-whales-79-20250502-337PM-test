/**
 * TourPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 * Updated to use the new responsive geometric shapes.
 */

import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";

// Import geometric shape components from the responsive demo
import { 
  SimpleHexagon, 
  SimpleOctagon,
  SimpleTriangle,
  SimpleStarburst
} from '../components/cosmic/SimpleGeometry';

export default function TourPage() {
  useEffect(() => {
    document.title = "Tour - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="cosmic-heading-responsive font-bold text-[#00ebd6] mb-6">Tour Dates</h1>

        {/* Upcoming Tour Dates Section */}
        <div className="mb-12">
          <h2 className="cosmic-heading-responsive-sm text-[#00ebd6] mb-6 text-center">
            Upcoming Tour Dates
          </h2>
          <p className="text-center mb-8 max-w-2xl mx-auto">
            Join Dale Loves Whales on an unforgettable cosmic journey. Find your city and grab your tickets now!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Honolulu Tour Card */}
            <div className="w-full">
              <SimpleHexagon className="w-full max-w-[350px] mx-auto">
                <h3>Honolulu, HI</h3>
                <p>Date: August 15, 2025<br/>Venue: Waikiki Beach Shell</p>
                <button className="bg-red-500 hover:bg-red-700 text-white rounded relative overflow-hidden">
                  <span className="relative z-10">Sold Out</span>
                  <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                    <span className="absolute -rotate-12 border-2 border-white text-white px-1 py-0.5 text-xs font-bold rounded whitespace-nowrap">
                      SOLD OUT
                    </span>
                  </div>
                </button>
              </SimpleHexagon>
            </div>

            {/* Big Island Tour Card */}
            <div className="w-full">
              <SimpleOctagon className="w-full max-w-[350px] mx-auto">
                <h3>Big Island, HI</h3>
                <p>Date: September 10, 2025<br/>Venue: Hilo Bay Concert Hall</p>
                <button className="bg-red-500 hover:bg-red-700 text-white rounded relative overflow-hidden">
                  <span className="relative z-10">Sold Out</span>
                  <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                    <span className="absolute -rotate-12 border-2 border-white text-white px-1 py-0.5 text-xs font-bold rounded whitespace-nowrap">
                      SOLD OUT
                    </span>
                  </div>
                </button>
              </SimpleOctagon>
            </div>
          </div>
        </div>

        {/* Past Shows Section */}
        <div className="mb-12">
          <h2 className="cosmic-heading-responsive-sm text-[#00ebd6] mb-6 text-center">
            Past Shows
          </h2>
          <p className="text-center mb-8 max-w-2xl mx-auto">
            Look back at memorable performances and dive into the cosmic memories.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Maui Show */}
            <div className="w-full">
              <SimpleTriangle className="w-full max-w-[350px] mx-auto">
                <h3>Maui, HI - 2024</h3>
                <p>"A magical sunset performance at the historic Lahaina venue."</p>
                <button className="bg-blue-500 hover:bg-blue-700 text-white rounded">
                  View Photos
                </button>
              </SimpleTriangle>
            </div>
            
            {/* Kauai Show */}
            <div className="w-full">
              <SimpleStarburst className="w-full max-w-[350px] mx-auto">
                <h3>Kauai, HI - 2023</h3>
                <p>"An enchanting evening under the stars at Hanalei Bay."</p>
                <button className="bg-purple-500 hover:bg-purple-700 text-white rounded">
                  View Photos
                </button>
              </SimpleStarburst>
            </div>
          </div>
        </div>

        {/* Interactive Tour Map Section */}
        <div className="mb-16 mt-12">
          <h2 className="cosmic-heading-responsive-sm text-[#00ebd6] mb-6 text-center">
            Interactive Tour Map
          </h2>
          <p className="text-center mb-8 max-w-2xl mx-auto">
            Explore Dale's Hawaiian Islands tour locations - click on map markers for details
          </p>
          
          <div className="w-full max-w-5xl mx-auto bg-black/30 backdrop-blur-sm rounded-xl p-2" style={{ minHeight: '700px' }}>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4123443.7632127695!2d-167.91141362388457!3d22.40399147399387!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1682970147321!5m2!1sen!2sus"
              className="w-full h-full min-h-[650px] rounded-lg border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hawaiian Islands Map"
            />
          </div>
        </div>

        {/* Featured Photo Gallery Section */}
        <div className="mb-16">
          <h2 className="cosmic-heading-responsive-sm text-[#00ebd6] mb-6 text-center">
            Tour Photo Gallery
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
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
        </div>
      </div>
    </>
  );
}