/**
 * AdminEditorDemo.tsx
 * 
 * Component Type: feature/admin
 * A demonstration component to showcase the AdminEditor functionality.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import AdminEditor from "./AdminEditor";
import { updateContent } from "@/lib/content-editor";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditButton } from "./EditButton";

const AdminEditorDemo: React.FC = () => {
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [demoTextContent, setDemoTextContent] = useState<string>(
    "This is demo text content that can be edited. Click the edit button to make changes."
  );
  const [demoImageSrc, setDemoImageSrc] = useState<string>(
    "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=500&auto=format&fit=crop&q=60"
  );
  const [combinedText, setCombinedText] = useState<string>(
    "This is a combined text and image editor demo. You can edit both text and image."
  );
  const [combinedImage, setCombinedImage] = useState<string>(
    "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=500&auto=format&fit=crop&q=60"
  );
  
  const { toast } = useToast();
  
  const handleSaveContent = async (data: {
    contentId: string | number;
    text?: string;
    image?: File;
    imageUrl?: string;
  }) => {
    try {
      // Simulate API call
      // In a real application, this would call the updateContent function
      console.log("Saving content:", data);
      
      // In demo mode, we'll bypass the actual API call and update the state directly
      if (data.contentId === "demo-text") {
        if (data.text) {
          setDemoTextContent(data.text);
        }
      } else if (data.contentId === "demo-image") {
        if (data.imageUrl) {
          setDemoImageSrc(data.imageUrl);
        }
      } else if (data.contentId === "demo-combined") {
        if (data.text) {
          setCombinedText(data.text);
        }
        if (data.imageUrl) {
          setCombinedImage(data.imageUrl);
        }
      }
      
      // Close the editor
      setActiveEditor(null);
      
      // Show success toast
      toast({
        title: "Content updated",
        description: "Demo content has been updated successfully",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Error saving content:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
      
      return false;
    }
  };
  
  // Function to handle edit button clicks
  const handleEdit = (contentId: string | number) => {
    setActiveEditor(contentId.toString());
  };
  
  // Function to close the editor
  const handleCloseEditor = () => {
    setActiveEditor(null);
  };
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="text">
        <TabsList>
          <TabsTrigger value="text">Text Editor</TabsTrigger>
          <TabsTrigger value="image">Image Editor</TabsTrigger>
          <TabsTrigger value="combined">Combined Editor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Text Content Editor</span>
                <EditButton
                  contentId="demo-text"
                  onEdit={handleEdit}
                  text="Edit Text"
                  iconOnly={false}
                  variant="default"
                />
              </CardTitle>
              <CardDescription>
                This demonstrates editing text content only
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[100px] p-4 border rounded-md bg-[#0a0a0a]">
              <p className="whitespace-pre-wrap">{demoTextContent}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="image" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Image Content Editor</span>
                <EditButton
                  contentId="demo-image"
                  onEdit={handleEdit}
                  text="Edit Image"
                  iconOnly={false}
                  variant="default"
                />
              </CardTitle>
              <CardDescription>
                This demonstrates editing image content only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="edit-button-container">
                <div className="edit-button-absolute edit-button-top-right">
                  <EditButton
                    contentId="demo-image-positioned"
                    onEdit={() => handleEdit("demo-image")}
                    variant="cosmic"
                  />
                </div>
                <div className="relative rounded-md overflow-hidden h-[300px] w-full">
                  <img
                    src={demoImageSrc}
                    alt="Demo"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="combined" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Combined Text & Image Editor</span>
                <EditButton
                  contentId="demo-combined"
                  onEdit={handleEdit}
                  text="Edit Content"
                  iconOnly={false}
                  variant="default"
                />
              </CardTitle>
              <CardDescription>
                This demonstrates editing both text and image content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="edit-button-container">
                  <div className="edit-button-absolute edit-button-top-right edit-button-hover-reveal">
                    <EditButton
                      contentId="demo-combined-positioned"
                      onEdit={() => handleEdit("demo-combined")}
                      variant="cosmic"
                    />
                  </div>
                  <div className="relative rounded-md overflow-hidden h-[250px] w-full">
                    <img
                      src={combinedImage}
                      alt="Demo Combined"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <div className="min-h-[100px] p-4 border rounded-md bg-[#0a0a0a]">
                  <div className="edit-button-row">
                    <p className="whitespace-pre-wrap">{combinedText}</p>
                    <div className="edit-button-inline ml-2">
                      <EditButton
                        contentId="demo-combined-inline"
                        onEdit={() => handleEdit("demo-combined")}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Text Editor Modal */}
      {activeEditor === "demo-text" && (
        <AdminEditor
          contentId="demo-text"
          contentType="text"
          initialText={demoTextContent}
          onClose={handleCloseEditor}
          onSave={handleSaveContent}
        />
      )}
      
      {/* Image Editor Modal */}
      {activeEditor === "demo-image" && (
        <AdminEditor
          contentId="demo-image"
          contentType="image"
          initialImageSrc={demoImageSrc}
          onClose={handleCloseEditor}
          onSave={handleSaveContent}
        />
      )}
      
      {/* Combined Editor Modal */}
      {activeEditor === "demo-combined" && (
        <AdminEditor
          contentId="demo-combined"
          contentType="both"
          initialText={combinedText}
          initialImageSrc={combinedImage}
          onClose={handleCloseEditor}
          onSave={handleSaveContent}
        />
      )}
    </div>
  );
};

export default AdminEditorDemo;