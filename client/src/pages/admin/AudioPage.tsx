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
  Music,
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
  FileMusic,
  Tag,
  Clock,
  Info,
  Download,
  Crop,
  FastForward,
  Settings,
  List,
  Grid,
  Activity as Waveform,
  Layers,
  BarChart2
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

interface AudioCategory {
  id: string;
  name: string;
  description?: string;
  count: number;
}

export type AudioViewMode = "grid" | "list" | "waveform" | "playlist";

// AudioPage specifically designed for audio file management
export default function AudioPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  
  // State for audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loop, setLoop] = useState(false);
  
  // State for managing audio files
  const [viewMode, setViewMode] = useState<GalleryViewMode>("grid");
  const [audioViewMode, setAudioViewMode] = useState<AudioViewMode>("grid");
  const [selectedAudioIds, setSelectedAudioIds] = useState<Set<number>>(new Set());
  const [currentAudio, setCurrentAudio] = useState<MediaFile | null>(null);
  const [isAudioDetailOpen, setIsAudioDetailOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBatchProcessDialogOpen, setIsBatchProcessDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<MediaFile | null>(null);
  
  // Audio upload metadata
  const [audioMetadata, setAudioMetadata] = useState({
    title: "",
    artist: "",
    album: "",
    genre: "",
    description: "",
    tags: "",
    bpm: "",
    key: "",
    isLoop: false,
    frequency: "",
    binauralBeat: false,
    category: "",
    page: "",
    section: ""
  });
  
  // Batch processing options
  const [batchOptions, setBatchOptions] = useState({
    normalizeVolume: true,
    addFadeIn: false,
    addFadeOut: false,
    convertFormat: false,
    targetFormat: "mp3",
    addWatermark: false,
    watermarkText: ""
  });
  
  // Constants
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const audioCategories: AudioCategory[] = [
    { id: "music", name: "Music", count: 0 },
    { id: "sound_effect", name: "Sound Effects", count: 0 },
    { id: "meditation", name: "Meditation", count: 0 },
    { id: "binaural_beat", name: "Binaural Beats", count: 0 },
    { id: "podcast", name: "Podcasts", count: 0 },
    { id: "ambient", name: "Ambient Sounds", count: 0 },
    { id: "voice", name: "Voice Recordings", count: 0 }
  ];
  const musicKeys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  
  // Fetch audio files
  const { data: audioFiles = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media-files', 'audio'],
    queryFn: async () => {
      const res = await fetch('/api/media?type=audio');
      if (!res.ok) throw new Error('Failed to fetch audio files');
      return res.json();
    }
  });
  
  // Upload audio mutation
  const uploadAudioMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload audio');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files', 'audio'] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      resetUploadForm();
      toast({
        title: "Upload Successful",
        description: "The audio file has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload audio',
        variant: "destructive"
      });
    }
  });
  
  // Batch process audio mutation
  const batchProcessMutation = useMutation({
    mutationFn: async (data: { audioIds: number[], options: any }) => {
      const res = await fetch('/api/media/batch-process-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error('Failed to process audio files');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files', 'audio'] });
      setIsBatchProcessDialogOpen(false);
      setSelectedAudioIds(new Set());
      toast({
        title: "Processing Complete",
        description: "The audio files have been processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Failed to process audio files',
        variant: "destructive"
      });
    }
  });
  
  // Delete audio mutation
  const deleteAudioMutation = useMutation({
    mutationFn: async (audioId: number) => {
      const res = await fetch(`/api/media/${audioId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete audio');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files', 'audio'] });
      setIsDeleteConfirmOpen(false);
      setCurrentAudio(null);
      toast({
        title: "Audio Deleted",
        description: "The audio file has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete audio',
        variant: "destructive"
      });
    }
  });
  
  // Play/pause audio
  const togglePlay = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle audio time update
  const handleTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setCurrentTime(audioPlayerRef.current.currentTime);
    }
  };
  
  // Handle audio loaded metadata
  const handleLoadedMetadata = () => {
    if (audioPlayerRef.current) {
      setDuration(audioPlayerRef.current.duration);
    }
  };
  
  // Seek audio
  const handleSeek = (time: number[]) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = time[0];
      setCurrentTime(time[0]);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Change volume
  const handleVolumeChange = (vol: number[]) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = vol[0];
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
    if (audioPlayerRef.current) {
      const newRate = parseFloat(rate);
      audioPlayerRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };
  
  // Toggle loop
  const toggleLoop = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.loop = !loop;
      setLoop(!loop);
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Handle file input change
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an audio file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Extract title from filename
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setAudioMetadata({
        ...audioMetadata,
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
        description: "Please select an audio file to upload",
        variant: "destructive"
      });
      return;
    }
    
    if (!audioMetadata.title) {
      toast({
        title: "Title Required",
        description: "Please provide a title for this audio file",
        variant: "destructive"
      });
      return;
    }
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', 'audio');
    
    // Add metadata
    const metadata = {
      title: audioMetadata.title,
      artist: audioMetadata.artist,
      album: audioMetadata.album,
      genre: audioMetadata.genre,
      description: audioMetadata.description,
      tags: audioMetadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      bpm: audioMetadata.bpm ? parseInt(audioMetadata.bpm) : undefined,
      key: audioMetadata.key,
      isLoop: audioMetadata.isLoop,
      frequency: audioMetadata.frequency ? parseInt(audioMetadata.frequency) : undefined,
      binauralBeat: audioMetadata.binauralBeat,
      category: audioMetadata.category,
      page: audioMetadata.page,
      section: audioMetadata.section
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
    uploadAudioMutation.mutate(formData, {
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
    setAudioMetadata({
      title: "",
      artist: "",
      album: "",
      genre: "",
      description: "",
      tags: "",
      bpm: "",
      key: "",
      isLoop: false,
      frequency: "",
      binauralBeat: false,
      category: "",
      page: "",
      section: ""
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Handle toggle select audio
  const handleToggleSelectAudio = (id: number) => {
    setSelectedAudioIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };
  
  // Handle audio view details
  const handleViewDetails = (audio: MediaFile) => {
    setCurrentAudio(audio);
    setIsAudioDetailOpen(true);
  };
  
  // Handle play audio
  const handlePlayAudio = (audio: MediaFile) => {
    setNowPlaying(audio);
    // After setting nowPlaying, the audio element should load and play automatically
  };
  
  // Handle batch process
  const handleBatchProcess = () => {
    if (selectedAudioIds.size === 0) return;
    
    batchProcessMutation.mutate({
      audioIds: Array.from(selectedAudioIds),
      options: batchOptions
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
  
  // Filter audio files based on search query and category
  const filteredAudioFiles = audioFiles.filter(audio => {
    const matchesSearch = 
      audio.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (audio.metadata?.title && audio.metadata.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (audio.metadata?.artist && audio.metadata.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (audio.metadata?.album && audio.metadata.album.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (audio.metadata?.description && audio.metadata.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (audio.tags && audio.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = filterCategory === "all" || 
      (audio.metadata?.category && audio.metadata.category === filterCategory) ||
      (filterCategory === "binaural_beat" && audio.metadata?.binauralBeat);
    
    return matchesSearch && matchesCategory;
  });
  
  // Update audio categories count
  const categoryCounts = audioCategories.map(category => {
    const count = audioFiles.filter(audio => {
      if (category.id === "binaural_beat") {
        return audio.metadata?.binauralBeat;
      }
      return audio.metadata?.category === category.id;
    }).length;
    
    return { ...category, count };
  });
  
  return (
    <AdminLayout>
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audio Manager</h1>
            <p className="text-muted-foreground">
              Upload, organize, and manage audio content for your website.
            </p>
          </div>
          
          <div className="flex space-x-2">
            {selectedAudioIds.size > 0 && (
              <Button 
                variant="outline"
                onClick={() => setIsBatchProcessDialogOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Batch Process ({selectedAudioIds.size})
              </Button>
            )}
            
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Upload Audio
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  Browse audio files by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={filterCategory === "all" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setFilterCategory("all")}
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    All Audio Files
                    <Badge className="ml-auto">{audioFiles.length}</Badge>
                  </Button>
                  
                  {categoryCounts.map(category => (
                    <Button
                      key={category.id}
                      variant={filterCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setFilterCategory(category.id)}
                    >
                      <Music className="mr-2 h-4 w-4" />
                      {category.name}
                      <Badge className="ml-auto">{category.count}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {filterCategory === "all" 
                      ? "All Audio Files" 
                      : categoryCounts.find(c => c.id === filterCategory)?.name || "Audio Files"}
                  </CardTitle>
                  
                  <div className="flex space-x-2">
                    <Select
                      value={audioViewMode}
                      onValueChange={(value: AudioViewMode) => setAudioViewMode(value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="View Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid View</SelectItem>
                        <SelectItem value="list">List View</SelectItem>
                        <SelectItem value="waveform">Waveform View</SelectItem>
                        <SelectItem value="playlist">Playlist View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by title, artist, album or tags..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredAudioFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Music className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-1">No Audio Files Found</h3>
                    <p className="text-muted-foreground max-w-sm">
                      {searchQuery || filterCategory !== "all" 
                        ? "No audio files match your search criteria. Try adjusting your filters."
                        : "You haven't uploaded any audio files yet. Click the upload button to get started."}
                    </p>
                    {!(searchQuery || filterCategory !== "all") && (
                      <Button 
                        variant="default" 
                        className="mt-4"
                        onClick={() => setIsUploadDialogOpen(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Audio
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Audio Player for Now Playing */}
                    {nowPlaying && (
                      <div className="bg-muted rounded-lg overflow-hidden p-4 mb-4">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-16 w-16 bg-primary/20 rounded-md flex items-center justify-center">
                            <Music className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{nowPlaying.metadata?.title || nowPlaying.originalFilename}</h3>
                            <p className="text-sm text-muted-foreground">
                              {nowPlaying.metadata?.artist ? `${nowPlaying.metadata.artist}` : ''} 
                              {nowPlaying.metadata?.artist && nowPlaying.metadata?.album ? ' • ' : ''}
                              {nowPlaying.metadata?.album ? `${nowPlaying.metadata.album}` : ''}
                            </p>
                          </div>
                        </div>
                        
                        <audio
                          ref={audioPlayerRef}
                          src={nowPlaying.fileUrl}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          onEnded={() => setIsPlaying(false)}
                          onPause={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          autoPlay
                        />
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-muted-foreground w-16">
                              {formatTime(currentTime)}
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
                            <div className="text-xs text-muted-foreground w-16 text-right">
                              {formatTime(duration)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={togglePlay}
                              >
                                {isPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={toggleLoop}
                              >
                                <BarChart2 className={`h-4 w-4 ${loop ? 'text-primary' : ''}`} />
                              </Button>
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={toggleMute}
                                >
                                  {isMuted ? (
                                    <VolumeX className="h-4 w-4" />
                                  ) : (
                                    <Volume2 className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                <div className="w-20">
                                  <Slider
                                    value={[isMuted ? 0 : volume]}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onValueChange={handleVolumeChange}
                                    className="cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Select
                                value={playbackRate.toString()}
                                onValueChange={handlePlaybackRateChange}
                              >
                                <SelectTrigger className="w-[70px] h-8">
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
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(nowPlaying)}
                              >
                                <Info className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Audio Gallery View */}
                    <MediaGalleryView
                      mediaFiles={filteredAudioFiles}
                      selectedMediaIds={selectedAudioIds}
                      onToggleSelectMedia={handleToggleSelectAudio}
                      onViewDetails={handleViewDetails}
                      onDelete={(audio) => {
                        setCurrentAudio(audio);
                        setIsDeleteConfirmOpen(true);
                      }}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Audio</DialogTitle>
              <DialogDescription>
                Upload audio files to enhance your website. Supported formats: MP3, WAV, OGG, FLAC.
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
                    accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/flac"
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-4">
                        <FileMusic size={64} className="text-green-500" />
                      </div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Change Audio
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-1">Click to upload or drag and drop</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        MP3, WAV, OGG, or FLAC (max. 50MB)
                      </p>
                      <Button variant="secondary" size="sm">
                        Select Audio
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
                      value={audioMetadata.title}
                      onChange={(e) => setAudioMetadata(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter audio title"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="artist" className="text-sm font-medium">
                        Artist
                      </label>
                      <Input
                        id="artist"
                        value={audioMetadata.artist}
                        onChange={(e) => setAudioMetadata(prev => ({ ...prev, artist: e.target.value }))}
                        placeholder="Enter artist name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="album" className="text-sm font-medium">
                        Album
                      </label>
                      <Input
                        id="album"
                        value={audioMetadata.album}
                        onChange={(e) => setAudioMetadata(prev => ({ ...prev, album: e.target.value }))}
                        placeholder="Enter album name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="genre" className="text-sm font-medium">
                        Genre
                      </label>
                      <Input
                        id="genre"
                        value={audioMetadata.genre}
                        onChange={(e) => setAudioMetadata(prev => ({ ...prev, genre: e.target.value }))}
                        placeholder="Enter genre"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="category" className="text-sm font-medium">
                        Category
                      </label>
                      <Select
                        value={audioMetadata.category}
                        onValueChange={(value) => setAudioMetadata(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {audioCategories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Input
                      id="description"
                      value={audioMetadata.description}
                      onChange={(e) => setAudioMetadata(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="tags" className="text-sm font-medium">
                      Tags (comma separated)
                    </label>
                    <Input
                      id="tags"
                      value={audioMetadata.tags}
                      onChange={(e) => setAudioMetadata(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., music, ambient, relaxing"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="px-0"
                    >
                      {showAdvancedOptions ? "Hide Advanced Options" : "Show Advanced Options"}
                    </Button>
                  </div>
                  
                  {showAdvancedOptions && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="bpm" className="text-sm font-medium">
                            BPM
                          </label>
                          <Input
                            id="bpm"
                            type="number"
                            value={audioMetadata.bpm}
                            onChange={(e) => setAudioMetadata(prev => ({ ...prev, bpm: e.target.value }))}
                            placeholder="Enter BPM"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="key" className="text-sm font-medium">
                            Key
                          </label>
                          <Select
                            value={audioMetadata.key}
                            onValueChange={(value) => setAudioMetadata(prev => ({ ...prev, key: value }))}
                          >
                            <SelectTrigger id="key">
                              <SelectValue placeholder="Select key" />
                            </SelectTrigger>
                            <SelectContent>
                              {musicKeys.map(key => (
                                <SelectItem key={key} value={key}>
                                  {key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="frequency" className="text-sm font-medium">
                            Frequency (Hz)
                          </label>
                          <Input
                            id="frequency"
                            type="number"
                            value={audioMetadata.frequency}
                            onChange={(e) => setAudioMetadata(prev => ({ ...prev, frequency: e.target.value }))}
                            placeholder="Enter frequency"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="isLoop"
                          checked={audioMetadata.isLoop}
                          onCheckedChange={(checked) => 
                            setAudioMetadata(prev => ({ 
                              ...prev, 
                              isLoop: checked === true 
                            }))
                          }
                        />
                        <label htmlFor="isLoop" className="text-sm font-medium">
                          This audio is designed to loop seamlessly
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="binauralBeat"
                          checked={audioMetadata.binauralBeat}
                          onCheckedChange={(checked) => 
                            setAudioMetadata(prev => ({ 
                              ...prev, 
                              binauralBeat: checked === true,
                              category: checked === true ? 'binaural_beat' : prev.category
                            }))
                          }
                        />
                        <label htmlFor="binauralBeat" className="text-sm font-medium">
                          This is a binaural beat / frequency track
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="page" className="text-sm font-medium">
                            Page
                          </label>
                          <Input
                            id="page"
                            value={audioMetadata.page}
                            onChange={(e) => setAudioMetadata(prev => ({ ...prev, page: e.target.value }))}
                            placeholder="Enter page name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="section" className="text-sm font-medium">
                            Section
                          </label>
                          <Input
                            id="section"
                            value={audioMetadata.section}
                            onChange={(e) => setAudioMetadata(prev => ({ ...prev, section: e.target.value }))}
                            placeholder="Enter section name"
                          />
                        </div>
                      </div>
                    </div>
                  )}
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
                disabled={isUploading || !selectedFile || !audioMetadata.title}
              >
                {isUploading ? "Uploading..." : "Upload Audio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Audio Detail Dialog */}
        <Dialog open={isAudioDetailOpen} onOpenChange={setIsAudioDetailOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{currentAudio?.metadata?.title || currentAudio?.originalFilename}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {/* Audio Player */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 bg-primary/20 rounded-md flex items-center justify-center">
                    <Music className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{currentAudio?.metadata?.title || currentAudio?.originalFilename}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentAudio?.metadata?.artist ? `${currentAudio.metadata.artist}` : ''} 
                      {currentAudio?.metadata?.artist && currentAudio?.metadata?.album ? ' • ' : ''}
                      {currentAudio?.metadata?.album ? `${currentAudio.metadata.album}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => handlePlayAudio(currentAudio!)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                </div>
                
                {/* Waveform placeholder */}
                <div className="h-24 bg-black/5 rounded-md flex items-center justify-center mb-2">
                  <Waveform className="h-12 w-12 text-primary/30" />
                </div>
              </div>
              
              {/* Audio Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-sm mb-2">Audio Information</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Title:</span> {currentAudio?.metadata?.title || 'Not specified'}</p>
                    <p><span className="text-muted-foreground">Artist:</span> {currentAudio?.metadata?.artist || 'Not specified'}</p>
                    <p><span className="text-muted-foreground">Album:</span> {currentAudio?.metadata?.album || 'Not specified'}</p>
                    <p><span className="text-muted-foreground">Genre:</span> {currentAudio?.metadata?.genre || 'Not specified'}</p>
                    <p><span className="text-muted-foreground">Category:</span> {
                      currentAudio?.metadata?.category 
                        ? audioCategories.find(c => c.id === currentAudio.metadata?.category)?.name || currentAudio.metadata.category
                        : 'Not specified'
                    }</p>
                    <p><span className="text-muted-foreground">Duration:</span> {
                      currentAudio?.metadata?.duration 
                        ? formatTime(currentAudio.metadata.duration) 
                        : 'Unknown'
                    }</p>
                    <p><span className="text-muted-foreground">Description:</span> {currentAudio?.metadata?.description || 'None'}</p>
                  </div>
                  
                  {/* Technical Information */}
                  <h4 className="font-medium text-sm mt-4 mb-2">Technical Information</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">BPM:</span> {currentAudio?.metadata?.bpm || 'Not specified'}</p>
                    <p><span className="text-muted-foreground">Key:</span> {currentAudio?.metadata?.key || 'Not specified'}</p>
                    <p><span className="text-muted-foreground">Frequency:</span> {currentAudio?.metadata?.frequency ? `${currentAudio.metadata.frequency} Hz` : 'Not specified'}</p>
                    <p><span className="text-muted-foreground">Loop:</span> {currentAudio?.metadata?.isLoop ? 'Yes' : 'No'}</p>
                    <p><span className="text-muted-foreground">Binaural Beat:</span> {currentAudio?.metadata?.binauralBeat ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">File Details</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Original Name:</span> {currentAudio?.originalFilename}</p>
                    <p><span className="text-muted-foreground">Filename:</span> {currentAudio?.filename}</p>
                    <p><span className="text-muted-foreground">Format:</span> {currentAudio?.mimeType}</p>
                    <p><span className="text-muted-foreground">Size:</span> {currentAudio?.fileSize ? formatFileSize(currentAudio.fileSize) : 'Unknown'}</p>
                    <p><span className="text-muted-foreground">Uploaded:</span> {
                      currentAudio?.uploadedAt 
                        ? new Date(currentAudio.uploadedAt).toLocaleDateString() 
                        : 'Unknown'
                    }</p>
                    <p><span className="text-muted-foreground">Page:</span> {currentAudio?.page || 'Not specified'}</p>
                    <p><span className="text-muted-foreground">Section:</span> {currentAudio?.section || 'Not specified'}</p>
                  </div>
                  
                  {/* Tags */}
                  {currentAudio?.tags && currentAudio.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentAudio.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePlayAudio(currentAudio!)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Play Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(currentAudio?.fileUrl, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsAudioDetailOpen(false);
                      setIsDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  <Button variant="default" onClick={() => setIsAudioDetailOpen(false)}>
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
              <DialogTitle>Delete Audio</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this audio file? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800 text-sm">
                <p className="font-medium">Warning</p>
                <p>Deleting this audio file will remove it from all pages where it is used.</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => currentAudio && deleteAudioMutation.mutate(currentAudio.id)}
              >
                Delete Audio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Batch Process Dialog */}
        <Dialog open={isBatchProcessDialogOpen} onOpenChange={setIsBatchProcessDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Batch Process Audio</DialogTitle>
              <DialogDescription>
                Apply processing to {selectedAudioIds.size} selected audio files.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="normalizeVolume"
                  checked={batchOptions.normalizeVolume}
                  onCheckedChange={(checked) => 
                    setBatchOptions(prev => ({ 
                      ...prev, 
                      normalizeVolume: checked === true 
                    }))
                  }
                />
                <label htmlFor="normalizeVolume" className="text-sm font-medium">
                  Normalize Volume
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addFadeIn"
                  checked={batchOptions.addFadeIn}
                  onCheckedChange={(checked) => 
                    setBatchOptions(prev => ({ 
                      ...prev, 
                      addFadeIn: checked === true 
                    }))
                  }
                />
                <label htmlFor="addFadeIn" className="text-sm font-medium">
                  Add Fade In
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addFadeOut"
                  checked={batchOptions.addFadeOut}
                  onCheckedChange={(checked) => 
                    setBatchOptions(prev => ({ 
                      ...prev, 
                      addFadeOut: checked === true 
                    }))
                  }
                />
                <label htmlFor="addFadeOut" className="text-sm font-medium">
                  Add Fade Out
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="convertFormat"
                  checked={batchOptions.convertFormat}
                  onCheckedChange={(checked) => 
                    setBatchOptions(prev => ({ 
                      ...prev, 
                      convertFormat: checked === true 
                    }))
                  }
                />
                <label htmlFor="convertFormat" className="text-sm font-medium">
                  Convert Format
                </label>
              </div>
              
              {batchOptions.convertFormat && (
                <div className="ml-6 space-y-2">
                  <label htmlFor="targetFormat" className="text-sm font-medium">
                    Target Format
                  </label>
                  <Select
                    value={batchOptions.targetFormat}
                    onValueChange={(value) => setBatchOptions(prev => ({ ...prev, targetFormat: value }))}
                  >
                    <SelectTrigger id="targetFormat">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="wav">WAV</SelectItem>
                      <SelectItem value="ogg">OGG</SelectItem>
                      <SelectItem value="flac">FLAC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addWatermark"
                  checked={batchOptions.addWatermark}
                  onCheckedChange={(checked) => 
                    setBatchOptions(prev => ({ 
                      ...prev, 
                      addWatermark: checked === true 
                    }))
                  }
                />
                <label htmlFor="addWatermark" className="text-sm font-medium">
                  Add Audio Watermark
                </label>
              </div>
              
              {batchOptions.addWatermark && (
                <div className="ml-6 space-y-2">
                  <label htmlFor="watermarkText" className="text-sm font-medium">
                    Watermark Text (for text-to-speech watermark)
                  </label>
                  <Input
                    id="watermarkText"
                    value={batchOptions.watermarkText}
                    onChange={(e) => setBatchOptions(prev => ({ ...prev, watermarkText: e.target.value }))}
                    placeholder="Enter watermark text"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBatchProcessDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleBatchProcess}
                disabled={
                  !batchOptions.normalizeVolume && 
                  !batchOptions.addFadeIn && 
                  !batchOptions.addFadeOut && 
                  !batchOptions.convertFormat && 
                  !batchOptions.addWatermark
                }
              >
                Process {selectedAudioIds.size} Files
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}