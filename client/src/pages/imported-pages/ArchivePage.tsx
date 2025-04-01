import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import { AlbumShowcase } from "@/components/music/AlbumShowcase";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Disc, Headphones, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ArchivePage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Notify user about work in progress features
  useEffect(() => {
    toast({
      title: "Archive Features",
      description: "The search and filtering features are coming soon. Currently displaying a showcase of albums.",
      duration: 5000
    });
  }, [toast]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <CosmicBackground />
      
      <div className="container mx-auto pt-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-500">
            Cosmic Music Archive
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Explore our collection of consciousness-transforming music, healing frequencies, and 
            guided meditations designed to elevate your vibration.
          </p>
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
            </TabsContent>
            
            <TabsContent value="singles" className="space-y-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Recent Singles</h2>
                <div className="text-center py-10">
                  <Headphones className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 max-w-md mx-auto">
                    Our singles collection will be available soon, featuring individual frequency tracks 
                    and short meditation experiences.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="meditation" className="space-y-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Guided Meditations</h2>
                <div className="text-center py-10">
                  <Clock className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 max-w-md mx-auto">
                    Our guided meditation collection will be available soon, featuring journeys for different
                    purposes from healing to manifestation.
                  </p>
                </div>
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