import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";

export default function EngagePage() {
  useEffect(() => {
    document.title = "Engage - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Engage</h1>
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

          <section className="social-media bg-[rgba(10,50,92,0.6)] p-4 md:p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-[#00ebd6] mb-8 text-center">Connect With Us</h2>
            
            {/* Dale The Whale Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-[#fe0064] text-center border-b border-[#fe0064] pb-2">🐳 Dale The Whale Music & Content 🐳</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
                  <h4 className="text-xl font-bold mb-4 text-[#00ebd6]">Social Media</h4>
                  <div className="space-y-4">
                    <a href="https://www.youtube.com/@DiamondOrca777/featured" target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/youtube.png" alt="YouTube" className="w-6 h-6" />
                      <span>@DiamondOrca777</span>
                    </a>
                    <a href="https://www.instagram.com/dale_loves_whales" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/instagram.png" alt="Instagram" className="w-6 h-6" />
                      <span>dale_loves_whales</span>
                    </a>
                    <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/instagram.png" alt="Instagram" className="w-6 h-6" />
                      <span>dalethewhalemusic</span>
                    </a>
                  </div>
                </div>
                
                <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
                  <h4 className="text-xl font-bold mb-4 text-[#00ebd6]">Music & Podcast</h4>
                  <div className="space-y-4">
                    <a href="https://youtu.be/jzpvkq3Krjg" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/youtube.png" alt="YouTube" className="w-6 h-6" />
                      <span>"Feels So Good" Music Video</span>
                    </a>
                    <a href="https://open.spotify.com/album/3NDnzf57NDrUwkv7QJ22Th" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/spotify.png" alt="Spotify" className="w-6 h-6" />
                      <span>Music on Spotify</span>
                    </a>
                    <a href="https://creators.spotify.com/pod/show/dale-ham" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/spotify.png" alt="Spotify" className="w-6 h-6" />
                      <span>🕊🕉 THE IRIDESCENT DOVE Podcast</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* AC3-2085 Section */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-[#fe0064] text-center border-b border-[#fe0064] pb-2">🎵 AC3-2085 Music & Business 🎵</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
                  <h4 className="text-xl font-bold mb-4 text-[#00ebd6]">Music Production</h4>
                  <div className="space-y-4">
                    <a href="https://www.youtube.com/channel/UCewdO8AO3aBVzgWzeMG5paQ" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/youtube.png" alt="YouTube" className="w-6 h-6" />
                      <span>AC3-2085 Channel</span>
                    </a>
                    <a href="https://www.instagram.com/ac3productionsllc" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/instagram.png" alt="Instagram" className="w-6 h-6" />
                      <span>ac3productionsllc</span>
                    </a>
                  </div>
                </div>

                <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
                  <h4 className="text-xl font-bold mb-4 text-[#00ebd6]">Business Inquiries</h4>
                  <div className="space-y-4">
                    <a href="mailto:ac3productionsllc@gmail.com" 
                      className="flex items-center gap-3 text-white hover:text-[#00ebd6] transition-colors">
                      <img src="/icons/email.png" alt="Email" className="w-6 h-6" />
                      <span>Contact for Business</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="merchandise bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Featured Merchandise</h2>
            <div className="grid md:grid-cols-3 gap-6">
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
      </div>
    </>
  );
}