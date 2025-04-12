/**
 * MusicSearchComponent.tsx
 * 
 * A specialized search component for the music section that allows
 * searching by title, frequency, or description with dropdown results
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Music, Hash, FileText, XCircle } from 'lucide-react';
import axios from 'axios';

// Track interface
interface Track {
  id: number;
  title: string;
  frequency?: string;
  description?: string;
  imageUrl?: string;
  releaseDate?: string;
  duration?: string;
}

interface MusicSearchComponentProps {
  onResultClick?: (track: Track) => void;
  className?: string;
  placeholder?: string;
}

export default function MusicSearchComponent({
  onResultClick,
  className = '',
  placeholder = 'Search by title, frequency or description...'
}: MusicSearchComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'title' | 'frequency' | 'description'>('all');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, navigate] = useLocation();

  // Search function with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        // Call the API with filters
        const response = await axios.get('/api/music/search', {
          params: {
            q: searchQuery,
            filter: searchFilter !== 'all' ? searchFilter : undefined
          }
        });
        
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Error searching music:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, searchFilter]);

  // Handle clicking a search result
  const handleResultClick = (track: Track) => {
    // Close the popover
    setOpen(false);
    
    // Clear the search
    setSearchQuery('');
    
    // If a callback was provided, use it
    if (onResultClick) {
      onResultClick(track);
      return;
    }
    
    // Otherwise, navigate to the track page
    navigate(`/music/${track.id}`);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/music?q=${encodeURIComponent(searchQuery)}&filter=${searchFilter}`);
      setOpen(false);
    }
  };

  // Get the highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-cyan-500/20 text-cyan-300">{part}</span> : part
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-10 py-2 w-full bg-black/30 focus:bg-black/40 transition-colors border-indigo-700/30 focus:border-indigo-500/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 opacity-70 hover:opacity-100"
                  onClick={() => setSearchQuery('')}
                  type="button"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[60vh] overflow-auto" 
            align="start"
          >
            <Command className="rounded-lg border-0">
              <div className="px-3 pt-3 pb-1">
                <Tabs defaultValue={searchFilter} onValueChange={(v: any) => setSearchFilter(v)} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="all" className="text-xs">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="title" className="text-xs">
                      <Music className="h-3 w-3 mr-1" />
                      Title
                    </TabsTrigger>
                    <TabsTrigger value="frequency" className="text-xs">
                      <Hash className="h-3 w-3 mr-1" />
                      Frequency
                    </TabsTrigger>
                    <TabsTrigger value="description" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Description
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CommandInput
                placeholder="Type to search music..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-b-0"
              />
              <CommandList>
                {loading ? (
                  <div className="py-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Searching music...</p>
                  </div>
                ) : (
                  <>
                    <CommandEmpty className="py-6 text-center">
                      <p>No music found for "{searchQuery}"</p>
                      <p className="text-sm text-muted-foreground mt-1">Try a different search term or filter</p>
                    </CommandEmpty>

                    {searchResults.length > 0 && (
                      <CommandGroup heading="Tracks">
                        {searchResults.map((track) => (
                          <CommandItem
                            key={track.id}
                            value={`track-${track.id}`}
                            className="py-2 cursor-pointer"
                            onSelect={() => handleResultClick(track)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              {track.imageUrl ? (
                                <img
                                  src={track.imageUrl}
                                  alt={track.title}
                                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-indigo-800/30 flex items-center justify-center flex-shrink-0">
                                  <Music className="h-5 w-5 text-indigo-300" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {highlightMatch(track.title, searchQuery)}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {track.frequency && (
                                    <Badge variant="outline" className="text-xs py-0 px-1">
                                      {highlightMatch(track.frequency, searchQuery)}
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
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button type="submit" className="sr-only">Search</Button>
    </form>
  );
}