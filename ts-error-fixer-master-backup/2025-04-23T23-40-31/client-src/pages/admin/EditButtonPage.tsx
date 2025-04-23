/**
 * EditButtonPage.tsx
 * 
 * Page to showcase the EditButton component and its various applications.
 * This is a demo page for development purposes.
 */

import React from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

// Import components from index file
import { 
  EditButtonDemo, 
  AdminEditorDemo, 
  EditMenuDemo 
} from "@/components/features/admin";

const EditButtonPage: React.FC = () => {
  const { setRole, user } = useAuth();
  
  return (
    <div className="container py-8">
      <Helmet>
        <title>Admin - Content Editor Components | Dale Loves Whales</title>
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Content Editor</h1>
        <p className="text-gray-400">
          This page demonstrates the content editor components and functionality for administrators.
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Role Switcher (For Demo Purposes)</CardTitle>
          <CardDescription>
            Switch between user roles to see how the components behave with different permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <p>Current role: <span className="font-bold">{user?.role || 'Not logged in'}</span></p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={user?.role === 'user' ? 'default' : 'outline'}
                onClick={() => setRole('user')}
              >
                User
              </Button>
              <Button
                size="sm"
                variant={user?.role === 'admin' ? 'default' : 'outline'}
                onClick={() => setRole('admin')}
              >
                Admin
              </Button>
              <Button
                size="sm"
                variant={user?.role === 'super_admin' ? 'default' : 'outline'}
                onClick={() => setRole('super_admin')}
              >
                Super Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-8">
        <Tabs defaultValue="edit-button">
          <TabsList className="mb-4">
            <TabsTrigger value="edit-button">Edit Button</TabsTrigger>
            <TabsTrigger value="admin-editor">Content Editor</TabsTrigger>
            <TabsTrigger value="format-menu">Format Menu</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit-button">
            <section>
              <h2 className="text-2xl font-bold mb-4">Edit Button Components</h2>
              <p className="mb-4 text-gray-400">
                The EditButton components below demonstrate various ways to integrate content editing functionality
                throughout your application. These buttons are only visible to users with 'admin' or 'super_admin' roles.
              </p>
              
              <EditButtonDemo />
            </section>
          </TabsContent>
          
          <TabsContent value="admin-editor">
            <section>
              <h2 className="text-2xl font-bold mb-4">Content Editor Demo</h2>
              <p className="mb-4 text-gray-400">
                The AdminEditor component provides a modal interface for editing text and image content.
                Click the edit buttons to open the editor and try making changes.
              </p>
              
              <AdminEditorDemo />
            </section>
          </TabsContent>
          
          <TabsContent value="format-menu">
            <section>
              <h2 className="text-2xl font-bold mb-4">Text Formatting Menu</h2>
              <p className="mb-4 text-gray-400">
                The EditMenu component provides text formatting capabilities to the editor.
                This floating menu appears near the EditButton and offers various formatting options.
              </p>
              
              <EditMenuDemo />
            </section>
          </TabsContent>
        </Tabs>
        
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Implementation Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert">
              <h3>How to Use EditButton</h3>
              <p>
                Import the EditButton component and use it near content that should be editable by admins:
              </p>
              <pre>{`import { EditButton } from "@/components/features/admin";

// Basic edit button
<EditButton contentId="my-content-1" onEdit={handleEdit} />

// With formatting menu
<EditButton 
  contentId="my-content-2"
  showFormatMenu={true}
  menuPosition="top"
  onFormatApply={handleFormatApply}
/>

// Positioned absolute inside container
<div className="edit-button-container">
  <div className="edit-button-absolute edit-button-top-right">
    <EditButton contentId="my-content-3" onEdit={handleEdit} />
  </div>
  <div>Your content here...</div>
</div>`}</pre>
              
              <h3>EditButton Props</h3>
              <ul>
                <li><strong>contentId</strong> - Required: unique ID for the content element</li>
                <li><strong>onEdit</strong> - Optional: function to call when Edit button is clicked</li>
                <li><strong>variant</strong> - Optional: button variant (default, outline, ghost, etc.)</li>
                <li><strong>size</strong> - Optional: button size (sm, md, lg, etc.)</li>
                <li><strong>text</strong> - Optional: button text (default: "Edit")</li>
                <li><strong>iconOnly</strong> - Optional: show icon only without text (default: true)</li>
                <li><strong>showFormatMenu</strong> - Optional: show formatting menu (default: false)</li>
                <li><strong>menuPosition</strong> - Optional: position of the formatting menu (top, bottom, left, right)</li>
                <li><strong>onFormatApply</strong> - Optional: function to call when a format is applied</li>
              </ul>
              
              <h3>Styling Options</h3>
              <p>Use these CSS classes for different positioning:</p>
              <ul>
                <li><code>edit-button-container</code> - Container with relative positioning</li>
                <li><code>edit-button-absolute</code> - For absolute positioning</li>
                <li><code>edit-button-top-right</code> - Position in top right</li>
                <li><code>edit-button-top-left</code> - Position in top left</li>
                <li><code>edit-button-bottom-right</code> - Position in bottom right</li>
                <li><code>edit-button-bottom-left</code> - Position in bottom left</li>
                <li><code>edit-button-hover-reveal</code> - Only show button on hover</li>
                <li><code>edit-button-inline</code> - Display inline with text</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default EditButtonPage;