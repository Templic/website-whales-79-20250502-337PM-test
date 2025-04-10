/**
 * AdminEditorDemo.tsx
 * 
 * Component Type: feature/admin
 * A demo component to showcase the AdminEditor functionality.
 */

import React, { useState } from "react";
import AdminEditor from "./AdminEditor";

// Define EditorSaveData directly in this component to avoid import issues
interface EditorSaveData {
  text?: string;
  html?: string;
  imageUrl?: string;
  imageFile?: File;
  meta?: Record<string, any>;
}
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Image, 
  FileText, 
  RotateCcw, 
  Settings
} from "lucide-react";

const placeholderText = `# Cosmic Consciousness

Welcome to the world of cosmic consciousness, where the boundaries of perception expand beyond the ordinary.

## Key Features

- Deep connection to universal energy
- Enhanced awareness of cosmic patterns
- Integration of mind, body, and spirit

> "The cosmos is within us. We are made of star-stuff." - Carl Sagan

Learn more about [cosmic consciousness](https://example.com/cosmic).
`;

const placeholderImage = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGNvc21pY3xlbnwwfHwwfHx8MA%3D%3D";

const AdminEditorDemo: React.FC = () => {
  const { toast } = useToast();
  const { user, setRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editorType, setEditorType] = useState("text-only");
  const [savedContent, setSavedContent] = useState<EditorSaveData>({
    text: placeholderText,
    html: `<h1>Cosmic Consciousness</h1>
<p>Welcome to the world of cosmic consciousness, where the boundaries of perception expand beyond the ordinary.</p>
<h2>Key Features</h2>
<ul>
  <li>Deep connection to universal energy</li>
  <li>Enhanced awareness of cosmic patterns</li>
  <li>Integration of mind, body, and spirit</li>
</ul>
<blockquote>
  <p>"The cosmos is within us. We are made of star-stuff." - Carl Sagan</p>
</blockquote>
<p>Learn more about <a href="https://example.com/cosmic">cosmic consciousness</a>.</p>`,
    imageUrl: editorType === "image-only" || editorType === "full" ? placeholderImage : "",
  });
  
  // Change user role for testing
  const handleRoleChange = (role: string) => {
    setRole(role as "user" | "admin" | "super_admin");
    
    toast({
      title: "Role changed",
      description: `User role changed to ${role}`,
      variant: "default",
    });
  };
  
  // Handle save
  const handleSave = async (contentId: string | number, data: EditorSaveData) => {
    // Simulate saving to server with a delay
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setSavedContent(data);
        setIsEditing(false);
        resolve();
      }, 1000);
    });
  };
  
  // Reset to defaults
  const handleReset = () => {
    setSavedContent({
      text: placeholderText,
      html: `<h1>Cosmic Consciousness</h1>
<p>Welcome to the world of cosmic consciousness, where the boundaries of perception expand beyond the ordinary.</p>
<h2>Key Features</h2>
<ul>
  <li>Deep connection to universal energy</li>
  <li>Enhanced awareness of cosmic patterns</li>
  <li>Integration of mind, body, and spirit</li>
</ul>
<blockquote>
  <p>"The cosmos is within us. We are made of star-stuff." - Carl Sagan</p>
</blockquote>
<p>Learn more about <a href="https://example.com/cosmic">cosmic consciousness</a>.</p>`,
      imageUrl: editorType === "image-only" || editorType === "full" ? placeholderImage : "",
    });
    
    toast({
      title: "Content reset",
      description: "The content has been reset to default values.",
      variant: "default",
    });
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Editor Demo</CardTitle>
          <CardDescription>
            Comprehensive content editor for administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Editor Configuration</h3>
                <Select 
                  value={editorType} 
                  onValueChange={setEditorType}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select editor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-only">Text Only</SelectItem>
                    <SelectItem value="image-only">Image Only</SelectItem>
                    <SelectItem value="full">Text & Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">User Role (for testing)</h3>
                <Select 
                  value={user?.role || "user"} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {!isEditing ? (
            <div className="border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Content Preview</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <FileText className="h-4 w-4" />
                    <span>Text Content</span>
                  </div>
                  <div 
                    className="border rounded-md p-4 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: savedContent.html || "" }}
                  />
                </div>
                
                {(editorType === "image-only" || editorType === "full") && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Image className="h-4 w-4" />
                      <span>Image Content</span>
                    </div>
                    <div className="border rounded-md p-4 flex items-center justify-center min-h-[200px]">
                      {savedContent.imageUrl ? (
                        <img 
                          src={savedContent.imageUrl} 
                          alt="Content" 
                          className="max-h-[200px] object-contain rounded-md"
                        />
                      ) : (
                        <p className="text-muted-foreground">No image available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <AdminEditor
              contentId="demo-content-1"
              initialContent={savedContent.text || ""}
              initialImage={savedContent.imageUrl || ""}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              allowImages={editorType === "image-only" || editorType === "full"}
              allowFormatting={editorType === "text-only" || editorType === "full"}
              title="Edit Demo Content"
              description="Make changes to the demo content below and save to see the result."
            />
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground border-t p-4">
          <p>
            The AdminEditor component provides a comprehensive editing experience with support for 
            both text content and images. It includes features like preview mode, image upload, and validation.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminEditorDemo;