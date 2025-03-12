import { useEffect } from "react";

export default function EngagePage() {
  useEffect(() => {
    document.title = "Engage - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      <section className="banner bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <img src="/api/placeholder/1200/400" alt="Main Banner" className="w-full rounded-lg mb-6" />
        <div className="cta-buttons flex flex-wrap gap-4 justify-center">
          <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg">
            Join The Whale Pod
          </button>
          <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg">
            Share Your Experience
          </button>
        </div>
      </section>

      <section className="fan-reactions bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Fan Reactions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Fan Review Cards */}
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <p className="italic mb-4">"Amazing performance! The cosmic vibes were unreal!"</p>
            <p className="text-sm">- Sarah W.</p>
          </div>
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <p className="italic mb-4">"Dale's music takes you on a journey through space and time."</p>
            <p className="text-sm">- Michael R.</p>
          </div>
        </div>
      </section>

      <section className="social-media bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Social Media</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Latest Updates</h3>
            {/* Social Media Feed Placeholder */}
            <p>Follow our social media channels for real-time updates and behind-the-scenes content.</p>
          </div>
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Fan Posts</h3>
            {/* Fan Posts Placeholder */}
            <p>See what other fans are saying about Dale Loves Whales.</p>
          </div>
        </div>
      </section>

      <section className="merchandise bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Featured Merchandise</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Example Merchandise Items */}
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <img src="/api/placeholder/300/300" alt="T-Shirt" className="w-full rounded-lg mb-4" />
            <h3 className="text-xl font-bold mb-2">Cosmic Wave T-Shirt</h3>
            <p className="mb-4">$29.99</p>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors w-full">
              Buy Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
