import { useEffect } from "react";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      <section className="biography bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="section-header mb-8">
          <h2 className="text-[#00ebd6] text-4xl mb-4 inline-block border-b-2 border-[#fe0064]">Biography</h2>
        </div>
        <article className="grid md:grid-cols-2 gap-8 items-center">
          <div className="bio-image relative rounded-xl overflow-hidden shadow-xl">
              <img src="http://replit-objstore-a2ce4e13-325a-4438-a65a-e8131b355af1.replit.dev/uploads/20250321_214034.jpg"  
              alt="Dale the Whale portrait with cosmic overlay"
              className="w-full h-auto transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(254,0,100,0.3)] to-[rgba(0,235,214,0.3)] pointer-events-none" />
          </div>
          <div className="bio-text space-y-4">
            <p className="text-lg">Dale the Whale is an innovative musician whose sounds traverse the cosmic depths and tropical shores of our imagination. Blending celestial synths with organic rhythms, Dale creates a unique auditory experience that transports listeners to vibrant new dimensions.</p>
            <p className="text-lg">Born under starry skies and raised with a deep connection to the ocean, Dale's musical journey has been shaped by both the mysteries of the cosmos and the fluid, graceful nature of marine life. This duality is reflected in every note, every beat, and every lyric of his transformative compositions.</p>
            <p className="text-lg">With influences ranging from cosmic jazz to tropical ambient, Dale continues to push boundaries and explore new sonic territories, creating immersive soundscapes that resonate with the rhythm of the universe.</p>
          </div>
        </article>
      </section>

      <section className="community bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="section-header mb-8">
          <h2 className="text-[#00ebd6] text-4xl mb-4 inline-block border-b-2 border-[#fe0064]">Community Engagement</h2>
        </div>
        <article className="space-y-6">
          <p className="text-lg">Dale is not only known for his innovative sound but also for his dedication to the community. He actively collaborates with like-minded artists and participates in community projects aimed at spreading creative energy and healing positivity.</p>
          <ul className="space-y-4 list-none pl-6">
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Collaborative music projects with emerging and established artists, creating cosmic jams that transcend traditional boundaries.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Immersive workshops and masterclasses aimed at nurturing local talent, where participants learn to channel their inner celestial creativity.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Benefit concerts under the stars, with proceeds supporting ocean conservation and community development initiatives.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#fe0064]">★</span>
              <span>Interactive digital experiences where fans can share their stories and connect through the universal language of music.</span>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
