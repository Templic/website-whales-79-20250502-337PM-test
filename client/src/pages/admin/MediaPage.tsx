/**
 * MediaPage.tsx
 * 
 * Enhanced Media Management for the Admin Portal
 * Allows uploading, organizing, and managing various media types
 */
import { useState, useRef, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MediaGallery, { GalleryViewMode } from "@/components/features/admin/MediaGallery";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  File,
  Video,
  Music,
  Edit,
  Search,
  Filter,
  Trash2,
  Info,
  Download,
  Link,
  Pencil,
  Grid2X2,
  List,
  LayoutGrid,
  Columns,
  Check,
  MoreHorizontal,
  Move,
  Folder,
  Tag,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define media file type
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

// Key-value pair for page-section mappings
const pageSectionMappings: Record<string, string[]> = {
  "home": ["hero", "about-preview", "music-preview", "gallery", "featured-content", "testimonials"],
  "about": ["bio", "mission", "vision", "team", "gallery", "timeline"],
  "tour": ["upcoming-events", "past-events", "gallery", "featured-event"],
  "engage": ["ways-to-engage", "community", "resources", "contact-section"],
  "blog": ["featured-posts", "post-content", "sidebar", "header-image"],
  "shop": ["featured-products", "product-galleries", "banners", "promotional"],
  "cosmic_experience": ["main-content", "immersive-gallery", "background", "interactive-elements"],
  "community": ["events", "members", "activities", "shared-content"],
  "resources": ["guides", "tutorials", "downloads", "reference"],
  "newsletter": ["header", "content", "footer", "sidebar"],
  "admin": ["dashboard", "reports", "ui-elements"]
};

// File type categories for filtering
type FileCategory = "image" | "audio" | "video" | "document" | "other" | "all";

export default function MediaPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isFileDetailOpen, setIsFileDetailOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileCategory>("all");
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "slider">("grid");
  
  // Bulk operations states
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(new Set());
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'move' | 'categorize' | 'tag' | 'analyze'>('delete');
  const [bulkTargetPage, setBulkTargetPage] = useState<string>("");
  const [bulkTargetSection, setBulkTargetSection] = useState<string>("");
  const [bulkCustomSection, setBulkCustomSection] = useState<string>("");
  const [bulkAvailableSections, setBulkAvailableSections] = useState<string[]>([]);
  const [bulkTags, setBulkTags] = useState<string>("");
  const [isAutoTaggingInProgress, setIsAutoTaggingInProgress] = useState(false);
  
  // Upload configuration
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [customSection, setCustomSection] = useState<string>("");
  const [position, setPosition] = useState({
    x: 50, // centered by default (0-100%)
    y: 50, // centered by default (0-100%)
    size: 100, // default size (%)
    zIndex: 0, // default stacking order
  });
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    alt: "",
  });
  const [advancedOptionsVisible, setAdvancedOptionsVisible] = useState(false);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [useCustomPosition, setUseCustomPosition] = useState(false);
  
  // Constants
  const itemsPerPage = 12;
  
  // Get available pages from mappings
  const availablePages = Object.keys(pageSectionMappings);
  
  // Effect to update available sections when page changes
  const handlePageChange = (page: string) => {
    setSelectedPage(page);
    if (page && pageSectionMappings[page]) {
      setAvailableSections(pageSectionMappings[page]);
      setSelectedSection(""); // Reset section when page changes
    } else {
      setAvailableSections([]);
    }
  };
  
  // Fetch media files
  const { data: mediaFiles, isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media-files'],
    queryFn: async () => {
      const res = await fetch('/api/media');
      if (!res.ok) throw new Error('Failed to fetch media files');
      return res.json();
    }
  });
  
  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, it will be set automatically for FormData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      resetUploadForm();
      toast({
        title: "Upload Successful",
        description: "The file has been uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive"
      });
    }
  });
  
  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      const res = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete file');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setIsDeleteConfirmOpen(false);
      setSelectedMedia(null);
      toast({
        title: "File Deleted",
        description: "The file has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: "destructive"
      });
    }
  });
  
  // File input change handler
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      // Auto-detect file metadata
      const file = files[0];
      setMetadata({
        ...metadata,
        title: file.name.split('.')[0], // Set title to filename without extension
      });
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Submit upload form
  const handleSubmitUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedPage) {
      toast({
        title: "Page Required",
        description: "Please select a target page for this file",
        variant: "destructive"
      });
      return;
    }
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('page', selectedPage);
    formData.append('section', selectedSection || customSection || 'default');
    
    // Add position information if custom positioning is enabled
    if (useCustomPosition) {
      formData.append('position', JSON.stringify(position));
    }
    
    // Add metadata
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
    }, 100);
    
    // Execute upload mutation
    uploadMediaMutation.mutate(formData, {
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
  
  // Reset upload form fields
  const resetUploadForm = () => {
    setSelectedFile(null);
    setSelectedPage("");
    setSelectedSection("");
    setCustomSection("");
    setPosition({
      x: 50,
      y: 50,
      size: 100,
      zIndex: 0
    });
    setMetadata({
      title: "",
      description: "",
      alt: ""
    });
    setUseCustomPosition(false);
    setAdvancedOptionsVisible(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Show file details
  const handleViewDetails = (media: MediaFile) => {
    setSelectedMedia(media);
    setIsFileDetailOpen(true);
  };
  
  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get file type icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-10 h-10 text-blue-500" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="w-10 h-10 text-green-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="w-10 h-10 text-purple-500" />;
    } else if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="w-10 h-10 text-red-500" />;
    } else {
      return <File className="w-10 h-10 text-gray-500" />;
    }
  };
  
  // Bulk operation handlers
  const handleToggleSelectMedia = (mediaId: number) => {
    setSelectedMediaIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(mediaId)) {
        newSelection.delete(mediaId);
      } else {
        newSelection.add(mediaId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (filteredMedia.length > 0 && selectedMediaIds.size === filteredMedia.length) {
      // If all are selected, deselect all
      setSelectedMediaIds(new Set());
    } else {
      // Otherwise, select all filtered media
      const allIds = filteredMedia.map(media => media.id);
      setSelectedMediaIds(new Set(allIds));
    }
  };

  // Handle bulk page change for move operation
  const handleBulkPageChange = (page: string) => {
    setBulkTargetPage(page);
    if (page && pageSectionMappings[page]) {
      setBulkAvailableSections(pageSectionMappings[page]);
      setBulkTargetSection(""); // Reset section when page changes
    } else {
      setBulkAvailableSections([]);
    }
  };

  // Perform bulk delete operation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (mediaIds: number[]) => {
      const res = await fetch('/api/media/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: mediaIds }),
      });
      
      if (!res.ok) throw new Error('Failed to delete files');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setIsBulkActionDialogOpen(false);
      setSelectedMediaIds(new Set());
      toast({
        title: "Files Deleted",
        description: "The selected files have been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete files',
        variant: "destructive"
      });
    }
  });

  // Perform bulk move operation
  const bulkMoveMutation = useMutation({
    mutationFn: async ({ ids, page, section }: { ids: number[], page: string, section: string }) => {
      const res = await fetch('/api/media/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ids, 
          updates: { 
            page, 
            section 
          } 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to move files');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setIsBulkActionDialogOpen(false);
      setSelectedMediaIds(new Set());
      toast({
        title: "Files Moved",
        description: "The selected files have been moved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Move Failed",
        description: error instanceof Error ? error.message : 'Failed to move files',
        variant: "destructive"
      });
    }
  });

  // Perform bulk categorize operation
  const bulkCategorizeMutation = useMutation({
    mutationFn: async ({ ids, section }: { ids: number[], section: string }) => {
      const res = await fetch('/api/media/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ids, 
          updates: { 
            section 
          } 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to categorize files');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setIsBulkActionDialogOpen(false);
      setSelectedMediaIds(new Set());
      toast({
        title: "Files Categorized",
        description: "The selected files have been categorized successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Categorize Failed",
        description: error instanceof Error ? error.message : 'Failed to categorize files',
        variant: "destructive"
      });
    }
  });
  
  // Perform bulk tag operation
  const bulkTagMutation = useMutation({
    mutationFn: async ({ ids, tags }: { ids: number[], tags: string[] }) => {
      const res = await fetch('/api/media/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ids, 
          updates: { 
            tags 
          } 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to tag files');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setIsBulkActionDialogOpen(false);
      setSelectedMediaIds(new Set());
      toast({
        title: "Files Tagged",
        description: "The selected files have been tagged successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Tagging Failed",
        description: error instanceof Error ? error.message : 'Failed to tag files',
        variant: "destructive"
      });
    }
  });
  
  // Perform AI analysis and auto-tagging operation
  const autoAnalyzeMutation = useMutation({
    mutationFn: async (mediaIds: number[]) => {
      setIsAutoTaggingInProgress(true);
      const res = await fetch('/api/media/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: mediaIds }),
      });
      
      if (!res.ok) throw new Error('Failed to analyze files');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
      setIsBulkActionDialogOpen(false);
      setSelectedMediaIds(new Set());
      setIsAutoTaggingInProgress(false);
      toast({
        title: "AI Analysis Complete",
        description: `Successfully analyzed ${data.count} files and applied smart tags`,
      });
    },
    onError: (error) => {
      setIsAutoTaggingInProgress(false);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Failed to analyze files',
        variant: "destructive"
      });
    }
  });

  // Execute the appropriate bulk action
  const executeBulkAction = () => {
    const selectedIds = Array.from(selectedMediaIds);
    
    if (selectedIds.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file",
        variant: "destructive"
      });
      return;
    }
    
    if (bulkActionType === 'delete') {
      bulkDeleteMutation.mutate(selectedIds);
    } else if (bulkActionType === 'move') {
      if (!bulkTargetPage) {
        toast({
          title: "Page Required",
          description: "Please select a target page",
          variant: "destructive"
        });
        return;
      }
      
      bulkMoveMutation.mutate({ 
        ids: selectedIds, 
        page: bulkTargetPage, 
        section: bulkTargetSection || bulkCustomSection || 'default' 
      });
    } else if (bulkActionType === 'categorize') {
      if (!bulkTargetSection && !bulkCustomSection) {
        toast({
          title: "Section Required",
          description: "Please select a target section or enter a custom one",
          variant: "destructive"
        });
        return;
      }
      
      bulkCategorizeMutation.mutate({ 
        ids: selectedIds, 
        section: bulkTargetSection || bulkCustomSection 
      });
    } else if (bulkActionType === 'tag') {
      if (!bulkTags.trim()) {
        toast({
          title: "Tags Required",
          description: "Please enter at least one tag",
          variant: "destructive"
        });
        return;
      }
      
      // Convert comma-separated tags to array and trim whitespace
      const tagArray = bulkTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      bulkTagMutation.mutate({ 
        ids: selectedIds, 
        tags: tagArray 
      });
    } else if (bulkActionType === 'analyze') {
      setIsAutoTaggingInProgress(true);
      
      // Get the selected media
      autoAnalyzeMutation.mutate(selectedIds, {
        onSettled: () => {
          setIsAutoTaggingInProgress(false);
        }
      });
    }
  };

  // Filter media files based on search and filters
  const filteredMedia = mediaFiles?.filter(media => {
    // Search query filter
    const matchesSearch = searchQuery === "" || 
      media.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (media.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (media.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // File type filter
    let matchesType = true;
    if (fileTypeFilter !== "all") {
      if (fileTypeFilter === "image") {
        matchesType = media.mimeType.startsWith('image/');
      } else if (fileTypeFilter === "audio") {
        matchesType = media.mimeType.startsWith('audio/');
      } else if (fileTypeFilter === "video") {
        matchesType = media.mimeType.startsWith('video/');
      } else if (fileTypeFilter === "document") {
        matchesType = media.mimeType.startsWith('text/') || 
          media.mimeType.includes('pdf') || 
          media.mimeType.includes('document');
      } else if (fileTypeFilter === "other") {
        matchesType = !media.mimeType.startsWith('image/') && 
          !media.mimeType.startsWith('audio/') && 
          !media.mimeType.startsWith('video/') && 
          !media.mimeType.startsWith('text/') && 
          !media.mimeType.includes('pdf') && 
          !media.mimeType.includes('document');
      }
    }
    
    // Page filter
    const matchesPage = pageFilter === "all" || media.page === pageFilter;
    
    return matchesSearch && matchesType && matchesPage;
  }) || [];
  
  // Paginate the media files
  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <div className="flex items-center gap-2">
            {selectedMediaIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setBulkActionType('delete');
                  setIsBulkActionDialogOpen(true);
                }}
                className="text-red-500 border-red-200 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedMediaIds.size})
              </Button>
            )}
            
            {selectedMediaIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setBulkActionType('move');
                  setIsBulkActionDialogOpen(true);
                }}
              >
                <Move className="h-4 w-4 mr-2" />
                Move ({selectedMediaIds.size})
              </Button>
            )}
            
            {selectedMediaIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setBulkActionType('categorize');
                  setIsBulkActionDialogOpen(true);
                }}
              >
                <Folder className="h-4 w-4 mr-2" />
                Categorize ({selectedMediaIds.size})
              </Button>
            )}
            
            {selectedMediaIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setBulkActionType('tag');
                  setIsBulkActionDialogOpen(true);
                }}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <Tag className="h-4 w-4 mr-2" />
                Add Tags ({selectedMediaIds.size})
              </Button>
            )}
            
            {selectedMediaIds.size > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setBulkActionType('analyze');
                  setIsBulkActionDialogOpen(true);
                }}
                className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                AI Analyze ({selectedMediaIds.size})
              </Button>
            )}
            

            
            <Button 
              variant="default" 
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New Media
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Media Library</CardTitle>
            <CardDescription>
              Manage all your media files across the website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search media..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={fileTypeFilter} onValueChange={(value) => setFileTypeFilter(value as FileCategory)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="File Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={pageFilter} onValueChange={setPageFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pages</SelectItem>
                        {availablePages.map(page => (
                          <SelectItem key={page} value={page}>
                            {page.charAt(0).toUpperCase() + page.slice(1).replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <div className="flex space-x-2 border rounded-md p-1">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-9 w-9"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="h-9 w-9"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <TabsContent value="all" className="mt-4">
                {isLoading ? (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Array(8).fill(0).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="aspect-square bg-muted">
                            <Skeleton className="h-full w-full" />
                          </div>
                          <CardContent className="p-4">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead>Page</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array(5).fill(0).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Skeleton className="h-12 w-12 rounded-md" />
                                  <Skeleton className="h-4 w-[180px]" />
                                </div>
                              </TableCell>
                              <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                              <TableCell className="text-right">
                                <Skeleton className="h-9 w-20 ml-auto" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : paginatedMedia.length > 0 ? (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {paginatedMedia.map((media) => (
                        <Card key={media.id} className="overflow-hidden hover:shadow-md transition-shadow relative">
                          <div className="absolute top-3 left-3 z-10">
                            <div className="bg-white rounded-md shadow">
                              <Checkbox 
                                checked={selectedMediaIds.has(media.id)}
                                onCheckedChange={() => handleToggleSelectMedia(media.id)}
                                aria-label={`Select ${media.originalFilename}`}
                                className="border-gray-300"
                              />
                            </div>
                          </div>
                          <div 
                            className="aspect-square bg-muted flex items-center justify-center cursor-pointer"
                            onClick={() => handleViewDetails(media)}
                          >
                            {media.mimeType.startsWith('image/') ? (
                              <img 
                                src={media.fileUrl} 
                                alt={media.metadata?.alt || media.filename} 
                                className="h-full w-full object-cover"
                              />
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
                            <div className="flex mt-2 gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleViewDetails(media)}
                              >
                                <Info className="h-3.5 w-3.5 mr-1" />
                                Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedMedia(media);
                                  setIsDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox 
                                checked={filteredMedia.length > 0 && selectedMediaIds.size === filteredMedia.length} 
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>File</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead>Page / Section</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedMedia.map((media) => (
                            <TableRow key={media.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedMediaIds.has(media.id)}
                                  onCheckedChange={(checked) => {
                                    handleToggleSelectMedia(media.id);
                                  }}
                                  aria-label={`Select ${media.originalFilename}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {media.mimeType.startsWith('image/') ? (
                                    <div className="h-12 w-12 rounded-md bg-muted overflow-hidden">
                                      <img 
                                        src={media.fileUrl} 
                                        alt={media.metadata?.alt || media.filename} 
                                        className="h-full w-full object-cover" 
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                      {getFileIcon(media.mimeType)}
                                    </div>
                                  )}
                                  <div className="truncate max-w-[200px]">
                                    <div className="font-medium">{media.metadata?.title || media.originalFilename}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {media.originalFilename}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                              <TableCell>{formatFileSize(media.fileSize)}</TableCell>
                              <TableCell>{formatDate(media.uploadedAt)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="capitalize">{media.page.replace('_', ' ')}</span>
                                  {media.section && (
                                    <span className="text-xs text-muted-foreground">{media.section}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleViewDetails(media)}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => window.open(media.fileUrl, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => {
                                      setSelectedMedia(media);
                                      setIsDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-1">No Media Files Found</h3>
                    <p className="text-muted-foreground max-w-sm">
                      {searchQuery || fileTypeFilter !== "all" || pageFilter !== "all" 
                        ? "No files match your search criteria. Try adjusting your filters."
                        : "Upload your first file to get started with the media library."}
                    </p>
                    {!(searchQuery || fileTypeFilter !== "all" || pageFilter !== "all") && (
                      <Button 
                        variant="default" 
                        className="mt-4"
                        onClick={() => setUploadDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Pagination */}
            {!isLoading && filteredMedia.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between my-6">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredMedia.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredMedia.length}</span> results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Bulk Action Dialog */}
      <Dialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {bulkActionType === 'delete' && 'Delete Multiple Files'}
              {bulkActionType === 'move' && 'Move Multiple Files'}
              {bulkActionType === 'categorize' && 'Categorize Multiple Files'}
              {bulkActionType === 'tag' && 'Tag Multiple Files'}
              {bulkActionType === 'analyze' && 'AI Analyze Files'}
            </DialogTitle>
            <DialogDescription>
              {bulkActionType === 'delete' && `You are about to delete ${selectedMediaIds.size} files. This action cannot be undone.`}
              {bulkActionType === 'move' && `Update the page location for ${selectedMediaIds.size} files.`}
              {bulkActionType === 'categorize' && `Update the section for ${selectedMediaIds.size} files within their current pages.`}
              {bulkActionType === 'tag' && `Add tags to ${selectedMediaIds.size} files to make them easier to find.`}
              {bulkActionType === 'analyze' && `Analyze ${selectedMediaIds.size} files with AI to automatically generate descriptive tags.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {bulkActionType === 'delete' && (
              <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800 text-sm">
                <p className="font-medium">Warning</p>
                <p>Deleting files will remove them from all pages where they are used. This action cannot be undone.</p>
              </div>
            )}
            
            {bulkActionType === 'move' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkTargetPage">Target Page *</Label>
                  <Select value={bulkTargetPage} onValueChange={handleBulkPageChange}>
                    <SelectTrigger id="bulkTargetPage">
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePages.map(page => (
                        <SelectItem key={page} value={page}>
                          {page.charAt(0).toUpperCase() + page.slice(1).replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulkTargetSection">Section</Label>
                  <Select 
                    value={bulkTargetSection} 
                    onValueChange={setBulkTargetSection}
                    disabled={!bulkTargetPage || bulkAvailableSections.length === 0}
                  >
                    <SelectTrigger id="bulkTargetSection">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Section</SelectItem>
                      {bulkAvailableSections.map(section => (
                        <SelectItem key={section} value={section}>
                          {section.replace("-", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {bulkTargetSection === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="bulkCustomSection">Custom Section Name</Label>
                    <Input
                      id="bulkCustomSection"
                      placeholder="Enter section name"
                      value={bulkCustomSection}
                      onChange={(e) => setBulkCustomSection(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            
            {bulkActionType === 'categorize' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkTargetSection">Section *</Label>
                  <Select 
                    value={bulkTargetSection} 
                    onValueChange={setBulkTargetSection}
                  >
                    <SelectTrigger id="bulkTargetSection">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Section</SelectItem>
                      {Object.values(pageSectionMappings).flat().map((section, index) => (
                        <SelectItem key={index} value={section}>
                          {section.replace("-", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {bulkTargetSection === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="bulkCustomSection">Custom Section Name</Label>
                    <Input
                      id="bulkCustomSection"
                      placeholder="Enter section name"
                      value={bulkCustomSection}
                      onChange={(e) => setBulkCustomSection(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            
            {bulkActionType === 'tag' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkTags">Tags *</Label>
                  <Input 
                    id="bulkTags"
                    placeholder="Enter tags separated by commas (e.g., landscape, ocean, nature)"
                    value={bulkTags}
                    onChange={(e) => setBulkTags(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tags help organize and find media more easily. Separate multiple tags with commas.
                  </p>
                </div>
              </div>
            )}
            
            {bulkActionType === 'analyze' && (
              <div className="space-y-4">
                {isAutoTaggingInProgress ? (
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-blue-800 text-sm flex flex-col items-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="font-medium">Analyzing media files...</p>
                    <p>Our AI system is analyzing your files to generate descriptive tags.</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-blue-800 text-sm">
                    <p className="font-medium">AI-Powered Media Analysis</p>
                    <p>Our system will examine your selected files and automatically generate descriptive tags based on their content.</p>
                    <ul className="list-disc list-inside mt-2">
                      <li>Images will be analyzed for objects, scenes, colors, and composition</li>
                      <li>Audio files will be analyzed for mood, tempo, and key characteristics</li>
                      <li>Documents will be analyzed for key topics and content themes</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBulkActionDialogOpen(false)}
            >
              Cancel
            </Button>
            
            <Button 
              variant={bulkActionType === 'delete' ? 'destructive' : 'default'}
              onClick={executeBulkAction}
              disabled={
                isAutoTaggingInProgress ||
                (bulkActionType === 'move' && !bulkTargetPage) ||
                (bulkActionType === 'categorize' && !bulkTargetSection && !bulkCustomSection) ||
                (bulkActionType === 'tag' && !bulkTags.trim())
              }
            >
              {bulkActionType === 'delete' && 'Delete Files'}
              {bulkActionType === 'move' && 'Move Files'}
              {bulkActionType === 'categorize' && 'Categorize Files'}
              {bulkActionType === 'tag' && 'Apply Tags'}
              {bulkActionType === 'analyze' && 'Start Analysis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* File Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Media File</DialogTitle>
            <DialogDescription>
              Upload images, videos, audio, documents, and more to use across the website.
            </DialogDescription>
          </DialogHeader>
          
          <div>
            {/* File Selection */}
            <div className="mb-6">
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
                  accept="image/*,audio/*,video/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    {selectedFile.type.startsWith("image/") ? (
                      <div className="w-32 h-32 mb-4 bg-muted rounded-md overflow-hidden">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-4">
                        {selectedFile.type.startsWith("audio/") && <Music size={64} className="text-green-500" />}
                        {selectedFile.type.startsWith("video/") && <Video size={64} className="text-purple-500" />}
                        {(selectedFile.type.startsWith("text/") || selectedFile.type.includes("pdf")) && (
                          <FileText size={64} className="text-red-500" />
                        )}
                        {!selectedFile.type.startsWith("image/") &&
                          !selectedFile.type.startsWith("audio/") &&
                          !selectedFile.type.startsWith("video/") &&
                          !selectedFile.type.startsWith("text/") &&
                          !selectedFile.type.includes("pdf") && <File size={64} className="text-gray-500" />}
                      </div>
                    )}
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-1">Click to upload or drag and drop</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Images, videos, audio, and documents
                    </p>
                    <Button variant="secondary" size="sm">
                      Select File
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Placement Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page">Target Page *</Label>
                  <Select value={selectedPage} onValueChange={handlePageChange}>
                    <SelectTrigger id="page">
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePages.map(page => (
                        <SelectItem key={page} value={page}>
                          {page.charAt(0).toUpperCase() + page.slice(1).replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Select 
                    value={selectedSection} 
                    onValueChange={setSelectedSection}
                    disabled={!selectedPage || availableSections.length === 0}
                  >
                    <SelectTrigger id="section">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Section</SelectItem>
                      {availableSections.map(section => (
                        <SelectItem key={section} value={section}>
                          {section.replace("-", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedSection === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customSection">Custom Section Name</Label>
                  <Input
                    id="customSection"
                    placeholder="Enter section name"
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value)}
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="advancedOptions"
                  checked={advancedOptionsVisible}
                  onCheckedChange={(checked) => setAdvancedOptionsVisible(!!checked)}
                />
                <label
                  htmlFor="advancedOptions"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Show advanced options
                </label>
              </div>
              
              {advancedOptionsVisible && (
                <div className="space-y-4 border rounded-md p-4 mt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title">Title</Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <Input
                      id="title"
                      placeholder="Enter title"
                      value={metadata.title}
                      onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description</Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Enter description"
                      value={metadata.description}
                      onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="alt">Alt Text</Label>
                      <span className="text-xs text-muted-foreground">For accessibility</span>
                    </div>
                    <Input
                      id="alt"
                      placeholder="Describe the image for screen readers"
                      value={metadata.alt}
                      onChange={(e) => setMetadata({ ...metadata, alt: e.target.value })}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useCustomPosition"
                        checked={useCustomPosition}
                        onCheckedChange={(checked) => setUseCustomPosition(!!checked)}
                      />
                      <label
                        htmlFor="useCustomPosition"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Specify custom positioning
                      </label>
                    </div>
                  </div>
                  
                  {useCustomPosition && (
                    <div className="space-y-4 pl-6 border-l-2 border-muted mt-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Horizontal Position (X)</Label>
                          <span className="text-xs text-muted-foreground">{position.x}%</span>
                        </div>
                        <Slider
                          value={[position.x]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => setPosition({ ...position, x: value[0] })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Vertical Position (Y)</Label>
                          <span className="text-xs text-muted-foreground">{position.y}%</span>
                        </div>
                        <Slider
                          value={[position.y]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => setPosition({ ...position, y: value[0] })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Size</Label>
                          <span className="text-xs text-muted-foreground">{position.size}%</span>
                        </div>
                        <Slider
                          value={[position.size]}
                          min={10}
                          max={200}
                          step={5}
                          onValueChange={(value) => setPosition({ ...position, size: value[0] })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Z-Index (Stacking Order)</Label>
                          <span className="text-xs text-muted-foreground">{position.zIndex}</span>
                        </div>
                        <Slider
                          value={[position.zIndex]}
                          min={-10}
                          max={10}
                          step={1}
                          onValueChange={(value) => setPosition({ ...position, zIndex: value[0] })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {isUploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmitUpload}
              disabled={!selectedFile || !selectedPage || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* File Details Dialog */}
      <Dialog open={isFileDetailOpen} onOpenChange={setIsFileDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedMedia && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMedia.metadata?.title || selectedMedia.originalFilename}</DialogTitle>
                <DialogDescription>
                  File details and information
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Preview */}
                <div className="bg-muted rounded-md overflow-hidden">
                  {selectedMedia.mimeType.startsWith('image/') ? (
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      <img 
                        src={selectedMedia.fileUrl} 
                        alt={selectedMedia.metadata?.alt || selectedMedia.filename} 
                        className="max-h-[300px] max-w-full object-contain" 
                      />
                    </div>
                  ) : selectedMedia.mimeType.startsWith('video/') ? (
                    <div className="aspect-video bg-black flex items-center justify-center">
                      <video 
                        src={selectedMedia.fileUrl} 
                        controls 
                        className="max-h-[300px] max-w-full" 
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : selectedMedia.mimeType.startsWith('audio/') ? (
                    <div className="aspect-[3/1] bg-muted flex items-center justify-center p-6">
                      <div className="w-full">
                        <Music className="h-10 w-10 text-green-500 mx-auto mb-4" />
                        <audio 
                          src={selectedMedia.fileUrl} 
                          controls 
                          className="w-full" 
                        >
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/1] bg-muted flex flex-col items-center justify-center p-6">
                      {getFileIcon(selectedMedia.mimeType)}
                      <p className="mt-4 text-muted-foreground">
                        This file type cannot be previewed. 
                        <a 
                          href={selectedMedia.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ml-1 text-blue-500 hover:underline"
                        >
                          Download
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                
                {/* File Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">File Name</h3>
                    <p className="break-all">{selectedMedia.originalFilename}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">File Type</h3>
                    <p>{selectedMedia.mimeType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">File Size</h3>
                    <p>{formatFileSize(selectedMedia.fileSize)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Uploaded</h3>
                    <p>{formatDate(selectedMedia.uploadedAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Page</h3>
                    <p className="capitalize">{selectedMedia.page.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Section</h3>
                    <p>{selectedMedia.section || 'Default'}</p>
                  </div>
                </div>
                
                {/* Description & Metadata */}
                {selectedMedia.metadata?.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p className="text-sm">{selectedMedia.metadata.description}</p>
                  </div>
                )}
                
                {/* Alt Text for Images */}
                {selectedMedia.mimeType.startsWith('image/') && selectedMedia.metadata?.alt && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Alt Text</h3>
                    <p className="text-sm">{selectedMedia.metadata.alt}</p>
                  </div>
                )}
                
                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setBulkActionType('tag');
                        setSelectedMediaIds(new Set([selectedMedia.id]));
                        setBulkTags(selectedMedia.tags?.join(', ') || '');
                        setIsFileDetailOpen(false);
                        setIsBulkActionDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit Tags
                    </Button>
                  </div>
                  
                  {selectedMedia.tags && selectedMedia.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedMedia.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No tags. Click 'Edit Tags' to add some or use AI analysis.
                    </div>
                  )}
                </div>
                
                {/* AI Analysis Button */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      setBulkActionType('analyze');
                      setSelectedMediaIds(new Set([selectedMedia.id]));
                      setIsFileDetailOpen(false);
                      setIsBulkActionDialogOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    AI Analyze
                  </Button>
                </div>
                
                {/* Positioning Information */}
                {selectedMedia.position && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Positioning</h3>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">X:</span> {selectedMedia.position.x}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Y:</span> {selectedMedia.position.y}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span> {selectedMedia.position.size}%
                      </div>
                      <div>
                        <span className="text-muted-foreground">Z-Index:</span> {selectedMedia.position.zIndex}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* URL & Embed code */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">URL</h3>
                  <div className="flex">
                    <Input
                      readOnly
                      value={selectedMedia.fileUrl}
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="ghost" 
                      className="ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMedia.fileUrl);
                        toast({
                          title: "URL Copied",
                          description: "File URL has been copied to clipboard"
                        });
                      }}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(selectedMedia.fileUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setIsFileDetailOpen(false);
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMedia && (
            <div className="flex items-center gap-3 py-2">
              {selectedMedia.mimeType.startsWith('image/') ? (
                <div className="h-12 w-12 rounded-md bg-muted overflow-hidden">
                  <img 
                    src={selectedMedia.fileUrl} 
                    alt={selectedMedia.metadata?.alt || selectedMedia.filename} 
                    className="h-full w-full object-cover" 
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                  {getFileIcon(selectedMedia.mimeType)}
                </div>
              )}
              <div>
                <p className="font-medium">{selectedMedia.metadata?.title || selectedMedia.originalFilename}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedMedia.fileSize)} • {selectedMedia.mimeType}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={deleteMediaMutation.isPending}
              onClick={() => selectedMedia && deleteMediaMutation.mutate(selectedMedia.id)}
            >
              {deleteMediaMutation.isPending ? "Deleting..." : "Delete File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}