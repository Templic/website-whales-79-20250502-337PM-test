/**
 * AdminEditor.tsx
 * 
 * Component Type: feature/admin
 * A component for editing text and image content with preview functionality.
 */

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { getImagePreviewUrl, revokeImagePreviewUrl } from "@/lib/content-editor";

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
 * AdminEditor component
 */
const AdminEditor: React.FC<AdminEditorProps> = ({
  contentId,
  contentType,
  initialText = "",
  initialImageSrc = "",
  onClose,
  onSave,
}) => {
  // State for text editing
  const [text, setText] = useState<string>(initialText);
  const [textPreview, setTextPreview] = useState<string>(initialText);
  
  // State for image editing
  const [imageSrc, setImageSrc] = useState<string>(initialImageSrc);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  // State for tab selection
  const [activeTab, setActiveTab] = useState<string>(
    contentType === "text" ? "text" : contentType === "image" ? "image" : "text"
  );
  
  // State for loading
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokeImagePreviewUrl(previewUrl);
      }
    };
  }, [previewUrl]);
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Clean up previous preview URL
      if (previewUrl) {
        revokeImagePreviewUrl(previewUrl);
      }
      
      // Create a preview URL for the image
      const url = getImagePreviewUrl(file);
      setPreviewUrl(url);
      setImageFile(file);
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle preview button click
  const handlePreview = () => {
    setTextPreview(text);
  };
  
  // Handle save button click
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const data: {
        contentId: string | number;
        text?: string;
        image?: File;
        imageUrl?: string;
      } = { contentId };
      
      // Include text if it has changed and content type includes text
      if ((contentType === "text" || contentType === "both") && text !== initialText) {
        data.text = text;
      }
      
      // Include image if it has been selected and content type includes image
      if ((contentType === "image" || contentType === "both") && imageFile) {
        data.image = imageFile;
        data.imageUrl = previewUrl;
      }
      
      // Save changes
      const success = await onSave(data);
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving content:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // The modal title based on content type
  const getModalTitle = () => {
    switch (contentType) {
      case "text":
        return "Edit Text Content";
      case "image":
        return "Edit Image Content";
      case "both":
        return "Edit Content";
      default:
        return "Edit Content";
    }
  };
  
  return (
    <Modal title={getModalTitle()} onClose={onClose} size="lg">
      <div className="p-6">
        {contentType === "both" ? (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              {renderTextEditor()}
            </TabsContent>
            
            <TabsContent value="image" className="space-y-4">
              {renderImageEditor()}
            </TabsContent>
          </Tabs>
        ) : contentType === "text" ? (
          renderTextEditor()
        ) : (
          renderImageEditor()
        )}
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
  
  // Render text editor section
  function renderTextEditor() {
    return (
      <>
        <div className="space-y-4">
          <div>
            <Label htmlFor="content-text">Edit Text</Label>
            <Textarea
              id="content-text"
              value={text}
              onChange={handleTextChange}
              className="mt-1 min-h-[150px]"
              placeholder="Enter text content here..."
            />
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
          
          {textPreview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 border rounded bg-[#0a0a0a] whitespace-pre-wrap">
                {textPreview}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
  
  // Render image editor section
  function renderImageEditor() {
    return (
      <>
        <div className="space-y-4">
          <div>
            <Label>Current Image</Label>
            <div className="mt-1 p-4 border rounded bg-[#0a0a0a] flex items-center justify-center">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Current"
                  className="max-h-[200px] max-w-full object-contain"
                />
              ) : (
                <div className="text-center p-8 text-gray-400">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                  <p>No image currently set</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select New Image
            </Button>
          </div>
          
          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="mt-1 p-4 border rounded bg-[#0a0a0a] flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-[200px] max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
};

export default AdminEditor;