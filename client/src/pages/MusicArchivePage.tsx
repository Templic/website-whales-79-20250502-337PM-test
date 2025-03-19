import { useEffect, useState } from "react";
import axios from "axios";
import { Track, Album } from "@shared/schema";
import AudioPlayer from "@/components/AudioPlayer"; // Assuming AudioPlayer is in a separate file


interface MusicArchivePageProps {}

export default function MusicArchivePage({}: MusicArchivePageProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    document.title = "Music Archive - Dale Loves Whales";
    fetchMusicContent();
  }, []);

  const fetchMusicContent = async () => {
    try {
      const [tracksResponse, albumsResponse] = await Promise.all([
        axios.get('/api/tracks'),
        axios.get('/api/albums')
      ]);
      setTracks(tracksResponse.data);
      setAlbums(albumsResponse.data);
    } catch (error) {
      console.error('Error fetching music content:', error);
    }
  };

  const handleTrackDeleted = () => {
    fetchMusicContent();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Music Archive</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map(track => (
          <div key={track.id} className="border p-4 rounded-lg">
            <h3 className="font-bold">{track.title}</h3>
            <p className="text-gray-600">{track.artist}</p>
            <audio controls src={`/uploads/${track.audioUrl}`} className="mt-2 w-full" />
            <DeleteButton trackId={track.id} onDelete={handleTrackDeleted} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-12 p-8">
      <section className="albums-section">
        <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Albums & EPs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map(album => (
            <div key={album.id} className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-2xl text-[#00ebd6] mb-3">{album.title}</h3>
              <p className="text-sm mb-2">Release Date: {new Date(album.releaseDate).toLocaleDateString()}</p>
              <p className="text-sm mb-4">{album.description}</p>
              {album.coverUrl && (
                <img 
                  src={album.coverUrl} 
                  alt={`${album.title} cover`}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <a 
                href={album.streamUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-[#fe0064] text-white px-4 py-2 rounded-full hover:bg-opacity-80 transition-all"
              >
                Stream Now
              </a>
            </div>
          ))}
          {albums.length === 0 && (
            <p className="text-center text-gray-400 col-span-full">No albums available yet.</p>
          )}
        </div>
      </section>

      <section className="tracks-section">
        <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">All Tracks</h2>
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