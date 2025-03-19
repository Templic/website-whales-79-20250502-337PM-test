
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
            <p className="text-xl">Release Date: March 14, 2025</p>
            <p className="text-xl">Genre: R&B, Soulful, Cosmic, Conscious</p>
            <p className="text-xl">Artist: Dale The Whale & Featuring AC3-2085</p>
          </div>
        </div>
      </section>

      <section className="music-player space-y-6">
        <h2 className="text-2xl font-bold text-[#00ebd6]">Latest Tracks</h2>
        <div className="grid gap-4">
          {tracks.map(track => (
            <div key={track.id} className="bg-[rgba(10,50,92,0.6)] p-4 rounded-lg">
              <h3 className="text-xl mb-2">{track.title}</h3>
              <p className="text-sm mb-2">Artist: {track.artist}</p>
              <audio controls className="w-full">
                <source src={`/uploads/${track.audioUrl}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
