import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";

export default function TourPage() {
  useEffect(() => {
    document.title = "Tour - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Tour Dates</h1>

        <section className="upcoming-dates bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm border border-[rgba(0,235,214,0.2)] mb-8">
          <div className="section-header text-center mb-8">
            <h2 className="text-4xl font-bold text-[#00ebd6] mb-4">Upcoming Tour Dates</h2>
            <p className="text-xl">Join Dale Loves Whales on an unforgettable cosmic journey. Find your city and grab your tickets now!</p>
          </div>
        </section>

        <section className="map-container bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm border border-[rgba(0,235,214,0.2)]">
          <div className="section-header text-center mb-8">
            <h2 className="text-4xl font-bold text-[#00ebd6] mb-4">Tour Locations</h2>
            <p className="text-xl">Explore the map to view all past and upcoming cosmic tour stops.</p>
          </div>

          <div className="relative w-full h-[450px] rounded-lg overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1883097.0233626748!2d-157.87105924999998!3d21.289373449999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1645667421851!5m2!1sen!2sus"
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              title="Tour Map"
            />
          </div>
        </section>
      </div>
    </>
  );
}