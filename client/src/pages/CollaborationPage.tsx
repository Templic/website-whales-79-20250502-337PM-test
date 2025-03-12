import { useEffect } from "react";

export default function CollaborationPage() {
  useEffect(() => {
    document.title = "Collaboration - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Collaborate with Dale</h1>
        <p className="text-xl">Explore opportunities for creative partnerships and sponsorships</p>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Musical Collaborations</h2>
          <p className="mb-6">Interested in creating cosmic soundscapes together? Let's explore the possibilities of musical fusion.</p>
          <ul className="space-y-4 list-none">
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Studio Sessions</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Remote Collaborations</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Live Performance Features</span>
            </li>
          </ul>
          <button className="mt-6 bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg">
            Submit Proposal
          </button>
        </div>

        <div className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Brand Partnerships</h2>
          <p className="mb-6">Looking to align your brand with cosmic vibes? Explore sponsorship opportunities.</p>
          <ul className="space-y-4 list-none">
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Event Sponsorships</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Tour Partnerships</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Content Creation</span>
            </li>
          </ul>
          <button className="mt-6 bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg">
            Partner With Us
          </button>
        </div>
      </section>

      <section className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Past Collaborations</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Example Past Collaboration */}
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <img src="/api/placeholder/300/300" alt="Collaboration" className="w-full rounded-lg mb-4" />
            <h3 className="text-xl font-bold mb-2">Cosmic Wave Festival</h3>
            <p className="text-sm">A groundbreaking collaboration bringing together artists from across the galaxy.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
