import { useEffect } from "react";

export default function MusicArchivePage() {
  useEffect(() => {
    document.title = "Music Archive - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      <section className="header-section text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Music Archive</h1>
        <p className="text-xl max-w-2xl mx-auto">Explore Dale's complete discography, from cosmic beginnings to latest stellar releases.</p>
      </section>

      <section className="albums-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Example Album Card */}
        <div className="album-card bg-[rgba(10,50,92,0.6)] rounded-xl overflow-hidden shadow-lg hover:transform hover:scale-105 transition-transform duration-300">
          <img src="/api/placeholder/400/400" alt="Album Cover" className="w-full h-64 object-cover" />
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#00ebd6] mb-2">Cosmic Waves</h3>
            <p className="text-sm mb-4">Released: January 2024</p>
            <div className="flex justify-between items-center">
              <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">
                Listen Now
              </button>
              <span className="text-sm">12 tracks</span>
            </div>
          </div>
        </div>

        {/* More album cards would be dynamically generated here */}
      </section>

      <section className="playlists bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm mt-12">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Featured Playlists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="playlist-item p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
            <h3 className="text-lg font-bold mb-2">Best of Dale</h3>
            <p className="text-sm mb-4">A curated collection of Dale's most popular tracks</p>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">
              Play All
            </button>
          </div>
          <div className="playlist-item p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
            <h3 className="text-lg font-bold mb-2">Cosmic Journey</h3>
            <p className="text-sm mb-4">Experience the evolution of Dale's cosmic sound</p>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">
              Play All
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
