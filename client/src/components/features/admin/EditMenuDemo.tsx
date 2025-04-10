/**
 * EditMenuDemo.tsx
 * 
 * Component Type: feature/admin
 * A demo component to showcase the EditMenu functionality.
 */

import React, { useState, useRef } from "react";
import { EditButton } from "./EditButton";
// Define FormatAction directly in this component to avoid import issues
interface FormatAction {
  type: string;
  value?: string | boolean | number;
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const EditMenuDemo: React.FC = () => {
  const { toast } = useToast();
  const { user, setRole } = useAuth();
  const [demoContent, setDemoContent] = useState<string>(
    "This is editable content. Use the formatting menu to apply different styles to this text."
  );
  const [position, setPosition] = useState<"top" | "bottom" | "left" | "right">("top");
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Apply format to the content
  const handleFormatApply = (format: FormatAction) => {
    console.log("Applying format:", format);
    
    let newContent = demoContent;
    
    // Apply formatting based on type
    switch (format.type) {
      case "bold":
        newContent = `<strong>${demoContent}</strong>`;
        break;
      case "italic":
        newContent = `<em>${demoContent}</em>`;
        break;
      case "underline":
        newContent = `<u>${demoContent}</u>`;
        break;
      case "align":
        newContent = `<div style="text-align: ${format.value};">${demoContent}</div>`;
        break;
      case "list":
        if (format.value === "unordered") {
          newContent = `<ul><li>${demoContent}</li></ul>`;
        } else if (format.value === "ordered") {
          newContent = `<ol><li>${demoContent}</li></ol>`;
        }
        break;
      case "heading":
        newContent = `<h${format.value}>${demoContent}</h${format.value}>`;
        break;
      case "link":
        newContent = `<a href="#" class="text-blue-500 underline">${demoContent}</a>`;
        break;
      case "fontSize":
        newContent = `<span class="text-${format.value}">${demoContent}</span>`;
        break;
      case "color":
        newContent = `<span class="text-${format.value}-500">${demoContent}</span>`;
        break;
      case "undo":
      case "redo":
        // In a real implementation, these would use a history stack
        toast({
          title: `${format.type.charAt(0).toUpperCase() + format.type.slice(1)} operation`,
          description: "This would undo/redo changes in a real implementation.",
          variant: "default",
        });
        break;
      default:
        break;
    }
    
    setDemoContent(newContent);
    
    toast({
      title: "Format applied",
      description: `Applied ${format.type} formatting to the content`,
      variant: "default",
    });
  };
  
  // Change user role for testing
  const handleRoleChange = (role: string) => {
    setRole(role as "user" | "admin" | "super_admin");
    
    toast({
      title: "Role changed",
      description: `User role changed to ${role}`,
      variant: "default",
    });
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Menu Demo</CardTitle>
          <CardDescription>
            This demonstrates the floating formatting menu for text editing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="space-y-2">
                <Label htmlFor="position">Menu Position</Label>
                <Select 
                  value={position} 
                  onValueChange={(value) => setPosition(value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">User Role (for testing)</Label>
                <Select 
                  value={user?.role || "user"} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="w-[180px]">
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
          
          <div className="relative border p-6 rounded-md">
            <div className="absolute top-3 right-3">
              <EditButton
                contentId="demo-edit-menu"
                showFormatMenu={true}
                menuPosition={position}
                onFormatApply={handleFormatApply}
              />
            </div>
            
            <div 
              ref={contentRef}
              className="prose dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: demoContent }}
            />
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Note: In a real implementation, content formatting would be applied to selected text only, 
          and would be persisted to a database.
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Advanced Formatting Options</CardTitle>
          <CardDescription>
            Additional edit menu configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium">Inline Formatting</h3>
                <EditButton
                  contentId="demo-inline"
                  showFormatMenu={true}
                  menuPosition="bottom"
                  onFormatApply={handleFormatApply}
                  text="Format"
                  iconOnly={false}
                  variant="outline"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This example shows the edit menu with a text label button.
              </p>
            </div>
            
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium">Side Formatting</h3>
                <EditButton
                  contentId="demo-side"
                  showFormatMenu={true}
                  menuPosition="left"
                  onFormatApply={handleFormatApply}
                  variant="cosmic"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This example shows the edit menu positioned to the side with a custom style.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditMenuDemo;