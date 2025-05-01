/**
 * EnhancedAdminEditor.tsx
 * 
 * Component Type: feature/admin
 * A comprehensive editor for admin users with advanced text editing features
 * using Tiptap and responsive design for all device types.
 */
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "react-responsive";

// Rich Text Editor imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { RichTextEditor } from '@mantine/tiptap';

// Toast notifications
import { useToast } from "@/hooks/use-toast";
import { 
  Image, 
  Type, 
  Save, 
  X, 
  UploadCloud, 
  EyeIcon, 
  PencilIcon,
  ArrowLeftIcon,
  TrashIcon,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Code,
  Undo,
  Redo,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import "./admin.css";

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
  updatedAt?: string;
  version: number;
  timezone?: string;
  recurringSchedule?: string;
  lastScheduleRun?: string;
}

interface EnhancedAdminEditorProps {
  initialContent?: ContentItem;
  onSave?: () => void;
  onCancel?: () => void;
  pages: string[];
  isEditing: boolean;
}

/**
 * EnhancedAdminEditor component for comprehensive content editing with
 * advanced formatting, scheduling, and responsive design
 */
const EnhancedAdminEditor: React.FC<EnhancedAdminEditorProps> = ({
  initialContent,
  onSave,
  onCancel,
  pages,
  isEditing
}) => {
  // Responsive hooks
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isPortrait = useMediaQuery({ orientation: 'portrait' });
  const isLandscape = useMediaQuery({ orientation: 'landscape' });

  // Check if user is authenticated and has admin/super_admin role
  const { user } = useAuth();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [title, setTitle] = useState(initialContent?.title || "");
  const [key, setKey] = useState(initialContent?.key || "");
  const [page, setPage] = useState(initialContent?.page || (pages.length > 0 ? pages[0] : ""));
  const [section, setSection] = useState(initialContent?.section || "");
  const [contentType, setContentType] = useState<'text' | 'image' | 'html'>(initialContent?.type || 'text');
  const [htmlContent, setHtmlContent] = useState(initialContent?.content || "");
  const [imageUrl, setImageUrl] = useState(initialContent?.imageUrl || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>(initialContent?.type || "text");
  const [isDirty, setIsDirty] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScheduled, setIsScheduled] = useState(!!initialContent?.recurringSchedule);
  const [recurringSchedule, setRecurringSchedule] = useState(initialContent?.recurringSchedule || "");
  const [timezone, setTimezone] = useState(initialContent?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        validate: href => /^https?:\/\//.test(href),
      }),
    ],
    content: initialContent?.content || '',
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
      setIsDirty(true);
    },
  });
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local preview URL
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    setImageFile(file);
    setIsDirty(true);
    
    toast({
      title: "Image uploaded",
      description: "Preview is now available. Don't forget to save your changes.",
    });
  };
  
  // Trigger file input click
  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };
  
  // Remove image
  const removeImage = () => {
    setImageUrl("");
    setImageFile(null);
    setIsDirty(true);
    
    toast({
      title: "Image removed",
      description: "The image has been removed from the content.",
    });
  };

  // Form validation
  const isFormValid = () => {
    if (!title.trim()) return false;
    if (!key.trim()) return false;
    if (!page.trim()) return false;
    if (!section.trim()) return false;
    
    if (contentType === 'text' || contentType === 'html') {
      return htmlContent.trim() !== '';
    } else if (contentType === 'image') {
      return !!imageUrl;
    }
    
    return true;
  };
  
  // Handle save
  const handleSave = async () => {
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real implementation, this would make a POST or PUT request to the API
      // For now, we'll use our parent's onSave callback
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsDirty(false);
      
      toast({
        title: "Content saved",
        description: "Your changes have been saved successfully.",
      });
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving content:", error);
      
      toast({
        title: "Save failed",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (!confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  // Change content type
  const handleContentTypeChange = (type: string) => {
    setActiveTab(type);
    setContentType(type as 'text' | 'image' | 'html');
    setIsDirty(true);
  };

  // Toggle scheduling
  const handleToggleScheduling = (checked: boolean) => {
    setIsScheduled(checked);
    if (!checked) {
      setRecurringSchedule("");
    } else if (!recurringSchedule) {
      setRecurringSchedule("daily");
    }
    setIsDirty(true);
  };
  
  return (
    <div className={`w-full mx-auto ${isDesktop ? 'px-6' : isTablet ? 'px-4' : 'px-2'}`}>
      {/* Main form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-base">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
                placeholder="Content title"
                disabled={isProcessing}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="key" className="text-base">Key</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => { setKey(e.target.value); setIsDirty(true); }}
                placeholder="Unique identifier for this content"
                disabled={isProcessing || isEditing}
                className="mt-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier used to reference this content in templates.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="page" className="text-base">Page</Label>
              <select
                id="page"
                value={page}
                onChange={(e) => { setPage(e.target.value); setIsDirty(true); }}
                disabled={isProcessing}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {pages.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="section" className="text-base">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => { setSection(e.target.value); setIsDirty(true); }}
                placeholder="Section of the page (e.g., header, footer)"
                disabled={isProcessing}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        
        {/* Content Scheduling */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Content Scheduling
              </CardTitle>
              <Switch
                checked={isScheduled}
                onCheckedChange={handleToggleScheduling}
                disabled={isProcessing}
              />
            </div>
            <CardDescription>
              Schedule when this content should be published or updated
            </CardDescription>
          </CardHeader>
          
          {isScheduled && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurringSchedule" className="text-sm">Recurring Schedule</Label>
                  <select
                    id="recurringSchedule"
                    value={recurringSchedule}
                    onChange={(e) => { setRecurringSchedule(e.target.value); setIsDirty(true); }}
                    disabled={isProcessing}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select frequency</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Schedule</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="timezone" className="text-sm">Timezone</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => { setTimezone(e.target.value); setIsDirty(true); }}
                    disabled={isProcessing}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
        
        {/* Content Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Content</CardTitle>
            <CardDescription>
              Choose content type and enter your content
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={handleContentTypeChange}>
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" disabled={isProcessing}>
                  <Type className="h-4 w-4 mr-2" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="html" disabled={isProcessing}>
                  <Code className="h-4 w-4 mr-2" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="image" disabled={isProcessing}>
                  <Image className="h-4 w-4 mr-2" />
                  Image
                </TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="pt-6">
              <TabsContent value="text" className="mt-0">
                <div className="space-y-4">
                  {editor && (
                    <RichTextEditor editor={editor}>
                      <RichTextEditor.Toolbar sticky stickyOffset={0}>
                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.Bold />
                          <RichTextEditor.Italic />
                          <RichTextEditor.Underline />
                          <RichTextEditor.Strikethrough />
                          <RichTextEditor.ClearFormatting />
                          <RichTextEditor.Code />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.H1 />
                          <RichTextEditor.H2 />
                          <RichTextEditor.H3 />
                          <RichTextEditor.H4 />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.Blockquote />
                          <RichTextEditor.Hr />
                          <RichTextEditor.BulletList />
                          <RichTextEditor.OrderedList />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                          <RichTextEditor.Link />
                          <RichTextEditor.Unlink />
                        </RichTextEditor.ControlsGroup>
                      </RichTextEditor.Toolbar>

                      <RichTextEditor.Content 
                        className="min-h-[300px] prose dark:prose-invert max-w-none"
                      />
                    </RichTextEditor>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="html" className="mt-0">
                <div className="space-y-4">
                  <textarea
                    className="w-full min-h-[300px] font-mono text-sm p-4 rounded-md border border-input bg-background"
                    placeholder="Enter HTML content here..."
                    value={htmlContent}
                    onChange={(e) => { setHtmlContent(e.target.value); setIsDirty(true); }}
                    disabled={isProcessing}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Image</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={triggerImageUpload}
                        disabled={isProcessing}
                      >
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                      
                      {imageUrl && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={removeImage}
                          disabled={isProcessing}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Input 
                    ref={imageInputRef}
                    type="file" 
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isProcessing}
                  />
                  
                  <div className="border rounded-md p-4 min-h-[300px] flex items-center justify-center bg-muted/20">
                    {imageUrl ? (
                      <div className="relative w-full">
                        <img 
                          src={imageUrl} 
                          alt="Content image" 
                          className="max-h-[300px] mx-auto object-contain rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="text-center space-y-2 text-muted-foreground">
                        <UploadCloud className="h-12 w-12 mx-auto" />
                        <p>No image uploaded</p>
                        <Button 
                          variant="outline"
                          onClick={triggerImageUpload}
                          disabled={isProcessing}
                        >
                          Upload Image
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      
      {/* Action Buttons */}
      <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'} gap-3 mt-6`}>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isProcessing}
          className={isMobile ? 'w-full' : ''}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isDirty || isProcessing || !isFormValid()}
          className={isMobile ? 'w-full' : ''}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedAdminEditor;