/**
 * EditButtonPage.tsx
 * 
 * Page component for showing the EditButton demo with documentation
 */

import React from "react";
import { EditButtonDemo } from "@/components/features/admin";
import { Modal } from "@/components/features/admin/Modal"; // Import the Modal component explicitly
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EditButtonPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Edit Button Component</h1>
      <p className="text-gray-400 mb-8">
        A reusable component for admin editing functionality with role-based access control
      </p>
      
      <Tabs defaultValue="demo" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="demo">Demo</TabsTrigger>
          <TabsTrigger value="usage">Usage Guide</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo">
          <EditButtonDemo />
        </TabsContent>
        
        <TabsContent value="usage">
          <div className="prose prose-invert max-w-4xl mx-auto">
            <h2>Usage Guide</h2>
            
            <h3>Basic Usage</h3>
            <p>
              The EditButton component will only render for users with the <code>admin</code> or{" "}
              <code>super_admin</code> role. It automatically checks the current user&apos;s role 
              using the <code>useAuth()</code> hook.
            </p>
            
            <pre className="bg-black/50 p-4 rounded-md overflow-x-auto">
              {`import { EditButton } from "@/components/features/admin";

// Basic usage with minimum props
<EditButton contentId="unique-id-123" />

// With custom edit handler
<EditButton 
  contentId="unique-id-123" 
  onEdit={(id) => handleEdit(id)} 
/>`}
            </pre>
            
            <h3>Positioning</h3>
            <p>
              The component comes with several pre-defined CSS classes for positioning. Import 
              the admin.css file to use these classes:
            </p>
            
            <pre className="bg-black/50 p-4 rounded-md overflow-x-auto">
              {`import "@/components/features/admin/admin.css";

// Absolute positioning in top-right corner
<div className="edit-button-container">
  <div className="edit-button-absolute edit-button-top-right">
    <EditButton contentId="unique-id" />
  </div>
  
  {/* Your content here */}
</div>

// Inline with text
<p className="text-with-edit">
  Your content here
  <span className="edit-button-inline">
    <EditButton contentId="text-content-id" size="sm" />
  </span>
</p>`}
            </pre>
            
            <h3>Advanced Usage</h3>
            <p>
              The EditButton can be customized with different variants, sizes, and can show text along with the icon:
            </p>
            
            <pre className="bg-black/50 p-4 rounded-md overflow-x-auto">
              {`// Custom styling and text
<EditButton 
  contentId="section-123" 
  variant="cosmic" 
  size="lg" 
  text="Edit Section" 
  iconOnly={false}
  onEdit={handleSectionEdit}
/>`}
            </pre>
          </div>
        </TabsContent>
        
        <TabsContent value="api">
          <div className="prose prose-invert max-w-4xl mx-auto">
            <h2>API Reference</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#030110]">
                    <th className="border border-[#00ebd6]/20 p-2 text-left">Prop</th>
                    <th className="border border-[#00ebd6]/20 p-2 text-left">Type</th>
                    <th className="border border-[#00ebd6]/20 p-2 text-left">Default</th>
                    <th className="border border-[#00ebd6]/20 p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>contentId</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>string | number</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">-</td>
                    <td className="border border-[#00ebd6]/20 p-2">Unique identifier for the content to be edited</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>onEdit</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>(contentId: string | number) =&gt; void</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>undefined</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Callback function when edit button is clicked</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>className</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>string</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>""</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Additional CSS classes to apply</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>variant</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>string</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>"ghost"</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Button variant (ghost, cosmic, nebula, etc.)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>size</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>string</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>"sm"</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Button size (sm, default, lg, xl, icon)</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>text</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>string</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>"Edit"</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Text to display when iconOnly is false</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>iconOnly</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>boolean</code></td>
                    <td className="border border-[#00ebd6]/20 p-2"><code>true</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Whether to show only the icon (no text)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <h3 className="mt-8">CSS Classes</h3>
            <p>
              The following CSS classes are available for positioning edit buttons:
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#030110]">
                    <th className="border border-[#00ebd6]/20 p-2 text-left">Class Name</th>
                    <th className="border border-[#00ebd6]/20 p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-container</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Base container class for positioning edit buttons</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-absolute</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">For absolute positioning of edit buttons</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-top-right</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Positions edit button in the top-right corner</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-top-left</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Positions edit button in the top-left corner</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-bottom-right</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Positions edit button in the bottom-right corner</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-bottom-left</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Positions edit button in the bottom-left corner</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-inline</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">For inline positioning next to text</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-hover-reveal</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Makes button visible only on hover</td>
                  </tr>
                  <tr>
                    <td className="border border-[#00ebd6]/20 p-2"><code>edit-button-row</code></td>
                    <td className="border border-[#00ebd6]/20 p-2">Creates a flex row for content with edit button</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditButtonPage;