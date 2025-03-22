
import { useState, useEffect } from "react";
import axios from "axios";
import { Track, Album } from "@shared/schema";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface MusicArchivePageProps {}

export default function MusicArchivePage({}: MusicArchivePageProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMusic();
  }, []);

  const fetchMusic = async () => {
    try {
      const [tracksRes, albumsRes] = await Promise.all([
        axios.get('/api/tracks'),
        axios.get('/api/albums')
      ]);
      setTracks(tracksRes.data);
      setAlbums(albumsRes.data);
    } catch (error) {
      console.error('Error fetching music:', error);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      await axios.delete(`/api/tracks/${trackId}`);
      setTracks(tracks.filter(track => track.id !== trackId));
      toast({
        title: "Success",
        description: "Track deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    try {
      await axios.delete(`/api/albums/${albumId}`);
      setAlbums(albums.filter(album => album.id !== albumId));
      toast({
        title: "Success",
        description: "Album deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete album",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-12 p-8">
      <section className="albums-section">
        <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Albums & EPs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map(album => (
            <div key={album.id} className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300 relative">
              <h3 className="text-2xl text-[#00ebd6] mb-3">{album.title}</h3>
              <p className="text-sm mb-2">Release Date: {new Date(album.releaseDate).toLocaleDateString()}</p>
              <p className="text-sm mb-4">{album.description}</p>
              <a
                href={album.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#00ebd6] text-black px-4 py-2 rounded hover:bg-[#00c4b3] transition-colors"
              >
                Stream Now
              </a>
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteAlbum(album.id)}
                >
                  <X className="h-6 w-6" />
                </Button>
              )}
            </div>
          ))}
          {albums.length === 0 && (
            <p className="text-gray-400">No albums available.</p>
          )}
        </div>
      </section>

      <section className="tracks-section">
        <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">All Tracks</h2>
        <div className="grid gap-4">
          {tracks.map(track => (
            <div key={track.id} className="bg-[rgba(10,50,92,0.6)] p-4 rounded-lg hover:bg-[rgba(10,50,92,0.8)] transition-all relative">
              <h3 className="text-xl mb-2 text-[#00ebd6]">{track.title}</h3>
              <div className="flex flex-col space-y-2 mb-4">
                <p className="text-sm">Artist: {track.artist}</p>
                <p className="text-sm">Release Date: {new Date(track.releaseDate).toLocaleDateString()}</p>
              </div>
              <audio
                controls
                className="w-full focus:outline-none"
                style={{
                  height: '40px',
                  filter: 'invert(85%) hue-rotate(175deg) brightness(1.1)'
                }}
              >
                <source src={`/uploads/${track.audioUrl}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteTrack(track.id)}
                >
                  <X className="h-6 w-6" />
                </Button>
              )}
            </div>
          ))}
          {tracks.length === 0 && (
            <p className="text-gray-400">No tracks available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
