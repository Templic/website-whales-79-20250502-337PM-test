/**
 * AboutPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useEffect } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-nebula font-bold text-[#00ebd6] mb-6 cosmic-float">About</h1>
        <section className="biography mb-16 cosmic-glow-box p-8 rounded-xl cosmic-slide-up">
          <div className="section-header mb-8">
            <h2 className="text-4xl text-[#00ebd6] mb-4 inline-block border-b-2 border-[#fe0064]">Biography</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img
                src="uploads/dale with flowers and staff.jpg"
                alt="Dale the Whale portrait with cosmic overlay"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(254,0,100,0.3)] to-[rgba(0,235,214,0.3)]" />
            </div>
            <div className="space-y-4">
              <p className="text-xl leading-relaxed">Dale the Whale is an innovative musician whose sounds traverse the cosmic depths and tropical shores of our imagination. Blending celestial synths with organic rhythms, Dale creates a unique auditory experience that transports listeners to vibrant new dimensions.</p>
              <p className="text-xl leading-relaxed">Born under starry skies and raised with a deep connection to the ocean, Dale's musical journey has been shaped by both the mysteries of the cosmos and the fluid, graceful nature of marine life. This duality is reflected in every note, every beat, and every lyric of his transformative compositions.</p>
              <p className="text-xl leading-relaxed">With influences ranging from cosmic jazz to tropical ambient, Dale continues to push boundaries and explore new sonic territories, creating immersive soundscapes that resonate with the rhythm of the universe.</p>
            </div>
          </div>
        </section>

        <section className="community bg-[rgba(10,50,92,0.3)] p-8 rounded-xl shadow-lg backdrop-blur-sm border border-[rgba(0,235,214,0.2)]">
          <div className="section-header mb-8">
            <h2 className="text-4xl text-[#00ebd6] mb-4 inline-block border-b-2 border-[#fe0064]">Community Engagement</h2>
          </div>
          <p className="text-xl mb-6">Dale is not only known for his innovative sound but also for his dedication to the community. He actively collaborates with like-minded artists and participates in community projects aimed at spreading creative energy and healing positivity.</p>
          <ul className="space-y-4 mb-6">
            <li className="flex items-center text-xl">
              <span className="text-[#fe0064] mr-2">★</span>
              Collaborative music projects with emerging and established artists, creating cosmic jams that transcend traditional boundaries.
            </li>
            <li className="flex items-center text-xl">
              <span className="text-[#fe0064] mr-2">★</span>
              Immersive workshops and masterclasses aimed at nurturing local talent, where participants learn to channel their inner celestial creativity.
            </li>
            <li className="flex items-center text-xl">
              <span className="text-[#fe0064] mr-2">★</span>
              Benefit concerts under the stars, with proceeds supporting ocean conservation and community development initiatives.
            </li>
            <li className="flex items-center text-xl">
              <span className="text-[#fe0064] mr-2">★</span>
              Interactive digital experiences where fans can share their stories and connect through the universal language of music.
            </li>
          </ul>
          <p className="text-xl">Through these initiatives, Dale the Whale continues to foster a creative and inclusive environment that empowers individuals and celebrates the transformative power of music. His community-centered approach reflects his belief that music, like the cosmic forces that inspire it, has the power to unite, heal, and inspire across all boundaries.</p>
        </section>
      </div>
    </>
  );
}