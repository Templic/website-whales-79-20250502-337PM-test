/**
 * AdminEditor.tsx
 * 
 * A rich text editor component for the Admin Portal
 * Allows admins to edit content and upload images
 */
import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Editor } from "@tinymce/tinymce-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Save,
  RotateCcw,
  Eye,
  Image as ImageIcon,
  FileText,
  Layout,
  Pencil,
  Trash2,
} from "lucide-react";

// Define content item interface
interface ContentItem {
  id: number;
  type: 'text' | 'image' | 'html';
  key: string;
  title: string;
  content: string;
  page: string;
  section: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

const AdminEditor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  
  // State for editor
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [contentTitle, setContentTitle] = useState<string>("");
  const [contentKey, setContentKey] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [contentType, setContentType] = useState<'text' | 'image' | 'html'>('html');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  // Available pages
  const availablePages = [
    "home", "about", "tour", "engage", "blog", "shop", 
    "cosmic_experience", "community", "resources", "newsletter"
  ];
  
  // Page-section mappings
  const pageSections: Record<string, string[]> = {
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
  };
  
  // Get available sections for selected page
  const availableSections = selectedPage ? pageSections[selectedPage] || [] : [];

  // Query content items
  const { data: contentItems, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['content-items'],
    queryFn: async () => {
      const res = await fetch('/api/content');
      if (!res.ok) throw new Error('Failed to fetch content items');
      return res.json();
    }
  });
  
  // Filter content items by page and section
  const filteredContent = contentItems?.filter(item => {
    if (!selectedPage) return true;
    if (selectedPage && item.page !== selectedPage) return false;
    if (selectedSection && item.section !== selectedSection) return false;
    return true;
  }) || [];
  
  // Save content mutation
  const saveContentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isEditMode && selectedContent 
        ? `/api/content/${selectedContent.id}` 
        : '/api/content';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        body: data,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save content');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      resetForm();
      toast({
        title: isEditMode ? "Content Updated" : "Content Created",
        description: isEditMode 
          ? "The content has been updated successfully" 
          : "New content has been created successfully",
      });
      setIsEditMode(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
    }
  });
  
  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const res = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete content');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      resetForm();
      toast({
        title: "Content Deleted",
        description: "The content has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete content',
        variant: "destructive"
      });
    }
  });
  
  // Handle page change
  const handlePageChange = (page: string) => {
    setSelectedPage(page);
    setSelectedSection("");
  };
  
  // Handle image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedImage(files[0]);
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle editor content change
  const handleEditorChange = (content: string) => {
    setEditorContent(content);
  };
  
  // Save content handler
  const handleSaveContent = () => {
    if (!contentTitle || !contentKey || !selectedPage) {
      toast({
        title: "Missing Information",
        description: "Please provide a title, content key, and select a page",
        variant: "destructive"
      });
      return;
    }
    
    // Create FormData object
    const formData = new FormData();
    formData.append('title', contentTitle);
    formData.append('key', contentKey);
    formData.append('type', contentType);
    formData.append('page', selectedPage);
    formData.append('section', selectedSection || 'default');
    
    if (contentType === 'html') {
      formData.append('content', editorContent);
    } else if (contentType === 'text') {
      formData.append('content', editorContent);
    }
    
    if (contentType === 'image' && selectedImage) {
      formData.append('image', selectedImage);
    }
    
    // Execute save mutation
    saveContentMutation.mutate(formData);
  };
  
  // Edit content handler
  const handleEditContent = (content: ContentItem) => {
    setSelectedContent(content);
    setContentTitle(content.title);
    setContentKey(content.key);
    setContentType(content.type);
    setSelectedPage(content.page);
    setSelectedSection(content.section);
    setEditorContent(content.content);
    setIsEditMode(true);
    setIsPreviewMode(false);
  };
  
  // Delete content handler
  const handleDeleteContent = (contentId: number) => {
    if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      deleteContentMutation.mutate(contentId);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setSelectedContent(null);
    setContentTitle("");
    setContentKey("");
    setEditorContent("");
    setSelectedImage(null);
    setContentType('html');
    setIsPreviewMode(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Content Editor</h1>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Button 
              variant="outline" 
              onClick={resetForm}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button 
            variant={isPreviewMode ? "outline" : "default"} 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Content Listing */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Content Items</CardTitle>
            <CardDescription>
              Browse and edit existing content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contentPage">Filter by Page</Label>
                <Select value={selectedPage} onValueChange={handlePageChange}>
                  <SelectTrigger id="contentPage">
                    <SelectValue placeholder="All Pages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Pages</SelectItem>
                    {availablePages.map(page => (
                      <SelectItem key={page} value={page}>
                        {page.charAt(0).toUpperCase() + page.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPage && (
                <div className="space-y-2">
                  <Label htmlFor="contentSection">Filter by Section</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger id="contentSection">
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sections</SelectItem>
                      {availableSections.map(section => (
                        <SelectItem key={section} value={section}>
                          {section.replace("-", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Content Items</h3>
              {isLoading ? (
                <div className="text-center py-4">Loading content items...</div>
              ) : filteredContent.length > 0 ? (
                <div className="space-y-3">
                  {filteredContent.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleEditContent(item)}
                    >
                      <div className="flex items-center gap-2">
                        {item.type === 'html' && <Layout className="h-4 w-4 text-blue-500" />}
                        {item.type === 'text' && <FileText className="h-4 w-4 text-green-500" />}
                        {item.type === 'image' && <ImageIcon className="h-4 w-4 text-purple-500" />}
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.key}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContent(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No content items found. {selectedPage || selectedSection ? "Try adjusting your filters." : ""}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Editor Panel */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Content" : "Create Content"}</CardTitle>
            <CardDescription>
              {isEditMode 
                ? "Update existing content" 
                : "Create new content for your website"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPreviewMode ? (
              <div className="space-y-4">
                <div className="bg-white border rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-bold mb-2">{contentTitle || "Content Preview"}</h3>
                  <div className="text-sm text-muted-foreground mb-4">
                    {contentKey && <span className="font-mono bg-muted px-1 py-0.5 rounded">{contentKey}</span>}
                    {selectedPage && (
                      <span className="ml-2">
                        Page: <span className="font-medium">{selectedPage}</span>
                      </span>
                    )}
                    {selectedSection && (
                      <span className="ml-2">
                        Section: <span className="font-medium">{selectedSection}</span>
                      </span>
                    )}
                  </div>
                  
                  {contentType === 'html' && (
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: editorContent }}
                    />
                  )}
                  
                  {contentType === 'text' && (
                    <div className="whitespace-pre-wrap">{editorContent}</div>
                  )}
                  
                  {contentType === 'image' && selectedImage && (
                    <div className="mt-4">
                      <img 
                        src={URL.createObjectURL(selectedImage)} 
                        alt={contentTitle} 
                        className="max-w-full h-auto rounded-md"
                      />
                    </div>
                  )}
                  
                  {contentType === 'image' && !selectedImage && selectedContent?.imageUrl && (
                    <div className="mt-4">
                      <img 
                        src={selectedContent.imageUrl} 
                        alt={contentTitle} 
                        className="max-w-full h-auto rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content Info</TabsTrigger>
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="placement">Placement</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="contentTitle">Content Title</Label>
                      <Input
                        id="contentTitle"
                        placeholder="Enter a descriptive title"
                        value={contentTitle}
                        onChange={(e) => setContentTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contentKey">Content Key</Label>
                      <Input
                        id="contentKey"
                        placeholder="e.g., home_hero_heading"
                        value={contentKey}
                        onChange={(e) => setContentKey(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        A unique key used to reference this content in the application
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="typeHtml" 
                            checked={contentType === 'html'}
                            onChange={() => setContentType('html')} 
                          />
                          <Label htmlFor="typeHtml">Rich HTML Content</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="typeText" 
                            checked={contentType === 'text'}
                            onChange={() => setContentType('text')} 
                          />
                          <Label htmlFor="typeText">Plain Text</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="typeImage" 
                            checked={contentType === 'image'}
                            onChange={() => setContentType('image')} 
                          />
                          <Label htmlFor="typeImage">Image</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="editor" className="space-y-4 pt-4">
                    {(contentType === 'html' || contentType === 'text') && (
                      <div className="space-y-4">
                        {contentType === 'html' ? (
                          <div>
                            <Label className="mb-2 block">HTML Content</Label>
                            <Editor
                              onInit={(evt: any, editor: any) => editorRef.current = editor}
                              initialValue={editorContent || "<p>Start editing...</p>"}
                              value={editorContent}
                              onEditorChange={handleEditorChange}
                              init={{
                                height: 400,
                                menubar: true,
                                plugins: [
                                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                  'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                ],
                                toolbar: 'undo redo | formatselect | ' +
                                  'bold italic backcolor | alignleft aligncenter ' +
                                  'alignright alignjustify | bullist numlist outdent indent | ' +
                                  'removeformat | help',
                                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="textContent">Text Content</Label>
                            <Textarea
                              id="textContent"
                              placeholder="Enter your content..."
                              value={editorContent}
                              onChange={(e) => setEditorContent(e.target.value)}
                              rows={10}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {contentType === 'image' && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer"
                          onClick={handleUploadClick}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleImageChange}
                            accept="image/*"
                          />
                          
                          {selectedImage ? (
                            <div className="flex flex-col items-center">
                              <div className="w-32 h-32 mb-4 bg-muted rounded-md overflow-hidden">
                                <img
                                  src={URL.createObjectURL(selectedImage)}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="font-medium">{selectedImage.name}</p>
                              <Button variant="outline" size="sm" className="mt-4">
                                Change Image
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center">
                              {selectedContent?.imageUrl ? (
                                <div className="flex flex-col items-center">
                                  <div className="w-32 h-32 mb-4 bg-muted rounded-md overflow-hidden">
                                    <img
                                      src={selectedContent.imageUrl}
                                      alt="Current image"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <p className="text-sm text-muted-foreground">Current image</p>
                                  <Button variant="outline" size="sm" className="mt-4">
                                    Change Image
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                                  <h3 className="text-lg font-medium mb-1">Click to upload or drag and drop</h3>
                                  <p className="text-sm text-muted-foreground mb-4">
                                    PNG, JPG, GIF up to 10MB
                                  </p>
                                  <Button variant="secondary" size="sm">
                                    Select Image
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="placement" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="contentPlacementPage">Page *</Label>
                      <Select value={selectedPage} onValueChange={handlePageChange}>
                        <SelectTrigger id="contentPlacementPage">
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
                      <Label htmlFor="contentPlacementSection">Section</Label>
                      <Select 
                        value={selectedSection} 
                        onValueChange={setSelectedSection}
                        disabled={!selectedPage || availableSections.length === 0}
                      >
                        <SelectTrigger id="contentPlacementSection">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          {availableSections.map(section => (
                            <SelectItem key={section} value={section}>
                              {section.replace("-", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The section of the page where this content will be displayed
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSaveContent}
              disabled={saveContentMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveContentMutation.isPending ? "Saving..." : isEditMode ? "Update Content" : "Save Content"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminEditor;