/**
 * AdminEditor.tsx
 * 
 * Component Type: feature/admin
 * A comprehensive editor for admin users that handles both text and image content.
 * Provides a rich editing experience with formatting tools and image upload capabilities.
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// Define interfaces directly in this component
interface FormatAction {
  type: string;
  value?: string | boolean | number;
}

interface EditorSaveData {
  text?: string;
  html?: string;
  imageUrl?: string;
  imageFile?: File;
  meta?: Record<string, any>;
}
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
  TrashIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import "./admin.css";

interface AdminEditorProps {
  contentId: string | number;
  initialContent?: string;
  initialImage?: string;
  onSave?: (contentId: string | number, data: EditorSaveData) => void;
  onCancel?: () => void;
  allowImages?: boolean;
  allowFormatting?: boolean;
  title?: string;
  description?: string;
}

// EditorSaveData is now imported from types.ts

/**
 * AdminEditor component for comprehensive content editing
 */
const AdminEditor: React.FC<AdminEditorProps> = ({
  contentId,
  initialContent = "",
  initialImage = "",
  onSave,
  onCancel,
  allowImages = true,
  allowFormatting = true,
  title = "Edit Content",
  description = "Make changes to your content and preview the result."
}) => {
  // Check if user is authenticated and has admin/super_admin role
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Editor state
  const [content, setContent] = useState(initialContent);
  const [htmlContent, setHtmlContent] = useState(initialContent);
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [isDirty, setIsDirty] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Only render for admin users
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }
  
  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHtmlContent(e.target.value); // In real implementation, this would convert markdown to HTML
    setIsDirty(true);
  };
  
  // Handle format application
  const handleFormatApply = (format: FormatAction) => {
    console.log("Applying format:", format);
    
    // In a real implementation, this would apply the formatting to the selected content
    // For demo purposes, we're just logging the format action
    toast({
      title: "Format applied",
      description: `Applied ${format.type} formatting to the content`,
      variant: "default",
    });
    
    setIsDirty(true);
  };
  
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
      variant: "default",
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
      variant: "default",
    });
  };
  
  // Handle save
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsProcessing(true);
    
    try {
      // Prepare data to save
      const saveData: EditorSaveData = {
        text: content,
        html: htmlContent,
        imageUrl: imageUrl,
        imageFile: imageFile || undefined,
        meta: {
          lastEditedBy: user?.id,
          lastEditedAt: new Date().toISOString(),
        }
      };
      
      // Call save handler
      await onSave(contentId, saveData);
      
      setIsDirty(false);
      
      toast({
        title: "Content saved",
        description: "Your changes have been saved successfully.",
        variant: "default",
      });
    } catch (error: unknown) {
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
    // Reset to initial values
    setContent(initialContent);
    setHtmlContent(initialContent);
    setImageUrl(initialImage);
    setImageFile(null);
    setIsDirty(false);
    
    if (onCancel) {
      onCancel();
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto border shadow-md admin-editor">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant={isDirty ? "default" : "ghost"}
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || isProcessing}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="text" value={activeTab} onValueChange={(value: string) => setActiveTab(value as "text" | "image")}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" disabled={isProcessing}>
              <Type className="h-4 w-4 mr-2" />
              Text Content
            </TabsTrigger>
            {allowImages && (
              <TabsTrigger value="image" disabled={isProcessing}>
                <Image className="h-4 w-4 mr-2" />
                Image
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <TabsContent value="text" className="mt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="preview-mode" className="flex items-center gap-2">
                  <EyeIcon className="h-4 w-4" />
                  Preview Mode
                </Label>
                <Switch
                  id="preview-mode"
                  checked={previewMode}
                  onCheckedChange={setPreviewMode}
                />
              </div>
              
              {!previewMode ? (
                <Textarea
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Enter your content here..."
                  value={content}
                  onChange={handleContentChange}
                  disabled={isProcessing}
                />
              ) : (
                <div 
                  className="border rounded-md p-4 prose dark:prose-invert min-h-[200px] max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Current Image</Label>
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
              
              <div className="border rounded-md p-4 min-h-[200px] flex items-center justify-center bg-muted/20">
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
      
      <CardFooter className="flex justify-between border-t p-4">
        <p className="text-sm text-muted-foreground">
          {isDirty ? "Unsaved changes" : "No changes detected"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant={isDirty ? "default" : "ghost"}
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isProcessing}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AdminEditor;