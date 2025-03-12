import { useEffect } from "react";

export default function MusicReleasePage() {
  useEffect(() => {
    document.title = "New Music - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      <section className="main-banner bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <img 
            src="/album cover for feels so good song.png" 
            alt="Album Cover" 
            className="w-full rounded-lg shadow-xl"
          />
          <div className="release-info space-y-4">
            <h1 className="text-4xl font-bold text-[#00ebd6]">FEELS SO GOOD</h1>
            <p className="text-xl">Release Date: March 14, 2025</p>
            <p className="text-xl">Genre: R&B, Soulful, Cosmic, Conscious</p>
            <p className="text-xl">Artist: Dale The Whale & Featuring AC3-2085</p>
          </div>
        </div>
      </section>

      <section className="music-player bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Listen Now</h2>
        <div className="player-controls flex gap-4 mb-6">
          <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">Play</button>
          <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">Pause</button>
          <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">Next</button>
          <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">Previous</button>
        </div>
        <ul className="tracklist space-y-4">
          <li className="flex justify-between items-center bg-[rgba(48,52,54,0.5)] p-4 rounded-lg">
            Track 1 <span>3:45</span>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">Play</button>
          </li>
          <li className="flex justify-between items-center bg-[rgba(48,52,54,0.5)] p-4 rounded-lg">
            Track 2 <span>4:00</span>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">Play</button>
          </li>
        </ul>
      </section>

      <section className="streaming-links bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Stream on Your Favorite Platform</h2>
        <div className="platform-links grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="#" className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg text-center hover:bg-[#fe0064] hover:text-white transition-colors">Spotify</a>
          <a href="#" className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg text-center hover:bg-[#fe0064] hover:text-white transition-colors">Apple Music</a>
          <a href="#" className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg text-center hover:bg-[#fe0064] hover:text-white transition-colors">YouTube Music</a>
          <a href="#" className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg text-center hover:bg-[#fe0064] hover:text-white transition-colors">Amazon Music</a>
        </div>
      </section>

      <section className="call-to-action text-center">
        <button className="bg-[#00ebd6] text-[#303436] px-8 py-3 rounded-full text-xl font-bold hover:bg-[#fe0064] hover:text-white transition-colors shadow-lg hover:shadow-xl">
          Buy Now
        </button>
      </section>
    </div>
  );
}
