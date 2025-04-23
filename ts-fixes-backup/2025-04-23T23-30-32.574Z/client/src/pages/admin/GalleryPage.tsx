import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import MediaGalleryView, { GalleryViewMode } from "@/components/features/admin/MediaGalleryView";
import { 
  Image as ImageIcon, 
  Grid, 
  Columns, 
  Grid2X2, 
  LayoutGrid, 
  Rows, 
  X, 
  Plus, 
  Trash2, 
  Filter, 
  Search,
  Download,
  Share2
} from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";

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

interface Gallery {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt?: string;
  itemCount: number;
  isPublic: boolean;
  tags?: string[];
}

export type GalleryDisplayMode = "grid" | "masonry" | "carousel" | "slideshow" | "fullscreen";

// Gallery page specifically optimized for curating image collections
export default function GalleryPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGallery, setCurrentGallery] = useState<Gallery | null>(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(new Set());
  const [isCreatingGallery, setIsCreatingGallery] = useState(false);
  const [newGalleryData, setNewGalleryData] = useState({
    name: "",
    description: "",
    isPublic: true,
    tags: "",
  });
  const [isDeleteGalleryDialogOpen, setIsDeleteGalleryDialogOpen] = useState(false);
  const [isAddToGalleryDialogOpen, setIsAddToGalleryDialogOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<GalleryDisplayMode>("grid");
  const [viewMode, setViewMode] = useState<GalleryViewMode>("grid");
  const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
  const [isImageDetailOpen, setIsImageDetailOpen] = useState(false);

  // Fetch all galleries
  const { data: galleries = [], isLoading: isLoadingGalleries } = useQuery<Gallery[]>({
    queryKey: ['galleries'],
    queryFn: async () => {
      const res = await fetch('/api/galleries');
      if (!res.ok) throw new Error('Failed to fetch galleries');
      return res.json();
    }
  });

  // Fetch media for the selected gallery
  const { data: galleryMedia = [], isLoading: isLoadingGalleryMedia } = useQuery<MediaFile[]>({
    queryKey: ['gallery-media', selectedGalleryId],
    queryFn: async () => {
      if (!selectedGalleryId) return [];
      const res = await fetch(`/api/galleries/${selectedGalleryId}/media`);
      if (!res.ok) throw new Error('Failed to fetch gallery media');
      return res.json();
    },
    enabled: !!selectedGalleryId
  });

  // Fetch all image media for adding to gallery
  const { data: allImageMedia = [], isLoading: isLoadingAllMedia } = useQuery<MediaFile[]>({
    queryKey: ['media-files', 'image'],
    queryFn: async () => {
      const res = await fetch('/api/media?type=image');
      if (!res.ok) throw new Error('Failed to fetch image media');
      return res.json();
    }
  });

  // Create gallery mutation
  const createGalleryMutation = useMutation({
    mutationFn: async (galleryData) => {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(galleryData),
      });
      
      if (!res.ok) throw new Error('Failed to create gallery');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      setIsCreatingGallery(false);
      setNewGalleryData({
        name: "",
        description: "",
        isPublic: true,
        tags: "",
      });
      toast({
        title: "Gallery Created",
        description: "Your new gallery has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create gallery',
        variant: "destructive"
      });
    }
  });

  // Delete gallery mutation
  const deleteGalleryMutation = useMutation({
    mutationFn: async (galleryId: number) => {
      const res = await fetch(`/api/galleries/${galleryId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete gallery');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      setIsDeleteGalleryDialogOpen(false);
      setSelectedGalleryId(null);
      setCurrentGallery(null);
      toast({
        title: "Gallery Deleted",
        description: "The gallery has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete gallery',
        variant: "destructive"
      });
    }
  });

  // Add media to gallery mutation
  const addToGalleryMutation = useMutation({
    mutationFn: async ({ galleryId, mediaIds }: { galleryId: number, mediaIds: number[] }) => {
      const res = await fetch(`/api/galleries/${galleryId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaIds }),
      });
      
      if (!res.ok) throw new Error('Failed to add media to gallery');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-media', selectedGalleryId] });
      setIsAddToGalleryDialogOpen(false);
      setSelectedMediaIds(new Set());
      toast({
        title: "Media Added",
        description: "Selected media files have been added to the gallery",
      });
    },
    onError: (error) => {
      toast({
        title: "Operation Failed",
        description: error instanceof Error ? error.message : 'Failed to add media to gallery',
        variant: "destructive"
      });
    }
  });

  // Remove media from gallery mutation
  const removeFromGalleryMutation = useMutation({
    mutationFn: async ({ galleryId, mediaIds }: { galleryId: number, mediaIds: number[] }) => {
      const res = await fetch(`/api/galleries/${galleryId}/media`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaIds }),
      });
      
      if (!res.ok) throw new Error('Failed to remove media from gallery');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-media', selectedGalleryId] });
      setSelectedMediaIds(new Set());
      toast({
        title: "Media Removed",
        description: "Selected media files have been removed from the gallery",
      });
    },
    onError: (error) => {
      toast({
        title: "Operation Failed",
        description: error instanceof Error ? error.message : 'Failed to remove media from gallery',
        variant: "destructive"
      });
    }
  });

  // Update gallery when selection changes
  useEffect(() => {
    if (selectedGalleryId) {
      const gallery = galleries.find(g => g.id === selectedGalleryId);
      if (gallery) {
        setCurrentGallery(gallery);
      }
    } else {
      setCurrentGallery(null);
    }
  }, [selectedGalleryId, galleries]);

  // Handle media selection
  const handleToggleSelectMedia = (id: number) => {
    setSelectedMediaIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  // Handle gallery creation
  const handleCreateGallery = () => {
    if (!newGalleryData.name) {
      toast({
        title: "Gallery Name Required",
        description: "Please provide a name for your gallery",
        variant: "destructive"
      });
      return;
    }

    const galleryData = {
      ...newGalleryData,
      tags: newGalleryData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    createGalleryMutation.mutate(galleryData);
  };

  // Handle gallery deletion
  const handleDeleteGallery = () => {
    if (!currentGallery) return;
    deleteGalleryMutation.mutate(currentGallery.id);
  };

  // Handle adding selected media to gallery
  const handleAddToGallery = () => {
    if (!selectedGalleryId || selectedMediaIds.size === 0) return;
    addToGalleryMutation.mutate({
      galleryId: selectedGalleryId,
      mediaIds: Array.from(selectedMediaIds)
    });
  };

  // Handle removing selected media from gallery
  const handleRemoveFromGallery = () => {
    if (!selectedGalleryId || selectedMediaIds.size === 0) return;
    removeFromGalleryMutation.mutate({
      galleryId: selectedGalleryId,
      mediaIds: Array.from(selectedMediaIds)
    });
  };

  // Filter galleries based on search query
  const filteredGalleries = galleries.filter(gallery => 
    gallery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gallery.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (gallery.tags && gallery.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Handle media detail view
  const handleViewDetails = (media: MediaFile) => {
    setSelectedImage(media);
    setIsImageDetailOpen(true);
  };

  // Gallery list view
  const renderGalleryList = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredGalleries.map(gallery => (
        <Card 
          key={gallery.id} 
          className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
            selectedGalleryId === gallery.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => setSelectedGalleryId(gallery.id)}
        >
          <div className="aspect-[4/3] bg-muted">
            {gallery.thumbnail ? (
              <img 
                src={gallery.thumbnail} 
                alt={gallery.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <Grid2X2 className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium text-lg">{gallery.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {gallery.description || "No description provided"}
            </p>
            <div className="flex justify-between items-center mt-3">
              <Badge variant="outline">{gallery.itemCount} items</Badge>
              <Badge variant={gallery.isPublic ? "default" : "secondary"}>
                {gallery.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Create new gallery card */}
      <Card 
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-dashed"
        onClick={() => setIsCreatingGallery(true)}
      >
        <div className="aspect-[4/3] bg-muted/50 flex flex-col items-center justify-center">
          <Plus className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground font-medium">Create New Gallery</p>
        </div>
      </Card>
    </div>
  );

  // Render gallery content - when a gallery is selected
  const renderGalleryContent = () => {
    if (!currentGallery) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
          <Grid2X2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-1">Select a Gallery</h3>
          <p className="text-muted-foreground max-w-sm">
            Choose a gallery from the list or create a new one to start organizing your images.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{currentGallery.name}</h2>
            <p className="text-muted-foreground mt-1">
              {currentGallery.description || "No description provided"}
            </p>
            {currentGallery.tags && currentGallery.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentGallery.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">
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
              onClick={() => setIsAddToGalleryDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Images
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsDeleteGalleryDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Gallery
            </Button>
          </div>
        </div>

        {/* Gallery display options */}
        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex space-x-2">
            <Button
              variant={displayMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("grid")}
            >
              <Grid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={displayMode === "masonry" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("masonry")}
            >
              <Columns className="h-4 w-4 mr-1" />
              Masonry
            </Button>
            <Button
              variant={displayMode === "carousel" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("carousel")}
            >
              <Rows className="h-4 w-4 mr-1" />
              Carousel
            </Button>
            <Button
              variant={displayMode === "slideshow" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDisplayMode("slideshow")}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Slideshow
            </Button>
          </div>
          
          {selectedMediaIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedMediaIds.size} selected
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedMediaIds(new Set())}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRemoveFromGallery}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          )}
        </div>

        {/* Gallery media content */}
        {isLoadingGalleryMedia ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : galleryMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-1">No Images in Gallery</h3>
            <p className="text-muted-foreground max-w-sm">
              This gallery is empty. Click "Add Images" to select images to include in this gallery.
            </p>
            <Button 
              variant="default" 
              className="mt-4"
              onClick={() => setIsAddToGalleryDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Images
            </Button>
          </div>
        ) : (
          <MediaGalleryView
            mediaFiles={galleryMedia}
            selectedMediaIds={selectedMediaIds}
            onToggleSelectMedia={handleToggleSelectMedia}
            onViewDetails={handleViewDetails}
            onDelete={(media) => {
              removeFromGalleryMutation.mutate({
                galleryId: currentGallery.id,
                mediaIds: [media.id]
              });
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Image Galleries</h1>
            <p className="text-muted-foreground">
              Create and manage curated image collections for your website.
            </p>
          </div>
        </div>

        <Tabs defaultValue="galleries" className="w-full">
          <TabsList>
            <TabsTrigger value="galleries">Galleries</TabsTrigger>
            <TabsTrigger value="gallery-content" disabled={!currentGallery}>
              Gallery Content {currentGallery ? `(${currentGallery.name})` : ''}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="galleries" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search galleries..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="default"
                onClick={() => setIsCreatingGallery(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Gallery
              </Button>
            </div>
            
            {isLoadingGalleries ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredGalleries.length === 0 && searchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-xl font-medium mb-1">No Matching Galleries</h3>
                <p className="text-muted-foreground max-w-sm">
                  No galleries match your search criteria. Try a different search term.
                </p>
              </div>
            ) : filteredGalleries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Grid2X2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-1">No Galleries Created</h3>
                <p className="text-muted-foreground max-w-sm">
                  Create your first gallery to start organizing your images.
                </p>
                <Button 
                  variant="default" 
                  className="mt-4"
                  onClick={() => setIsCreatingGallery(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gallery
                </Button>
              </div>
            ) : (
              renderGalleryList()
            )}
          </TabsContent>
          
          <TabsContent value="gallery-content" className="space-y-4">
            {renderGalleryContent()}
          </TabsContent>
        </Tabs>

        {/* Create Gallery Dialog */}
        <Dialog open={isCreatingGallery} onOpenChange={setIsCreatingGallery}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Gallery</DialogTitle>
              <DialogDescription>
                Create a new image gallery to organize and showcase your images.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Gallery Name *
                </label>
                <Input
                  id="name"
                  value={newGalleryData.name}
                  onChange={(e) => setNewGalleryData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter gallery name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  value={newGalleryData.description}
                  onChange={(e) => setNewGalleryData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter gallery description"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium">
                  Tags (comma separated)
                </label>
                <Input
                  id="tags"
                  value={newGalleryData.tags}
                  onChange={(e) => setNewGalleryData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="landscape, nature, ocean, etc."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={newGalleryData.isPublic}
                  onCheckedChange={(checked) => 
                    setNewGalleryData(prev => ({ 
                      ...prev, 
                      isPublic: checked === true 
                    }))
                  }
                />
                <label htmlFor="isPublic" className="text-sm font-medium">
                  Make this gallery public
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreatingGallery(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={handleCreateGallery}
                disabled={!newGalleryData.name}
              >
                Create Gallery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Gallery Confirmation Dialog */}
        <Dialog open={isDeleteGalleryDialogOpen} onOpenChange={setIsDeleteGalleryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Gallery</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this gallery? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800 text-sm my-4">
              <p className="font-medium">Warning</p>
              <p>
                Deleting this gallery will remove all associations with its media files. The media files themselves will not be deleted.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteGalleryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteGallery}
              >
                Delete Gallery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add to Gallery Dialog */}
        <Dialog open={isAddToGalleryDialogOpen} onOpenChange={setIsAddToGalleryDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Add Images to Gallery</DialogTitle>
              <DialogDescription>
                Select images to add to "{currentGallery?.name}".
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search images..."
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedMediaIds.size} selected
                  </span>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {isLoadingAllMedia ? (
                    <div className="col-span-full flex justify-center items-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : allImageMedia.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-1">No Images Available</h3>
                      <p className="text-muted-foreground max-w-sm">
                        Upload images in the Media section first.
                      </p>
                    </div>
                  ) : (
                    allImageMedia.map(media => (
                      <div 
                        key={media.id} 
                        className={`relative aspect-square border rounded-md overflow-hidden ${
                          selectedMediaIds.has(media.id) ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleToggleSelectMedia(media.id)}
                      >
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox 
                            checked={selectedMediaIds.has(media.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                        </div>
                        <img 
                          src={media.fileUrl} 
                          alt={media.metadata?.alt || media.originalFilename} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddToGalleryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={handleAddToGallery}
                disabled={selectedMediaIds.size === 0}
              >
                Add Selected ({selectedMediaIds.size})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Detail Dialog */}
        <Dialog open={isImageDetailOpen} onOpenChange={setIsImageDetailOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{selectedImage?.metadata?.title || selectedImage?.originalFilename}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-black rounded-md overflow-hidden mb-4">
                <img 
                  src={selectedImage?.fileUrl} 
                  alt={selectedImage?.metadata?.alt || selectedImage?.originalFilename} 
                  className="max-h-[500px] mx-auto object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">File Details</h4>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Original Name:</span> {selectedImage?.originalFilename}</p>
                    <p><span className="text-muted-foreground">Type:</span> {selectedImage?.mimeType}</p>
                    <p><span className="text-muted-foreground">Size:</span> {selectedImage?.fileSize ? formatFileSize(selectedImage.fileSize) : 'Unknown'}</p>
                    <p><span className="text-muted-foreground">Dimensions:</span> {selectedImage?.metadata?.width && selectedImage?.metadata?.height 
                      ? `${selectedImage.metadata.width} × ${selectedImage.metadata.height}` 
                      : 'Unknown'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Metadata</h4>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Title:</span> {selectedImage?.metadata?.title || 'None'}</p>
                    <p><span className="text-muted-foreground">Alt Text:</span> {selectedImage?.metadata?.alt || 'None'}</p>
                    <p><span className="text-muted-foreground">Description:</span> {selectedImage?.metadata?.description || 'None'}</p>
                    <p><span className="text-muted-foreground">Page:</span> {selectedImage?.page || 'Unknown'}</p>
                    <p><span className="text-muted-foreground">Section:</span> {selectedImage?.section || 'None'}</p>
                  </div>
                </div>
              </div>
              
              {selectedImage?.tags && selectedImage.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-1">Tags</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedImage.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedImage?.fileUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsImageDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}