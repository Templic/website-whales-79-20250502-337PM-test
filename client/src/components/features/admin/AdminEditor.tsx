/**
 * AdminEditor.tsx
 * 
 * Component Type: feature/admin
 * A component that provides text and image editing functionality for admin users.
 * This works in conjunction with the EditButton component.
 */

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "./Modal";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, PenLine, Save, X, Check, RotateCcw } from "lucide-react";

interface AdminEditorProps {
  contentId: string | number;
  contentType: "text" | "image" | "both";
  initialText?: string;
  initialImageSrc?: string;
  onClose: () => void;
  onSave: (data: {
    contentId: string | number;
    text?: string;
    image?: File;
    imageUrl?: string;
  }) => Promise<boolean>;
}

/**
 * AdminEditor component for editing text and image content
 */
export const AdminEditor: React.FC<AdminEditorProps> = ({
  contentId,
  contentType,
  initialText = "",
  initialImageSrc = "",
  onClose,
  onSave,
}) => {
  // State for text editing
  const [text, setText] = useState(initialText);
  const [originalText] = useState(initialText);
  
  // State for image editing
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(initialImageSrc);
  const [originalImageUrl] = useState(initialImageSrc);
  
  // State for loading and tabs
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    contentType === "text" ? "text" : 
    contentType === "image" ? "image" : "text"
  );

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Handles text change in the textarea
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  /**
   * Opens the file dialog when the upload button is clicked
   */
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  /**
   * Handles image file selection
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file is an image
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, GIF, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Set the file and create a preview URL
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  /**
   * Resets the image to its original state
   */
  const handleResetImage = () => {
    setImage(null);
    setImagePreviewUrl(originalImageUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  /**
   * Resets the text to its original state
   */
  const handleResetText = () => {
    setText(originalText);
  };
  
  /**
   * Handles save button click
   */
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Prepare data to send to the onSave callback
      const saveData: {
        contentId: string | number;
        text?: string;
        image?: File;
        imageUrl?: string;
      } = { contentId };
      
      // Only include text if it has changed and we're in text mode
      if (activeTab === "text" && text !== originalText) {
        saveData.text = text;
      }
      
      // Only include image if it has changed and we're in image mode
      if (activeTab === "image" && image) {
        saveData.image = image;
        saveData.imageUrl = imagePreviewUrl;
      }
      
      // Call the onSave callback
      const success = await onSave(saveData);
      
      if (success) {
        toast({
          title: "Content updated",
          description: "Your changes have been saved successfully",
          variant: "default",
        });
        
        // Close the editor after successful save
        onClose();
      } else {
        toast({
          title: "Error",
          description: "There was a problem saving your changes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Determines if content has changed and save button should be enabled
   */
  const hasChanges = (): boolean => {
    if (activeTab === "text") {
      return text !== originalText;
    } else if (activeTab === "image") {
      return !!image;
    }
    return false;
  };
  
  return (
    <Modal title={`Edit Content`} onClose={onClose}>
      <div className="p-4">
        {contentType === "both" ? (
          <Tabs
            defaultValue={activeTab}
            className="mb-4"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">
                <PenLine className="mr-2 h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image">
                <Image className="mr-2 h-4 w-4" />
                Image
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="mt-4">
              {renderTextEditor()}
            </TabsContent>
            
            <TabsContent value="image" className="mt-4">
              {renderImageEditor()}
            </TabsContent>
          </Tabs>
        ) : contentType === "text" ? (
          renderTextEditor()
        ) : (
          renderImageEditor()
        )}
        
        <div className="flex justify-end gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          
          <Button 
            variant="default" 
            onClick={handleSave} 
            disabled={!hasChanges() || isLoading}
            isLoading={isLoading}
          >
            {!isLoading && <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
  
  /**
   * Renders the text editing UI
   */
  function renderTextEditor() {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="content-text" className="text-sm font-medium">
            Edit Text Content
          </Label>
          <Textarea
            id="content-text"
            value={text}
            onChange={handleTextChange}
            placeholder="Enter new text content..."
            className="min-h-[150px] mt-1.5"
          />
        </div>
        
        {text !== originalText && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#00ebd6]">
              <Check className="inline-block mr-1 h-4 w-4" />
              Text content changed
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetText}
              className="text-xs"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  /**
   * Renders the image editing UI
   */
  function renderImageEditor() {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Current Image</Label>
          <div className="mt-1.5 border border-[#00ebd6]/20 rounded-md p-4 flex items-center justify-center bg-black/20">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Content Preview"
                className="max-h-[200px] max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-sm">No image available</div>
            )}
          </div>
        </div>
        
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            ref={fileInputRef}
            disabled={isLoading}
          />
          
          <Button
            variant="outline"
            onClick={handleUploadClick}
            disabled={isLoading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload New Image
          </Button>
        </div>
        
        {image && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#00ebd6]">
              <Check className="inline-block mr-1 h-4 w-4" />
              New image selected: {image.name}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetImage}
              className="text-xs"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </div>
        )}
      </div>
    );
  }
};

export default AdminEditor;