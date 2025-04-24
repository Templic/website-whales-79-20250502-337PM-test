/**
 * MusicSearchComponent.tsx
 * 
 * A specialized search component for the music section that allows
 * searching tracks with dropdown results and filters for title, artist,
 * frequency, and description
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Search, Music, Disc, Radio, Waves } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Track type definition
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
}

// Filter types - different search categories
type SearchFilterType = 'title' | 'artist' | 'frequency' | 'description' | 'all';

interface MusicSearchComponentProps {
  onResultClick?: (track: Track) => void;
  className?: string;
  placeholder?: string;
}

export default function MusicSearchComponent({
  onResultClick,
  className = '',
  placeholder = 'Search music...'
}: MusicSearchComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>('all');

  // Fetch tracks data
  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ['tracks'],
    queryFn: () => fetch('/api/tracks').then(res => res.json()),
    staleTime: 60 * 1000, // 1 minute
  });

  // Filter tracks based on search query and selected filter
  const filteredTracks = React.useMemo(() => {
    if (!searchQuery.trim() || !tracks) return [];
    
    const query = searchQuery.toLowerCase().trim();
    
    return tracks.filter(track => {
      switch(searchFilter) {
        case 'title':
          return track.title.toLowerCase().includes(query);
        case 'artist':
          return track.artist.toLowerCase().includes(query);
        case 'frequency':
          return track.frequency?.toLowerCase().includes(query);
        case 'description':
          return track.description?.toLowerCase().includes(query);
        case 'all':
        default:
          return (
            track.title.toLowerCase().includes(query) ||
            track.artist.toLowerCase().includes(query) ||
            (track.frequency?.toLowerCase().includes(query) || false) ||
            (track.description?.toLowerCase().includes(query) || false)
          );
      }
    }).slice(0, 8); // Limit results
  }, [tracks, searchQuery, searchFilter]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim().length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/music/search?q=${encodeURIComponent(searchQuery)}&filter=${searchFilter}`;
    }
  };

  // Handle result click
  const handleResultClick = (track: Track) => {
    setIsOpen(false);
    if (onResultClick) {
      onResultClick(track);
    } else {
      // Navigate to track details page if no callback provided
      window.location.href = `/music/track/${track.id}`;
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-200 text-black">{part}</span> : part
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={placeholder}
                className="pl-8 pr-10"
                value={searchQuery}
                onChange={handleInputChange}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[500px]" align="start">
            <Command>
              <Tabs defaultValue="all" onValueChange={(v) => setSearchFilter(v as SearchFilterType)}>
                <div className="border-b px-3 pt-2">
                  <TabsList className="w-full grid grid-cols-5">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="title" className="text-xs">Title</TabsTrigger>
                    <TabsTrigger value="artist" className="text-xs">Artist</TabsTrigger>
                    <TabsTrigger value="frequency" className="text-xs">Frequency</TabsTrigger>
                    <TabsTrigger value="description" className="text-xs">Description</TabsTrigger>
                  </TabsList>
                </div>
                
                <CommandInput 
                  placeholder={`Search by ${searchFilter !== 'all' ? searchFilter : 'anything'}...`}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="h-9"
                />
                <CommandList>
                  {isLoading ? (
                    <CommandEmpty>Loading music...</CommandEmpty>
                  ) : (
                    <>
                      {filteredTracks.length === 0 ? (
                        <CommandEmpty>No music found</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {filteredTracks.map(track => (
                            <CommandItem 
                              key={track.id}
                              onSelect={() => handleResultClick(track)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-start gap-2 w-full">
                                <div className="bg-muted rounded-md w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                  {track.frequency ? (
                                    <Waves className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Music className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                                
                                <div className="flex-1 overflow-hidden">
                                  <div className="font-medium">
                                    {highlightMatch(track.title, searchQuery)}
                                  </div>
                                  
                                  <div className="text-sm text-muted-foreground truncate">
                                    {highlightMatch(track.artist, searchQuery)}
                                    {track.albumName && ` • ${track.albumName}`}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {track.frequency && (
                                      <Badge variant="outline" className="text-xs py-0 px-1">
                                        {highlightMatch(track.frequency, searchQuery)}Hz
                                      </Badge>
                                    )}
                                    
                                    {track.duration && (
                                      <span className="text-xs text-muted-foreground">
                                        {track.duration}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {track.description && searchFilter === 'description' && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {highlightMatch(track.description, searchQuery)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Tabs>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button type="submit" className="sr-only">Search</Button>
    </form>
  );
}