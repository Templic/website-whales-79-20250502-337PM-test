import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutGrid, List, Play, Image, File, ChevronLeft, ChevronRight, Music, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

// Reuse the MediaFile interface from MediaPage
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
  };
}

export type GalleryViewMode = 'grid' | 'list' | 'slider';

interface MediaGalleryProps {
  mediaFiles: MediaFile[];
  selectedMediaIds: Set<number>;
  onToggleSelectMedia: (id: number) => void;
  onViewDetails: (media: MediaFile) => void;
  onDelete: (media: MediaFile) => void;
  viewMode: GalleryViewMode;
  onViewModeChange: (mode: GalleryViewMode) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="h-10 w-10 text-blue-500" />;
  if (mimeType.startsWith('video/')) return <Play className="h-10 w-10 text-purple-500" />;
  if (mimeType.startsWith('audio/')) return <Music className="h-10 w-10 text-green-500" />;
  if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) 
    return <FileText className="h-10 w-10 text-red-500" />;
  return <File className="h-10 w-10 text-gray-500" />;
};

// Media Gallery with slider, grid, and list view modes
const MediaGalleryView: React.FC<MediaGalleryProps> = ({
  mediaFiles,
  selectedMediaIds,
  onToggleSelectMedia,
  onViewDetails,
  onDelete,
  viewMode,
  onViewModeChange
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // For slider view navigation
  const goToNextSlide = () => {
    setCurrentSlideIndex((prevIndex) => 
      prevIndex === mediaFiles.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const goToPrevSlide = () => {
    setCurrentSlideIndex((prevIndex) => 
      prevIndex === 0 ? mediaFiles.length - 1 : prevIndex - 1
    );
  };

  // View mode selector buttons
  const ViewModeSelector = () => (
    <div className="flex justify-end mb-4 space-x-2">
      <Button 
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
        size="sm"
        onClick={() => onViewModeChange('grid')}
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        Grid
      </Button>
      <Button 
        variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
        size="sm"
        onClick={() => onViewModeChange('list')}
      >
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
      <Button 
        variant={viewMode === 'slider' ? 'secondary' : 'ghost'} 
        size="sm"
        onClick={() => onViewModeChange('slider')}
      >
        <Play className="h-4 w-4 mr-1" />
        Slider
      </Button>
    </div>
  );

  // Slider View
  if (viewMode === 'slider' && mediaFiles.length > 0) {
    const currentMedia = mediaFiles[currentSlideIndex];
    return (
      <div className="relative overflow-hidden">
        <ViewModeSelector />
        
        <div className="flex justify-center items-center bg-black rounded-lg overflow-hidden">
          {currentMedia.mimeType.startsWith('image/') ? (
            <img 
              src={currentMedia.fileUrl} 
              alt={currentMedia.metadata?.alt || currentMedia.originalFilename} 
              className="max-h-[600px] object-contain" 
            />
          ) : currentMedia.mimeType.startsWith('video/') ? (
            <video 
              src={currentMedia.fileUrl} 
              controls 
              className="max-h-[600px] max-w-full"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 bg-gray-100 rounded-md">
              {getFileIcon(currentMedia.mimeType)}
              <p className="mt-4 text-lg font-medium">{currentMedia.originalFilename}</p>
            </div>
          )}
        </div>
        
        <div className="absolute top-1/2 -translate-y-1/2 left-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white/80 text-black hover:bg-white"
            onClick={goToPrevSlide}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white/80 text-black hover:bg-white"
            onClick={goToNextSlide}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              {currentMedia.metadata?.title || currentMedia.originalFilename}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentMedia.mimeType} • {formatFileSize(currentMedia.fileSize)}
            </p>
            
            {currentMedia.tags && currentMedia.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentMedia.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails(currentMedia)}
            >
              Details
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(currentMedia)}
            >
              Delete
            </Button>
          </div>
        </div>
        
        <div className="mt-6 overflow-x-auto pb-4">
          <div className="flex space-x-2">
            {mediaFiles.map((media, index) => (
              <div 
                key={media.id} 
                className={`cursor-pointer flex-shrink-0 w-20 h-20 ${index === currentSlideIndex ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setCurrentSlideIndex(index)}
              >
                {media.mimeType.startsWith('image/') ? (
                  <img 
                    src={media.thumbnailUrl || media.fileUrl} 
                    alt={media.originalFilename} 
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                    {getFileIcon(media.mimeType)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div>
        <ViewModeSelector />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaFiles.map((media) => (
            <Card key={media.id} className="overflow-hidden hover:shadow-md transition-shadow relative">
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-white rounded-md shadow">
                  <Checkbox 
                    checked={selectedMediaIds.has(media.id)}
                    onCheckedChange={() => onToggleSelectMedia(media.id)}
                    aria-label={`Select ${media.originalFilename}`}
                    className="border-gray-300"
                  />
                </div>
              </div>
              <div 
                className="aspect-square bg-muted flex items-center justify-center cursor-pointer"
                onClick={() => onViewDetails(media)}
              >
                {media.mimeType.startsWith('image/') ? (
                  <img 
                    src={media.fileUrl} 
                    alt={media.metadata?.alt || media.originalFilename} 
                    className="h-full w-full object-cover"
                  />
                ) : media.mimeType.startsWith('video/') ? (
                  <div className="relative h-full w-full bg-black flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-80 absolute" />
                    {media.thumbnailUrl ? (
                      <img 
                        src={media.thumbnailUrl} 
                        alt={media.originalFilename} 
                        className="h-full w-full object-cover opacity-70"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    {getFileIcon(media.mimeType)}
                    <p className="mt-2 text-sm text-muted-foreground truncate max-w-full">
                      {media.originalFilename}
                    </p>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium truncate">
                      {media.metadata?.title || media.originalFilename}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(media.fileSize)}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`
                      ${media.mimeType.startsWith('image/') ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                      ${media.mimeType.startsWith('audio/') ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      ${media.mimeType.startsWith('video/') ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                      ${media.mimeType.startsWith('text/') || media.mimeType.includes('pdf') ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    `}
                  >
                    {media.mimeType.split('/')[0]}
                  </Badge>
                </div>
                
                {media.tags && media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {media.tags.slice(0, 2).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {tag}
                      </Badge>
                    ))}
                    {media.tags.length > 2 && (
                      <Badge variant="outline">+{media.tags.length - 2}</Badge>
                    )}
                  </div>
                )}
                
                <div className="flex mt-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onViewDetails(media)}
                  >
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // List View (default)
  return (
    <div>
      <ViewModeSelector />
      
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left w-8">
                <Checkbox />
              </th>
              <th className="p-2 text-left w-14"></th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Size</th>
              <th className="p-2 text-left">Uploaded</th>
              <th className="p-2 text-left">Tags</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mediaFiles.map((media) => (
              <tr key={media.id} className="border-t hover:bg-muted/50">
                <td className="p-2">
                  <Checkbox
                    checked={selectedMediaIds.has(media.id)}
                    onCheckedChange={() => onToggleSelectMedia(media.id)}
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-center">
                    {media.mimeType.startsWith('image/') ? (
                      <div className="w-10 h-10 rounded overflow-hidden">
                        <img 
                          src={media.thumbnailUrl || media.fileUrl} 
                          alt={media.originalFilename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      getFileIcon(media.mimeType)
                    )}
                  </div>
                </td>
                <td className="p-2 font-medium">{media.metadata?.title || media.originalFilename}</td>
                <td className="p-2">
                  <Badge variant="outline">
                    {media.mimeType.split('/')[0]}
                  </Badge>
                </td>
                <td className="p-2 text-sm text-muted-foreground">{formatFileSize(media.fileSize)}</td>
                <td className="p-2 text-sm text-muted-foreground">{new Date(media.uploadedAt).toLocaleDateString()}</td>
                <td className="p-2">
                  {media.tags && media.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {media.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {tag}
                        </Badge>
                      ))}
                      {media.tags.length > 2 && (
                        <Badge variant="outline">+{media.tags.length - 2}</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(media)}>
                      Details
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(media)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MediaGalleryView;