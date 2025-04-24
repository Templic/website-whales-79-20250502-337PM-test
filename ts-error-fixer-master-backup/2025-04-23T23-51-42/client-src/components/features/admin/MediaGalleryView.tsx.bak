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
  SlidersHorizontal
} from 'lucide-react';

export type GalleryViewMode = 'grid' | 'list' | 'slider';

interface MediaFile {
  id: number;
  filename: string;
  originalFilename: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: number;
  page: string;
  section?: string;
  tags?: string[];
  position?: {
    x: number;
    y: number;
    size: number;
    zIndex: number;
  };
  metadata?: {
    title?: string;
    description?: string;
    alt?: string;
    width?: number;
    height?: number;
    duration?: number;
    artist?: string;
    album?: string;
    genre?: string;
    bpm?: number;
    key?: string;
    isLoop?: boolean;
    frequency?: number;
    binauralBeat?: boolean;
    category?: string;
  };
}

interface MediaGalleryViewProps {
  mediaFiles: MediaFile[];
  selectedMediaIds: Set<number>;
  onToggleSelectMedia: (id: number) => void;
  onViewDetails: (media: MediaFile) => void;
  onDelete: (media: MediaFile) => void;
  onEdit?: (media: MediaFile) => void;
  onPlay?: (media: MediaFile) => void;
  viewMode: GalleryViewMode;
  onViewModeChange: (mode: GalleryViewMode) => void;
}

const MediaGalleryView: React.FC<MediaGalleryViewProps> = ({
  mediaFiles,
  selectedMediaIds,
  onToggleSelectMedia,
  onViewDetails,
  onDelete,
  onEdit,
  onPlay,
  viewMode,
  onViewModeChange
}) => {
  // Current slide index for slider view
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Helper for formatting file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to get icon for media type
  const getMediaTypeIcon = (media: MediaFile) => {
    if (media.mimeType.startsWith('image/')) {
      return <Images className="h-4 w-4" />;
    } else if (media.mimeType.startsWith('video/')) {
      return <Video className="h-4 w-4" />;
    } else if (media.mimeType.startsWith('audio/')) {
      return <Music className="h-4 w-4" />;
    } else {
      return <Layers className="h-4 w-4" />;
    }
  };

  // Get media display name
  const getMediaDisplayName = (media: MediaFile): string => {
    return media.metadata?.title || media.originalFilename;
  };

  // Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {mediaFiles.map((media) => (
        <Card
          key={media.id}
          className={`overflow-hidden relative transition-all duration-200 hover:shadow-md ${
            selectedMediaIds.has(media.id) ? 'ring-2 ring-primary' : ''
          }`}
        >
          <div className="relative">
            {/* Thumbnail or placeholder */}
            <div className="aspect-[4/3] bg-muted overflow-hidden">
              {media.thumbnailUrl || media.fileUrl ? (
                <img
                  src={media.thumbnailUrl || media.fileUrl}
                  alt={media.metadata?.alt || media.originalFilename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If the image fails to load, display an icon based on media type
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      if (media.mimeType.startsWith('video/')) {
                        parent.innerHTML = '<div class="flex items-center justify-center h-full bg-black/5"><svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x={1} y={5} width={15} height={14} rx={2} ry={2}></rect></svg></div>';
                      } else if (media.mimeType.startsWith('audio/')) {
                        parent.innerHTML = '<div class="flex items-center justify-center h-full bg-black/5"><svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M9 18V5l12-2v13"></path><circle cx={6} cy={18} r="3"></circle><circle cx={18} cy={16} r="3"></circle></svg></div>';
                      } else {
                        parent.innerHTML = '<div class="flex items-center justify-center h-full bg-black/5"><svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg></div>';
                      }
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/5">
                  {media.mimeType.startsWith('video/') ? (
                    <Video className="h-12 w-12 text-muted-foreground" />
                  ) : media.mimeType.startsWith('audio/') ? (
                    <Music className="h-12 w-12 text-muted-foreground" />
                  ) : (
                    <Layers className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              )}

              {/* Play overlay for video/audio */}
              {(media.mimeType.startsWith('video/') || media.mimeType.startsWith('audio/')) && onPlay && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(media);
                  }}
                >
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                    <Play className="h-6 w-6 text-primary ml-1" />
                  </div>
                </div>
              )}

              {/* Selection checkbox */}
              <div className="absolute top-2 left-2">
                <Checkbox
                  checked={selectedMediaIds.has(media.id)}
                  onCheckedChange={() => onToggleSelectMedia(media.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 bg-white/90 border-none focus:ring-0"
                />
              </div>
            </div>

            {/* Media info */}
            <CardContent className="p-3 pb-4">
              <h3 className="font-medium text-sm truncate" title={getMediaDisplayName(media)}>
                {getMediaDisplayName(media)}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(media.fileSize)}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(media)}>
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(media)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onPlay && (media.mimeType.startsWith('video/') || media.mimeType.startsWith('audio/')) && (
                      <DropdownMenuItem onClick={() => onPlay(media)}>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => window.open(media.fileUrl, '_blank')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigator.clipboard.writeText(media.fileUrl)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(media)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Optionally show tags */}
              {media.tags && media.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {media.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs py-0 px-1">
                      {tag}
                    </Badge>
                  ))}
                  {media.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs py-0 px-1">
                      +{media.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );

  // List View
  const renderListView = () => (
    <div className="space-y-2">
      {mediaFiles.map((media) => (
        <div 
          key={media.id}
          className={`flex items-center p-2 border rounded-md hover:bg-muted/50 ${
            selectedMediaIds.has(media.id) ? 'bg-primary/10 border-primary' : ''
          }`}
        >
          <div className="mr-2">
            <Checkbox
              checked={selectedMediaIds.has(media.id)}
              onCheckedChange={() => onToggleSelectMedia(media.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Thumbnail */}
          <div className="h-12 w-12 mr-3 overflow-hidden rounded-sm">
            {media.thumbnailUrl || media.fileUrl ? (
              <img
                src={media.thumbnailUrl || media.fileUrl}
                alt={media.metadata?.alt || media.originalFilename}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    if (media.mimeType.startsWith('video/')) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full w-full bg-muted"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x={1} y={5} width={15} height={14} rx={2} ry={2}></rect></svg></div>';
                    } else if (media.mimeType.startsWith('audio/')) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full w-full bg-muted"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M9 18V5l12-2v13"></path><circle cx={6} cy={18} r="3"></circle><circle cx={18} cy={16} r="3"></circle></svg></div>';
                    } else {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full w-full bg-muted"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg></div>';
                    }
                  }
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                {getMediaTypeIcon(media)}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className="font-medium text-sm truncate" title={getMediaDisplayName(media)}>
                {getMediaDisplayName(media)}
              </h3>
              <span className="text-xs text-muted-foreground ml-2 flex items-center">
                {getMediaTypeIcon(media)}
                <span className="ml-1">{media.fileType.toUpperCase()}</span>
              </span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{formatFileSize(media.fileSize)}</span>
              <span className="mx-1">•</span>
              <span>{formatDate(media.uploadedAt)}</span>
              {media.metadata?.duration && (
                <>
                  <span className="mx-1">•</span>
                  <span>
                    {Math.floor(media.metadata.duration / 60)}:
                    {Math.floor(media.metadata.duration % 60).toString().padStart(2, '0')}
                  </span>
                </>
              )}
            </div>
            {media.tags && media.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {media.tags.slice(0, 4).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs py-0 px-1">
                    {tag}
                  </Badge>
                ))}
                {media.tags.length > 4 && (
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    +{media.tags.length - 4}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center ml-2 space-x-1">
            {onPlay && (media.mimeType.startsWith('video/') || media.mimeType.startsWith('audio/')) && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(media);
                }}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onViewDetails(media)}
            >
              <Info className="h-4 w-4" />
            </Button>
            {onEdit && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onEdit(media)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(media)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  // Slider View
  const renderSliderView = () => {
    if (mediaFiles.length === 0) return null;
    
    const currentMedia = mediaFiles[currentSlideIndex];
    
    return (
      <div className="bg-black rounded-lg overflow-hidden relative h-[70vh]">
        {/* Media display */}
        <div className="h-full flex items-center justify-center">
          {currentMedia.mimeType.startsWith('image/') ? (
            <img
              src={currentMedia.fileUrl}
              alt={currentMedia.metadata?.alt || currentMedia.originalFilename}
              className="max-h-full max-w-full object-contain"
            />
          ) : currentMedia.mimeType.startsWith('video/') ? (
            <video
              src={currentMedia.fileUrl}
              controls
              className="max-h-full max-w-full"
              poster={currentMedia.thumbnailUrl}
            />
          ) : currentMedia.mimeType.startsWith('audio/') ? (
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-muted/50 to-muted rounded-lg">
              <Music className="h-24 w-24 text-primary mb-4" />
              <h2 className="text-xl font-bold mb-2">{currentMedia.metadata?.title || currentMedia.originalFilename}</h2>
              {currentMedia.metadata?.artist && (
                <p className="text-lg text-muted-foreground">{currentMedia.metadata.artist}</p>
              )}
              <audio
                src={currentMedia.fileUrl}
                controls
                className="mt-6 w-80"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Layers className="h-20 w-20 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Preview not available</p>
              <Button className="mt-4" onClick={() => window.open(currentMedia.fileUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open File
              </Button>
            </div>
          )}
        </div>
        
        {/* Navigation arrows */}
        {mediaFiles.length > 1 && (
          <>
            <Button
              variant="ghost"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={() => setCurrentSlideIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1))}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
            <Button
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={() => setCurrentSlideIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1))}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Button>
          </>
        )}
        
        {/* Info bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{currentMedia.metadata?.title || currentMedia.originalFilename}</h3>
              <div className="text-sm text-white/70 flex items-center gap-2">
                <span>{formatFileSize(currentMedia.fileSize)}</span>
                {currentMedia.metadata?.width && currentMedia.metadata?.height && (
                  <span>{currentMedia.metadata.width} × {currentMedia.metadata.height}</span>
                )}
                {currentMedia.metadata?.duration && (
                  <span>
                    {Math.floor(currentMedia.metadata.duration / 60)}:
                    {Math.floor(currentMedia.metadata.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(currentMedia)}>
                <Info className="h-4 w-4 mr-1" />
                Details
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.open(currentMedia.fileUrl, '_blank')}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(currentMedia)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Thumbnail navigation */}
        {mediaFiles.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 bg-black/50 py-2">
            <ScrollArea className="w-full">
              <div className="flex gap-2 px-4">
                {mediaFiles.map((media, idx) => (
                  <div
                    key={media.id}
                    className={`h-14 w-20 flex-shrink-0 rounded overflow-hidden cursor-pointer transition-all ${
                      idx === currentSlideIndex ? 'ring-2 ring-primary' : 'ring-1 ring-white/30'
                    }`}
                    onClick={() => setCurrentSlideIndex(idx)}
                  >
                    {media.thumbnailUrl || media.fileUrl ? (
                      <img
                        src={media.thumbnailUrl || media.fileUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            if (media.mimeType.startsWith('video/')) {
                              parent.innerHTML = '<div class="flex items-center justify-center h-full w-full bg-black/60"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-white/80"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x={1} y={5} width={15} height={14} rx={2} ry={2}></rect></svg></div>';
                            } else if (media.mimeType.startsWith('audio/')) {
                              parent.innerHTML = '<div class="flex items-center justify-center h-full w-full bg-black/60"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-white/80"><path d="M9 18V5l12-2v13"></path><circle cx={6} cy={18} r="3"></circle><circle cx={18} cy={16} r="3"></circle></svg></div>';
                            } else {
                              parent.innerHTML = '<div class="flex items-center justify-center h-full w-full bg-black/60"><svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={2} stroke-linecap="round" stroke-linejoin="round" class="text-white/80"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg></div>';
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-black/60">
                        {media.mimeType.startsWith('video/') ? (
                          <Video className="h-6 w-6 text-white/80" />
                        ) : media.mimeType.startsWith('audio/') ? (
                          <Music className="h-6 w-6 text-white/80" />
                        ) : (
                          <Layers className="h-6 w-6 text-white/80" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View control */}
      <div className="flex justify-end mb-4">
        <div className="bg-muted p-1 rounded-md flex">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'slider' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => onViewModeChange('slider')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media count indicator */}
      {mediaFiles.length > 0 && (
        <div className="text-sm text-muted-foreground mb-4">
          Showing {mediaFiles.length} {mediaFiles.length === 1 ? 'item' : 'items'}
          {selectedMediaIds.size > 0 && ` • ${selectedMediaIds.size} selected`}
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'slider' && renderSliderView()}

      {mediaFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Images className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-1">No Media Files</h3>
          <p className="text-muted-foreground max-w-sm">
            No media files found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaGalleryView;