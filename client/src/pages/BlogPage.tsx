import { useEffect } from "react";

export default function BlogPage() {
  useEffect(() => {
    document.title = "Blog - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Cosmic Chronicles</h1>
        <p className="text-xl">Dive into Dale's thoughts, stories, and musical journey</p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Example Blog Posts */}
        <article className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <img src="/api/placeholder/600/400" alt="Blog Post Image" className="w-full rounded-lg mb-6" />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#00ebd6]">The Making of Cosmic Waves</h2>
            <p className="text-sm text-gray-400">March 10, 2025</p>
            <p className="line-clamp-3">Exploring the creative process behind my latest album and the inspiration drawn from both the cosmos and ocean depths...</p>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">
              Read More
            </button>
          </div>
        </article>

        <article className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <img src="/api/placeholder/600/400" alt="Blog Post Image" className="w-full rounded-lg mb-6" />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#00ebd6]">Tour Diary: Stellar Nights</h2>
            <p className="text-sm text-gray-400">March 5, 2025</p>
            <p className="line-clamp-3">Join me on a journey through the highlights of our latest cosmic tour, featuring unforgettable moments and fan interactions...</p>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">
              Read More
            </button>
          </div>
        </article>
      </div>

      <div className="flex justify-center mt-8">
        <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg">
          Load More Posts
        </button>
      </div>
    </div>
  );
}
