import React, { useState, useRef, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video as VideoIcon,
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileVideo,
  Tag,
  Clock,
  Info,
  Download,
  Crop,
  FastForward,
  Settings,
  List,
  Grid,
  Maximize2,
  Film
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import MediaGalleryView, { GalleryViewMode } from "@/components/features/admin/MediaGalleryView";
import AdminLayout from "@/components/layout/AdminLayout";

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
    category?: string;
  };
}

// VideoPage specifically designed for video content management
export default function VideoPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  
  // State for video playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // State for managing videos
  const [viewMode, setViewMode] = useState<GalleryViewMode>("grid");
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<number>>(new Set());
  const [currentVideo, setCurrentVideo] = useState<MediaFile | null>(null);
  const [isVideoDetailOpen, setIsVideoDetailOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEnhanceDialogOpen, setIsEnhanceDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Video upload metadata
  const [videoMetadata, setVideoMetadata] = useState({
    title: "",
    description: "",
    tags: "",
    category: "",
    page: "",
    section: ""
  });
  
  // Video enhancement options
  const [enhanceOptions, setEnhanceOptions] = useState({
    generateThumbnail: true,
    improveQuality: false,
    addWatermark: false,
    trimVideo: false,
    cropVideo: false,
    startTime: 0,
    endTime: 0,
    watermarkText: ""
  });
  
  // Constants
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const categories = ["tutorial", "testimonial", "product", "promo", "background", "other"];
  
  // Fetch videos
  const { data: videos = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media-files', 'video'],
    queryFn: async () => {
      const res = await fetch('/api/media?type=video');
      if (!res.ok) throw new Error('Failed to fetch videos');
      return res.json();
    }
  });
  
  // Upload video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files', 'video'] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      resetUploadForm();
      toast({
        title: "Upload Successful",
        description: "The video has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload video',
        variant: "destructive"
      });
    }
  });
  
  // Enhance video mutation
  const enhanceVideoMutation = useMutation({
    mutationFn: async (enhanceData: { videoId: number, options: any }) => {
      const res = await fetch('/api/media/enhance-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhanceData),
      });
      
      if (!res.ok) throw new Error('Failed to enhance video');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files', 'video'] });
      setIsEnhanceDialogOpen(false);
      toast({
        title: "Video Enhancement Complete",
        description: "The video has been processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : 'Failed to enhance video',
        variant: "destructive"
      });
    }
  });
  
  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await fetch(`/api/media/${videoId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete video');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files', 'video'] });
      setIsDeleteConfirmOpen(false);
      setCurrentVideo(null);
      toast({
        title: "Video Deleted",
        description: "The video has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete video',
        variant: "destructive"
      });
    }
  });
  
  // Handle toggle play/pause
  const togglePlay = () => {
    if (videoPlayerRef.current) {
      if (isPlaying) {
        videoPlayerRef.current.pause();
      } else {
        videoPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoPlayerRef.current) {
      setCurrentTime(videoPlayerRef.current.currentTime);
    }
  };
  
  // Handle video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoPlayerRef.current) {
      setDuration(videoPlayerRef.current.duration);
    }
  };
  
  // Seek video
  const handleSeek = (time: number[]) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = time[0];
      setCurrentTime(time[0]);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Change volume
  const handleVolumeChange = (vol: number[]) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.volume = vol[0];
      setVolume(vol[0]);
      if (vol[0] === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };
  
  // Change playback rate
  const handlePlaybackRateChange = (rate: string) => {
    if (videoPlayerRef.current) {
      const newRate = parseFloat(rate);
      videoPlayerRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Handle file input change
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a video file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Extract title from filename
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setVideoMetadata({
        ...videoMetadata,
        title: fileName
      });
    }
  };
  
  // Handle upload click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle submit upload
  const handleSubmitUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a video file to upload",
        variant: "destructive"
      });
      return;
    }
    
    if (!videoMetadata.title) {
      toast({
        title: "Title Required",
        description: "Please provide a title for this video",
        variant: "destructive"
      });
      return;
    }
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', 'video');
    
    // Add metadata
    const metadata = {
      title: videoMetadata.title,
      description: videoMetadata.description,
      tags: videoMetadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      category: videoMetadata.category,
      page: videoMetadata.page,
      section: videoMetadata.section
    };
    
    formData.append('metadata', JSON.stringify(metadata));
    
    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return Math.min(prev + 5, 95);
      });
    }, 300);
    
    // Execute upload mutation
    uploadVideoMutation.mutate(formData, {
      onSettled: () => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      }
    });
  };
  
  // Reset upload form
  const resetUploadForm = () => {
    setVideoMetadata({
      title: "",
      description: "",
      tags: "",
      category: "",
      page: "",
      section: ""
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Handle toggle select video
  const handleToggleSelectVideo = (id: number) => {
    setSelectedVideoIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };
  
  // Handle video view details
  const handleViewDetails = (video: MediaFile) => {
    setCurrentVideo(video);
    setIsVideoDetailOpen(true);
  };
  
  // Handle enhance video
  const handleEnhanceVideo = () => {
    if (!currentVideo) return;
    
    enhanceVideoMutation.mutate({
      videoId: currentVideo.id,
      options: enhanceOptions
    });
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Filter videos based on search query and category
  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.metadata?.title && video.metadata.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (video.metadata?.description && video.metadata.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (video.tags && video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = filterCategory === "all" || 
      (video.metadata?.category && video.metadata.category === filterCategory);
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <AdminLayout>
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video Manager</h1>
            <p className="text-muted-foreground">
              Upload, manage, and enhance video content for your website.
            </p>
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload Video
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Videos</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="promos">Promotional</TabsTrigger>
          </TabsList>
          
          <div className="flex justify-between items-center mt-6 mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search videos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedVideoIds.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedVideoIds.size} selected
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    // Handle bulk delete
                  }}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <VideoIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-1">No Videos Found</h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchQuery || filterCategory !== "all" 
                    ? "No videos match your search criteria. Try adjusting your filters."
                    : "You haven't uploaded any videos yet. Click the upload button to get started."}
                </p>
                {!(searchQuery || filterCategory !== "all") && (
                  <Button 
                    variant="default" 
                    className="mt-4"
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Video
                  </Button>
                )}
              </div>
            ) : (
              <MediaGalleryView
                mediaFiles={filteredVideos}
                selectedMediaIds={selectedVideoIds}
                onToggleSelectMedia={handleToggleSelectVideo}
                onViewDetails={handleViewDetails}
                onDelete={(video) => {
                  setCurrentVideo(video);
                  setIsDeleteConfirmOpen(true);
                }}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            )}
          </TabsContent>
          
          <TabsContent value="tutorials">
            {/* Tutorial videos filtered view */}
            <MediaGalleryView
              mediaFiles={filteredVideos.filter(v => v.metadata?.category === 'tutorial')}
              selectedMediaIds={selectedVideoIds}
              onToggleSelectMedia={handleToggleSelectVideo}
              onViewDetails={handleViewDetails}
              onDelete={(video) => {
                setCurrentVideo(video);
                setIsDeleteConfirmOpen(true);
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </TabsContent>
          
          <TabsContent value="testimonials">
            {/* Testimonial videos filtered view */}
            <MediaGalleryView
              mediaFiles={filteredVideos.filter(v => v.metadata?.category === 'testimonial')}
              selectedMediaIds={selectedVideoIds}
              onToggleSelectMedia={handleToggleSelectVideo}
              onViewDetails={handleViewDetails}
              onDelete={(video) => {
                setCurrentVideo(video);
                setIsDeleteConfirmOpen(true);
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </TabsContent>
          
          <TabsContent value="promos">
            {/* Promotional videos filtered view */}
            <MediaGalleryView
              mediaFiles={filteredVideos.filter(v => v.metadata?.category === 'promo')}
              selectedMediaIds={selectedVideoIds}
              onToggleSelectMedia={handleToggleSelectVideo}
              onViewDetails={handleViewDetails}
              onDelete={(video) => {
                setCurrentVideo(video);
                setIsDeleteConfirmOpen(true);
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </TabsContent>
        </Tabs>
        
        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Video</DialogTitle>
              <DialogDescription>
                Upload video content to enhance your website. Supported formats: MP4, WebM, MOV.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* File Selection */}
              <div className="mb-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer ${
                    selectedFile ? "border-primary" : "border-muted"
                  }`}
                  onClick={handleUploadClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="video/mp4,video/webm,video/quicktime"
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-4">
                        <FileVideo size={64} className="text-purple-500" />
                      </div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Change Video
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-1">Click to upload or drag and drop</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        MP4, WebM, or MOV (max. 100MB)
                      </p>
                      <Button variant="secondary" size="sm">
                        Select Video
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              
              {selectedFile && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Title *
                    </label>
                    <Input
                      id="title"
                      value={videoMetadata.title}
                      onChange={(e) => setVideoMetadata(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter video title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Input
                      id="description"
                      value={videoMetadata.description}
                      onChange={(e) => setVideoMetadata(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter video description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                    <Select
                      value={videoMetadata.category}
                      onValueChange={(value) => setVideoMetadata(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="tags" className="text-sm font-medium">
                      Tags (comma separated)
                    </label>
                    <Input
                      id="tags"
                      value={videoMetadata.tags}
                      onChange={(e) => setVideoMetadata(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., tutorial, product, demo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="page" className="text-sm font-medium">
                      Page
                    </label>
                    <Input
                      id="page"
                      value={videoMetadata.page}
                      onChange={(e) => setVideoMetadata(prev => ({ ...prev, page: e.target.value }))}
                      placeholder="Enter page name (e.g., home, about)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="section" className="text-sm font-medium">
                      Section
                    </label>
                    <Input
                      id="section"
                      value={videoMetadata.section}
                      onChange={(e) => setVideoMetadata(prev => ({ ...prev, section: e.target.value }))}
                      placeholder="Enter section name (e.g., hero, testimonials)"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSubmitUpload}
                disabled={isUploading || !selectedFile || !videoMetadata.title}
              >
                {isUploading ? "Uploading..." : "Upload Video"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Video Detail Dialog */}
        <Dialog open={isVideoDetailOpen} onOpenChange={setIsVideoDetailOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{currentVideo?.metadata?.title || currentVideo?.originalFilename}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {/* Video Player */}
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoPlayerRef}
                  src={currentVideo?.fileUrl}
                  className="w-full max-h-[450px]"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                />
                
                {/* Video Controls */}
                <div className="bg-black p-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="text-xs text-white w-16">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                    
                    <div className="flex-1">
                      <Slider
                        value={[currentTime]}
                        min={0}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="w-24">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={handleVolumeChange}
                        className="cursor-pointer"
                      />
                    </div>
                    
                    <Select
                      value={playbackRate.toString()}
                      onValueChange={handlePlaybackRateChange}
                    >
                      <SelectTrigger className="w-20 h-8 text-white bg-transparent border-0">
                        <SelectValue>{playbackRate}x</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {playbackRates.map(rate => (
                          <SelectItem key={rate} value={rate.toString()}>
                            {rate}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white"
                      onClick={() => {
                        document.fullscreenElement
                          ? document.exitFullscreen()
                          : videoPlayerRef.current?.requestFullscreen();
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Video Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">File Details</h4>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Original Name:</span> {currentVideo?.originalFilename}</p>
                    <p><span className="text-muted-foreground">Type:</span> {currentVideo?.mimeType}</p>
                    <p><span className="text-muted-foreground">Size:</span> {currentVideo?.fileSize ? formatFileSize(currentVideo.fileSize) : 'Unknown'}</p>
                    <p><span className="text-muted-foreground">Duration:</span> {currentVideo?.metadata?.duration 
                      ? formatTime(currentVideo.metadata.duration) 
                      : formatTime(duration)}</p>
                    <p><span className="text-muted-foreground">Uploaded:</span> {
                      currentVideo?.uploadedAt 
                        ? new Date(currentVideo.uploadedAt).toLocaleDateString() 
                        : 'Unknown'
                    }</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Video Info</h4>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Title:</span> {currentVideo?.metadata?.title || 'None'}</p>
                    <p><span className="text-muted-foreground">Description:</span> {currentVideo?.metadata?.description || 'None'}</p>
                    <p><span className="text-muted-foreground">Category:</span> {currentVideo?.metadata?.category 
                      ? currentVideo.metadata.category.charAt(0).toUpperCase() + currentVideo.metadata.category.slice(1)
                      : 'None'}</p>
                    <p><span className="text-muted-foreground">Page:</span> {currentVideo?.page || 'None'}</p>
                    <p><span className="text-muted-foreground">Section:</span> {currentVideo?.section || 'None'}</p>
                  </div>
                </div>
              </div>
              
              {currentVideo?.tags && currentVideo.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentVideo.tags.map((tag, idx) => (
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsVideoDetailOpen(false);
                      setIsEnhanceDialogOpen(true);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Enhance Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(currentVideo?.fileUrl, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsVideoDetailOpen(false);
                      setIsDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button variant="default" onClick={() => setIsVideoDetailOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Video</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this video? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800 text-sm">
                <p className="font-medium">Warning</p>
                <p>Deleting this video will remove it from all pages where it is used.</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => currentVideo && deleteVideoMutation.mutate(currentVideo.id)}
              >
                Delete Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Enhance Video Dialog */}
        <Dialog open={isEnhanceDialogOpen} onOpenChange={setIsEnhanceDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Enhance Video</DialogTitle>
              <DialogDescription>
                Apply advanced enhancements to your video.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateThumbnail"
                  checked={enhanceOptions.generateThumbnail}
                  onCheckedChange={(checked) => 
                    setEnhanceOptions(prev => ({ 
                      ...prev, 
                      generateThumbnail: checked === true 
                    }))
                  }
                />
                <label htmlFor="generateThumbnail" className="text-sm font-medium">
                  Generate Thumbnail Image
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="improveQuality"
                  checked={enhanceOptions.improveQuality}
                  onCheckedChange={(checked) => 
                    setEnhanceOptions(prev => ({ 
                      ...prev, 
                      improveQuality: checked === true 
                    }))
                  }
                />
                <label htmlFor="improveQuality" className="text-sm font-medium">
                  Improve Video Quality
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addWatermark"
                  checked={enhanceOptions.addWatermark}
                  onCheckedChange={(checked) => 
                    setEnhanceOptions(prev => ({ 
                      ...prev, 
                      addWatermark: checked === true 
                    }))
                  }
                />
                <label htmlFor="addWatermark" className="text-sm font-medium">
                  Add Watermark
                </label>
              </div>
              
              {enhanceOptions.addWatermark && (
                <div className="ml-6 space-y-2">
                  <label htmlFor="watermarkText" className="text-sm font-medium">
                    Watermark Text
                  </label>
                  <Input
                    id="watermarkText"
                    value={enhanceOptions.watermarkText}
                    onChange={(e) => setEnhanceOptions(prev => ({ ...prev, watermarkText: e.target.value }))}
                    placeholder="Enter watermark text"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trimVideo"
                  checked={enhanceOptions.trimVideo}
                  onCheckedChange={(checked) => 
                    setEnhanceOptions(prev => ({ 
                      ...prev, 
                      trimVideo: checked === true 
                    }))
                  }
                />
                <label htmlFor="trimVideo" className="text-sm font-medium">
                  Trim Video
                </label>
              </div>
              
              {enhanceOptions.trimVideo && (
                <div className="ml-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="startTime" className="text-sm font-medium">
                        Start Time
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(enhanceOptions.startTime)}
                      </span>
                    </div>
                    <Slider
                      id="startTime"
                      value={[enhanceOptions.startTime]}
                      min={0}
                      max={duration}
                      step={0.1}
                      onValueChange={(values) => setEnhanceOptions(prev => ({ ...prev, startTime: values[0] }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="endTime" className="text-sm font-medium">
                        End Time
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(enhanceOptions.endTime || duration)}
                      </span>
                    </div>
                    <Slider
                      id="endTime"
                      value={[enhanceOptions.endTime || duration]}
                      min={0}
                      max={duration}
                      step={0.1}
                      onValueChange={(values) => setEnhanceOptions(prev => ({ ...prev, endTime: values[0] }))}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cropVideo"
                  checked={enhanceOptions.cropVideo}
                  onCheckedChange={(checked) => 
                    setEnhanceOptions(prev => ({ 
                      ...prev, 
                      cropVideo: checked === true 
                    }))
                  }
                />
                <label htmlFor="cropVideo" className="text-sm font-medium">
                  Crop Video
                </label>
              </div>
              
              {enhanceOptions.cropVideo && (
                <div className="ml-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    You will be able to select the crop area in the next step.
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEnhanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleEnhanceVideo}
                disabled={
                  !enhanceOptions.generateThumbnail && 
                  !enhanceOptions.improveQuality && 
                  !enhanceOptions.addWatermark && 
                  !enhanceOptions.trimVideo && 
                  !enhanceOptions.cropVideo
                }
              >
                Enhance Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}