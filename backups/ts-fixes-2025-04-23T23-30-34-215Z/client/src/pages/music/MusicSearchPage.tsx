/**
 * MusicSearchPage.tsx
 * 
 * A specialized search page for music with frequency and description filters
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, Music, Disc, Radio, Waves, Play, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import MusicSearchComponent from '@/components/music/MusicSearchComponent';

// Define track type
interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  frequency?: string;
  description?: string;
  createdAt: string;
  albumId?: number;
  albumName?: string;
  duration?: string;
  imageUrl?: string;
}

// Filter types
type SearchFilterType = 'title' | 'artist' | 'frequency' | 'description' | 'all';

export default function MusicSearchPage() {
  // Get search parameters from URL
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const urlQuery = queryParams.get('q') || '';
  const urlFilter = (queryParams.get('filter') || 'all') as SearchFilterType;
  
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>(urlFilter);
  const [frequencyFilter, setFrequencyFilter] = useState<string | null>(null);

  // Update the document title
  useEffect(() => {
    document.title = searchQuery 
      ? `Music Search: ${searchQuery} - Dale Loves Whales` 
      : 'Music - Dale Loves Whales';
  }, [searchQuery]);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchFilter !== 'all') params.set('filter', searchFilter);
    
    const newUrl = `/music/search${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [searchQuery, searchFilter]);

  // Fetch tracks data
  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ['tracks', searchQuery, searchFilter, frequencyFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (searchFilter !== 'all') params.set('filter', searchFilter);
      if (frequencyFilter) params.set('frequency', frequencyFilter);
      
      const response = await fetch(`/api/tracks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tracks');
      return response.json();
    }
  });

  // Get unique frequency values for filtering
  const frequencies = React.useMemo(() => {
    if (!tracks) return [];
    
    const freqSet = new Set<string>();
    tracks.forEach(track => {
      if (track.frequency) freqSet.add(track.frequency);
    });
    
    return Array.from(freqSet).sort();
  }, [tracks]);

  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is handled by the useQuery hook when dependencies change
  };

  // Handle track selection
  const handleTrackSelect = (track: Track) => {
    window.location.href = `/music/track/${track.id}`;
  };

  // Format frequency for display
  const formatFrequency = (freq: string) => {
    return `${freq} Hz`;
  };

  // Filter tracks by frequency
  const filteredTracks = React.useMemo(() => {
    if (!tracks) return [];
    if (!frequencyFilter) return tracks;
    
    return tracks.filter(track => track.frequency === frequencyFilter);
  }, [tracks, frequencyFilter]);

  // Render tracks grid or skeleton loading state
  const renderTracks = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square relative bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const tracksToShow = filteredTracks.length > 0 ? filteredTracks : tracks;

    if (!tracksToShow || tracksToShow.length === 0) {
      return (
        <div className="text-center py-12">
          <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No tracks found</h3>
          <p className="text-muted-foreground mb-4">
            Try different search terms or browse all music
          </p>
          <Button asChild>
            <a href="/music">Browse All Music</a>
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracksToShow.map(track => (
          <Card key={track.id} className="overflow-hidden transition-all hover:shadow-lg">
            <div 
              className="aspect-square relative bg-muted"
              style={track.imageUrl ? {
                backgroundImage: `url(${track.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              {!track.imageUrl && (
                <div className="flex items-center justify-center h-full">
                  <Music className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Button size="icon" variant="secondary" className="rounded-full h-12 w-12">
                  <Play className="h-6 w-6" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-medium line-clamp-1">{track.title}</h3>
                  <p className="text-muted-foreground">{track.artist}</p>
                </div>
                
                {track.duration && (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{track.duration}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {track.frequency && (
                  <Badge variant="outline">
                    <Waves className="h-3 w-3 mr-1" />
                    {track.frequency} Hz
                  </Badge>
                )}
                
                {track.albumName && (
                  <Badge variant="secondary">
                    <Disc className="h-3 w-3 mr-1" />
                    {track.albumName}
                  </Badge>
                )}
              </div>
              
              {track.description && searchFilter === 'description' && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {track.description}
                </p>
              )}
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button 
                className="w-full" 
                onClick={() => handleTrackSelect(track)}
              >
                Listen Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Filters sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-2">Search</h2>
            <MusicSearchComponent 
              placeholder="Search music..."
              className="w-full"
              onResultClick={handleTrackSelect}
            />
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-medium mb-2">Filter By</h2>
            <Tabs defaultValue={searchFilter} onValueChange={(v) => setSearchFilter(v as SearchFilterType)}>
              <TabsList className="w-full grid grid-cols-2 h-auto">
                <TabsTrigger value="all" className="text-xs py-2">All</TabsTrigger>
                <TabsTrigger value="title" className="text-xs py-2">Title</TabsTrigger>
                <TabsTrigger value="artist" className="text-xs py-2">Artist</TabsTrigger>
                <TabsTrigger value="frequency" className="text-xs py-2">Frequency</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {frequencies.length > 0 && (
            <>
              <Separator />
              
              <div>
                <h2 className="text-lg font-medium mb-2">Frequencies</h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Button
                      variant={!frequencyFilter ? 'default' : 'ghost'}
                      className="w-full justify-start px-2"
                      onClick={() => setFrequencyFilter(null)}
                    >
                      All Frequencies
                    </Button>
                  </div>
                  
                  {frequencies.map(freq => (
                    <div className="flex items-center" key={freq}>
                      <Button
                        variant={frequencyFilter === freq ? 'default' : 'ghost'}
                        className="w-full justify-start px-2"
                        onClick={() => setFrequencyFilter(freq)}
                      >
                        <Waves className="h-4 w-4 mr-2" />
                        {formatFrequency(freq)}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Music</h1>
            {searchQuery && (
              <p className="text-muted-foreground">
                Search results for "{searchQuery}"
                {searchFilter !== 'all' && ` in ${searchFilter}`}
                {frequencyFilter && ` with ${formatFrequency(frequencyFilter)}`}
              </p>
            )}
            
            {tracks && (
              <p className="text-muted-foreground mt-1">
                {filteredTracks.length > 0 ? filteredTracks.length : tracks.length} tracks found
              </p>
            )}
          </div>
          
          {renderTracks()}
        </div>
      </div>
    </div>
  );
}