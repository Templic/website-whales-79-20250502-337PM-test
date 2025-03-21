
import { useEffect, useState } from "react";
import axios from "axios";

interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  createdAt: string;
}

export default function NewMusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    document.title = "New Music - Dale Loves Whales";
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await axios.get('/api/tracks');
      setTracks(response.data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

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
            <img 
              src="/album cover for feels so good song.png"
              alt="Album Cover - Feels So Good"
              className="w-full max-w-md mx-auto rounded-lg shadow-lg mb-6"
            />
            <p className="text-xl">Release Date: March 14, 2025</p>
            <p className="text-xl">Genre: R&B, Soulful, Cosmic, Conscious</p>
            <p className="text-xl">Artist: Dale The Whale & Featuring AC3-2085</p>
            <div className="music-player mt-6 p-6 bg-[rgba(10,50,92,0.6)] rounded-lg shadow-lg backdrop-blur-sm text-center">
              <h3 className="text-2xl font-semibold mb-4 text-[var(--fill-color)]">Listen Now</h3>
              <audio 
                controls 
                className="w-full focus:outline-none mt-2"
                style={{
                  height: '40px',
                  filter: 'invert(85%) hue-rotate(175deg) brightness(1.1)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)'
                }}
              >
                <source src="/feels-so-good.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        </div>
      </section>

      <section className="music-player space-y-6">
        <h2 className="text-2xl font-bold text-[#00ebd6]">Latest Tracks</h2>
        <div className="grid gap-4">
          {tracks.map(track => (
            <div key={track.id} className="bg-[rgba(10,50,92,0.6)] p-4 rounded-lg hover:bg-[rgba(10,50,92,0.8)] transition-all">
              <h3 className="text-xl mb-2 text-[#00ebd6]">{track.title}</h3>
              <div className="flex flex-col space-y-2 mb-4">
                <p className="text-sm">Artist: {track.artist}</p>
                <p className="text-sm">Added: {new Date(track.createdAt).toLocaleDateString()}</p>
              </div>
              <audio controls className="w-full">
                <source src={`/uploads/${track.audioUrl}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          ))}
          {tracks.length === 0 && (
            <p className="text-center text-gray-400">No tracks available yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
