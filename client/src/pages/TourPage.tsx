import { useEffect } from "react";
import ToDoList from "../components/ToDoList";

export default function TourPage() {
  useEffect(() => {
    document.title = "Tour - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      <ToDoList />
      <section className="upcoming-dates bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="section-header text-center mb-8">
          <h2 className="text-4xl font-bold text-[#00ebd6] mb-4">Upcoming Tour Dates</h2>
          <p className="text-xl">Join Dale Loves Whales on an unforgettable cosmic journey. Find your city and grab your tickets now!</p>
        </div>

        <div className="tour-items space-y-6">
          <div className="tour-item bg-[rgba(48,52,54,0.5)] p-6 rounded-lg flex flex-wrap justify-between items-center transform hover:-translate-y-1 transition-transform duration-300">
            <div className="tour-details">
              <h3 className="text-xl font-bold text-[#00ebd6]">Los Angeles, CA</h3>
              <p>Date: August 15, 2025</p>
              <p>Venue: Cosmic Arena</p>
            </div>
            <a href="#" className="bg-[#00ebd6] text-[#303436] px-6 py-2 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg mt-4 md:mt-0">
              Buy Tickets
            </a>
          </div>

          <div className="tour-item bg-[rgba(48,52,54,0.5)] p-6 rounded-lg flex flex-wrap justify-between items-center transform hover:-translate-y-1 transition-transform duration-300">
            <div className="tour-details">
              <h3 className="text-xl font-bold text-[#00ebd6]">New York, NY</h3>
              <p>Date: September 10, 2025</p>
              <p>Venue: Galaxy Hall</p>
            </div>
            <a href="#" className="bg-[#00ebd6] text-[#303436] px-6 py-2 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg mt-4 md:mt-0">
              Buy Tickets
            </a>
          </div>
        </div>
      </section>

      <section className="past-shows bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="section-header text-center mb-8">
          <h2 className="text-4xl font-bold text-[#00ebd6] mb-4">Past Shows</h2>
          <p className="text-xl">Look back at memorable performances and dive into the cosmic memories.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="past-show bg-[rgba(48,52,54,0.5)] rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <img src="/api/placeholder/600/400" alt="Chicago Show" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h4 className="text-xl font-bold text-[#00ebd6] mb-2">Chicago, IL - 2024</h4>
              <p className="italic">"An unforgettable night full of energy and cosmic magic."</p>
            </div>
          </div>

          <div className="past-show bg-[rgba(48,52,54,0.5)] rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <img src="/api/placeholder/600/400" alt="San Francisco Show" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h4 className="text-xl font-bold text-[#00ebd6] mb-2">San Francisco, CA - 2023</h4>
              <p className="italic">"A vibrant performance that captivated the entire crowd."</p>
            </div>
          </div>
        </div>
      </section>

      <section className="map-container bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="section-header text-center mb-8">
          <h2 className="text-4xl font-bold text-[#00ebd6] mb-4">Tour Locations</h2>
          <p className="text-xl">Explore the map to view all past and upcoming cosmic tour stops.</p>
        </div>

        <div className="relative w-full h-[450px] rounded-lg overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0920403325197!2d-122.41941548468147!3d37.77492977975959!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808e74f8fdc3%3A0x4bb645c019a3fd46!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1600000000000!5m2!1sen!2sus"
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            title="Tour Map"
          />
        </div>
      </section>
    </div>
  );
}