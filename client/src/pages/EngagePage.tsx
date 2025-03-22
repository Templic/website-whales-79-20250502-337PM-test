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
          {/* Merchandise Items */}
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <img src="https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg" alt="Digital Art" className="w-full rounded-lg mb-4" />
            <h3 className="text-xl font-bold mb-2">Orca Sunrise Cove by Dale The Whale on Etsy.com</h3>
            <p className="mb-4">$45.00</p>
            <a 
  href="https://www.etsy.com/listing/1814098203/dale-loves-whale-digital-art?ls=r&content_source=6ac43cb79853f47bac6e7ec5dc1b9ff1195be02a%253A1814098203" 
  target="_blank" 
  rel="noopener noreferrer" 
  className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors w-full"
>
  Buy Now 
</a>
          </div>
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <img src="https://i.etsystatic.com/54804470/r/il/15c48e/6530624025/il_1588xN.6530624025_7yel.jpg" />
            <h3 className="text-xl font-bold mb-2">Orca Sunrise Cove by Dale The Whale on Etsy.com</h3>
            <p className="mb-4">$45.00</p>
            <a 
          href="https://www.etsy.com/listing/1823352422/dale-loves-whales-divine-digital-cosmic" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors w-full"
          >
          Buy Now 
          </a>
          </div>
        </div>
      </section>
    </div>
  );
}
