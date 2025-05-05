import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Grid,
  List,
  Images,
  Video,
  Music,
  Info,
  Edit,
  Trash2,
  MoreHorizontal,
  Play,
  Download,
  Copy,
  ExternalLink,
  Layers,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  url: string;
  thumbnail?: string;
  size: string;
  uploadDate: string;
  tags: string[];
  publicAccess: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: string;
    format?: string;
    [key: string]: any;
  };
}

export default function MediaGalleryView() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Sample media data
  const mediaFiles: MediaFile[] = [
    {
      id: '1',
      type: 'image',
      name: 'cosmic-retreat-hero.jpg',
      url: '/images/cosmic-retreat-hero.jpg',
      thumbnail: '/images/cosmic-retreat-hero-thumb.jpg',
      size: '2.4 MB',
      uploadDate: '2025-03-15',
      tags: ['hero', 'banner', 'ceremony'],
      publicAccess: true,
      metadata: {
        width: 1920,
        height: 1080,
        format: 'JPEG'
      }
    },
    {
      id: '2',
      type: 'video',
      name: 'sound-healing-intro.mp4',
      url: '/videos/sound-healing-intro.mp4',
      thumbnail: '/videos/sound-healing-intro-thumb.jpg',
      size: '24.6 MB',
      uploadDate: '2025-03-12',
      tags: ['sound', 'healing', 'promotional'],
      publicAccess: true,
      metadata: {
        width: 1920,
        height: 1080,
        duration: '2:34',
        format: 'MP4'
      }
    },
    {
      id: '3',
      type: 'audio',
      name: 'binaural-meditation-432hz.mp3',
      url: '/audio/binaural-meditation-432hz.mp3',
      size: '8.2 MB',
      uploadDate: '2025-03-10',
      tags: ['meditation', 'binaural', '432hz'],
      publicAccess: false,
      metadata: {
        duration: '15:22',
        format: 'MP3'
      }
    },
    {
      id: '4',
      type: 'image',
      name: 'sacred-geometry-background.png',
      url: '/images/sacred-geometry-background.png',
      thumbnail: '/images/sacred-geometry-background-thumb.png',
      size: '1.8 MB',
      uploadDate: '2025-03-08',
      tags: ['background', 'sacred geometry'],
      publicAccess: true,
      metadata: {
        width: 2560,
        height: 1440,
        format: 'PNG'
      }
    },
    {
      id: '5',
      type: 'document',
      name: 'retreat-schedule-2025.pdf',
      url: '/documents/retreat-schedule-2025.pdf',
      size: '1.2 MB',
      uploadDate: '2025-03-05',
      tags: ['schedule', 'retreats', 'planning'],
      publicAccess: false
    },
    {
      id: '6',
      type: 'audio',
      name: 'ocean-waves-meditation.mp3',
      url: '/audio/ocean-waves-meditation.mp3',
      size: '12.5 MB',
      uploadDate: '2025-03-01',
      tags: ['meditation', 'nature', 'ocean'],
      publicAccess: true,
      metadata: {
        duration: '25:10',
        format: 'MP3'
      }
    }
  ];

  // Filter media files by type if filter is set
  const filteredMedia = filterType
    ? mediaFiles.filter(media => media.type === filterType)
    : mediaFiles;

  // Sort media files based on sortBy
  const sortedMedia = [...filteredMedia].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      // Convert size strings to numbers for comparison
      const sizeA = parseFloat(a.size.split(' ')[0]);
      const sizeB = parseFloat(b.size.split(' ')[0]);
      return sizeB - sizeA;
    }
  });

  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleAllSelection = () => {
    if (selectedItems.length === sortedMedia.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedMedia.map(media => media.id));
    }
  };

  const openLightbox = (index: number) => {
    setCurrentSlideIndex(index);
    setShowModal(true);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Images className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Media Gallery</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={viewMode === 'grid' ? 'bg-secondary' : ''}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={viewMode === 'list' ? 'bg-secondary' : ''}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType(null)}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('image')}>
                Images
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('video')}>
                Videos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('audio')}>
                Audio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('document')}>
                Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Date (Newest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('size')}>
                Size (Largest)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex items-center px-4 py-2 border-b">
        <Checkbox
          checked={selectedItems.length === sortedMedia.length && sortedMedia.length > 0}
          onCheckedChange={toggleAllSelection}
          className="mr-2"
        />
        <span className="text-sm">
          {selectedItems.length > 0 ? `Selected ${selectedItems.length} items` : `${sortedMedia.length} items`}
        </span>
        
        {selectedItems.length > 0 && (
          <div className="flex ml-auto gap-1">
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {sortedMedia.map((media, index) => (
              <Card key={media.id} className="overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedItems.includes(media.id)}
                      onCheckedChange={() => toggleItemSelection(media.id)}
                    />
                  </div>
                  
                  <div 
                    className="w-full h-full cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    {media.type === 'image' && media.thumbnail && (
                      <img 
                        src={media.thumbnail} 
                        alt={media.name} 
                        className="w-full h-full object-cover"
                      />
                    )}
                    {media.type === 'video' && media.thumbnail && (
                      <div className="relative w-full h-full">
                        <img 
                          src={media.thumbnail} 
                          alt={media.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/60 rounded-full p-2">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    {media.type === 'audio' && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-blue-500/30">
                        <Music className="h-12 w-12 text-primary" />
                      </div>
                    )}
                    {media.type === 'document' && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <Layers className="h-12 w-12 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="truncate">
                      <div className="flex items-center gap-1 mb-1">
                        {getFileIcon(media.type)}
                        <span className="text-xs text-muted-foreground">
                          {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
                        </span>
                      </div>
                      <p className="font-medium truncate" title={media.name}>{media.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{media.size}</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(media.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {media.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {media.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{media.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-4">
            {sortedMedia.map(media => (
              <div
                key={media.id}
                className="flex items-center py-2 px-3 hover:bg-muted/50 rounded-md"
              >
                <Checkbox
                  checked={selectedItems.includes(media.id)}
                  onCheckedChange={() => toggleItemSelection(media.id)}
                  className="mr-3"
                />
                <div className="h-10 w-10 mr-3 rounded overflow-hidden bg-muted flex items-center justify-center">
                  {media.type === 'image' && media.thumbnail ? (
                    <img src={media.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getFileIcon(media.type)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{media.name}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{media.size}</span>
                    <span className="mx-1">•</span>
                    <span>{new Date(media.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  {media.tags.slice(0, 1).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs mr-2">
                      {tag}
                    </Badge>
                  ))}
                  {media.tags.length > 1 && (
                    <Badge variant="outline" className="text-xs mr-4">
                      +{media.tags.length - 1}
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Modal/Lightbox */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-white hover:bg-white/20 z-10"
              onClick={() => setShowModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </Button>
            
            <div className="flex-1 flex items-center justify-center p-8">
              {sortedMedia[currentSlideIndex].type === 'image' && (
                <img 
                  src={sortedMedia[currentSlideIndex].url} 
                  alt={sortedMedia[currentSlideIndex].name}
                  className="max-h-full max-w-full object-contain"
                />
              )}
              {sortedMedia[currentSlideIndex].type === 'video' && (
                <video 
                  src={sortedMedia[currentSlideIndex].url}
                  controls
                  className="max-h-full max-w-full"
                />
              )}
              {sortedMedia[currentSlideIndex].type === 'audio' && (
                <div className="bg-black p-6 rounded-lg">
                  <audio 
                    src={sortedMedia[currentSlideIndex].url}
                    controls
                    className="w-[400px]"
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 bg-black/60 text-white">
              <h3 className="text-lg font-medium mb-1">{sortedMedia[currentSlideIndex].name}</h3>
              <div className="flex items-center text-white/70 mb-2">
                <span>{sortedMedia[currentSlideIndex].size}</span>
                <span className="mx-2">•</span>
                <span>{new Date(sortedMedia[currentSlideIndex].uploadDate).toLocaleDateString()}</span>
                {sortedMedia[currentSlideIndex].metadata?.duration && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{sortedMedia[currentSlideIndex].metadata.duration}</span>
                  </>
                )}
                {sortedMedia[currentSlideIndex].metadata?.width && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{sortedMedia[currentSlideIndex].metadata.width} × {sortedMedia[currentSlideIndex].metadata.height}</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedMedia[currentSlideIndex].tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-white/20">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            {sortedMedia.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60"
                  onClick={() => setCurrentSlideIndex((prev) => (prev === 0 ? sortedMedia.length - 1 : prev - 1))}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60"
                  onClick={() => setCurrentSlideIndex((prev) => (prev === sortedMedia.length - 1 ? 0 : prev + 1))}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}