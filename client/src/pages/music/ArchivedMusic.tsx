/**
 * ArchivedMusic.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useState, useEffect } from "react";
import axios from "axios";
import { Track, Album } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X, Disc, Headphones, Clock, Search, Play } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { AlbumShowcase } from "@/components/music/AlbumShowcase";
import { DynamicPlaylists, RecommendedPlaylists } from "@/components/music/DynamicPlaylists";
import { playlists } from "@/data/playlists";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CosmicReveal } from "@/components/features/cosmic/CosmicReveal";

interface ArchivedMusicProps {}

export default function ArchivedMusic({}: ArchivedMusicProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMusic();
    
    // Notify user about work in progress features
    toast({
      title: "Archive Features",
      description: "The search and filtering features are coming soon. Currently displaying a showcase of albums.",
      duration: 5000
    });
  }, [toast]);

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

  const handleDeleteTrack = async (trackId: number) => {
    try {
      await axios.delete(`/api/tracks/${trackId}`);
      setTracks(tracks.filter(track => track.id !== Number(trackId)));
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

  const handleDeleteAlbum = async (albumId: number) => {
    try {
      await axios.delete(`/api/albums/${albumId}`);
      setAlbums(albums.filter(album => album.id !== Number(albumId)));
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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <CosmicBackground />
      <SpotlightEffect />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-500">
            Archived Music
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Explore our collection of consciousness-transforming music, healing frequencies, and 
            guided meditations designed to elevate your vibration.
          </p>
        </div>
        
        {/* Hero Image */}
        <div className="relative h-[500px] w-full overflow-hidden rounded-lg mb-12">
          <img
            src="uploads/silhouette stars.jpg"
            alt="Music Archive"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Search and Filter */}
        <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input 
                  type="text"
                  placeholder="Search by title, frequency or description..."
                  className="pl-10 bg-black/20 border-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Button variant="outline" className="w-full border-white/10">
                <Clock className="mr-2 h-4 w-4" />
                Sort by Date
              </Button>
            </div>
            
            <div>
              <Button variant="outline" className="w-full border-white/10">
                <Disc className="mr-2 h-4 w-4" />
                Filter by Type
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="mb-16">
          <Tabs defaultValue="albums" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-black/20 backdrop-blur-sm">
              <TabsTrigger value="albums">
                <Disc className="h-4 w-4 mr-2" />
                Albums
              </TabsTrigger>
              <TabsTrigger value="singles">
                <Headphones className="h-4 w-4 mr-2" />
                Singles
              </TabsTrigger>
              <TabsTrigger value="meditation">
                <Clock className="h-4 w-4 mr-2" />
                Meditations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="albums" className="space-y-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Featured Albums</h2>
                <AlbumShowcase />
              </div>
              
              <section className="albums-section">
                <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">Albums & EPs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {albums.map(album => (
                    <div key={album.id} className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300 relative">
                      <h3 className="text-2xl text-[#00ebd6] mb-3">{album.title}</h3>
                      <p className="text-sm mb-2">Release Date: {album.releaseDate ? new Date(album.releaseDate).toLocaleDateString() : 'TBA'}</p>
                      <p className="text-sm mb-4">{album.description || 'No description available'}</p>
                      <a
                        href={`/album/${album.id}`}
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
            </TabsContent>
            
            <TabsContent value="singles" className="space-y-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Recent Singles</h2>
                
                <CosmicReveal delay={0.2}>
                  <RecommendedPlaylists 
                    playlists={playlists.filter(p => p.category === 'sleep' || p.category === 'astral')}
                    onSelect={(playlist) => {
                      toast({
                        title: "Playlist Selected",
                        description: `You've selected the "${playlist.title}" playlist. Audio player coming soon.`,
                        duration: 3000
                      });
                    }}
                  />
                </CosmicReveal>
              </div>
              
              <section className="tracks-section">
                <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">All Tracks</h2>
                <div className="grid gap-4">
                  {tracks.map(track => (
                    <div key={track.id} className="bg-[rgba(10,50,92,0.6)] p-4 rounded-lg hover:bg-[rgba(10,50,92,0.8)] transition-all relative">
                      <h3 className="text-xl mb-2 text-[#00ebd6]">{track.title}</h3>
                      <div className="flex flex-col space-y-2 mb-4">
                        <p className="text-sm">Artist: {track.artist}</p>
                        <p className="text-sm">Duration: {track.duration || 'Unknown'}</p>
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
            </TabsContent>
            
            <TabsContent value="meditation" className="space-y-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Guided Meditations</h2>
                <DynamicPlaylists 
                  playlists={playlists.filter(p => p.category === 'meditation' || p.category === 'healing')}
                  onPlay={(trackId) => {
                    toast({
                      title: "Audio Feature",
                      description: `The audio player for track ${trackId} will be implemented soon.`,
                      duration: 3000
                    });
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Call to Action */}
        <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-8 mb-16 text-center">
          <h2 className="text-2xl font-semibold mb-3">Join Our Archive Community</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-6">
            Get early access to new releases, exclusive ceremonies, and cosmic events
            by joining our community of frequency explorers.
          </p>
          <Button className="bg-gradient-to-r from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600">
            Subscribe for Updates
          </Button>
        </div>
      </div>
    </div>
  );
}