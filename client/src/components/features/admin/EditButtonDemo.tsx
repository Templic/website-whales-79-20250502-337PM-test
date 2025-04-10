/**
 * EditButtonDemo.tsx
 * 
 * Component Type: feature/admin
 * A demonstration component to showcase the different EditButton variations and styles.
 */

import React from "react";
import { EditButton } from "./EditButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminEditorDemo from "./AdminEditorDemo";
import "./admin.css";

/**
 * EditButtonDemo component showcasing various EditButton positions and styles
 */
const EditButtonDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Usage Examples</CardTitle>
          <CardDescription>
            Different ways to use the EditButton component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Variants */}
          <div>
            <h3 className="text-lg font-medium mb-3">Button Variants</h3>
            <div className="flex flex-wrap gap-3 p-4 border rounded bg-[#0a0a0a]">
              <EditButton
                contentId="example-1"
                variant="default"
                text="Default"
                iconOnly={false}
              />
              <EditButton
                contentId="example-2"
                variant="outline"
                text="Outline"
                iconOnly={false}
              />
              <EditButton
                contentId="example-3"
                variant="ghost"
                text="Ghost"
                iconOnly={false}
              />
              <EditButton
                contentId="example-4"
                variant="link"
                text="Link"
                iconOnly={false}
              />
              <EditButton
                contentId="example-5"
                variant="destructive"
                text="Destructive"
                iconOnly={false}
              />
              <EditButton
                contentId="example-6"
                variant="cosmic"
                text="Cosmic"
                iconOnly={false}
              />
            </div>
          </div>
          
          {/* Section 2: Sizes */}
          <div>
            <h3 className="text-lg font-medium mb-3">Button Sizes</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 border rounded bg-[#0a0a0a]">
              <EditButton
                contentId="example-7"
                size="sm"
                text="Small"
                iconOnly={false}
              />
              <EditButton
                contentId="example-8"
                size="default"
                text="Default"
                iconOnly={false}
              />
              <EditButton
                contentId="example-9"
                size="lg"
                text="Large"
                iconOnly={false}
              />
              <EditButton
                contentId="example-10"
                size="icon"
                variant="outline"
              />
            </div>
          </div>
          
          {/* Section 3: Icon Only vs Text */}
          <div>
            <h3 className="text-lg font-medium mb-3">Icon vs Text</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 border rounded bg-[#0a0a0a]">
              <EditButton
                contentId="example-11"
                iconOnly={true}
                variant="default"
              />
              <EditButton
                contentId="example-12"
                iconOnly={false}
                text="Edit Content"
                variant="default"
              />
              <EditButton
                contentId="example-13"
                iconOnly={true}
                variant="outline"
              />
              <EditButton
                contentId="example-14"
                iconOnly={false}
                text="Edit Content"
                variant="outline"
              />
            </div>
          </div>
          
          {/* Section 4: Positioning */}
          <div>
            <h3 className="text-lg font-medium mb-3">Positioning</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Top Right */}
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Top Right</h4>
                <div className="edit-button-container h-48 bg-[#0a0a0a] rounded">
                  <div className="edit-button-absolute edit-button-top-right">
                    <EditButton
                      contentId="example-position-1"
                      variant="cosmic"
                    />
                  </div>
                  <div className="p-4">Content with Top Right Positioned Edit Button</div>
                </div>
              </div>
              
              {/* Top Left */}
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Top Left</h4>
                <div className="edit-button-container h-48 bg-[#0a0a0a] rounded">
                  <div className="edit-button-absolute edit-button-top-left">
                    <EditButton
                      contentId="example-position-2"
                      variant="cosmic"
                    />
                  </div>
                  <div className="p-4">Content with Top Left Positioned Edit Button</div>
                </div>
              </div>
              
              {/* Bottom Right */}
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Bottom Right</h4>
                <div className="edit-button-container h-48 bg-[#0a0a0a] rounded">
                  <div className="edit-button-absolute edit-button-bottom-right">
                    <EditButton
                      contentId="example-position-3"
                      variant="cosmic"
                    />
                  </div>
                  <div className="p-4">Content with Bottom Right Positioned Edit Button</div>
                </div>
              </div>
              
              {/* Bottom Left */}
              <div className="p-4 border rounded">
                <h4 className="font-medium mb-2">Bottom Left</h4>
                <div className="edit-button-container h-48 bg-[#0a0a0a] rounded">
                  <div className="edit-button-absolute edit-button-bottom-left">
                    <EditButton
                      contentId="example-position-4"
                      variant="cosmic"
                    />
                  </div>
                  <div className="p-4">Content with Bottom Left Positioned Edit Button</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Section 5: Hover Reveal */}
          <div>
            <h3 className="text-lg font-medium mb-3">Hover Reveal</h3>
            <div className="p-4 border rounded">
              <div className="edit-button-container h-48 bg-[#0a0a0a] rounded">
                <div className="edit-button-absolute edit-button-top-right edit-button-hover-reveal">
                  <EditButton
                    contentId="example-hover"
                    variant="cosmic"
                  />
                </div>
                <div className="flex items-center justify-center h-full">
                  <p className="text-center">Hover over this container to reveal the edit button</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Section 6: Inline with Text */}
          <div>
            <h3 className="text-lg font-medium mb-3">Inline with Text</h3>
            <div className="p-4 border rounded bg-[#0a0a0a]">
              <p className="text-with-edit">
                This is a paragraph with an inline edit button
                <span className="edit-button-inline">
                  <EditButton
                    contentId="example-inline"
                    size="sm"
                  />
                </span>
              </p>
              <p className="mt-4 edit-button-row">
                <span>This text uses the row layout for alignment with edit button</span>
                <span className="edit-button-inline">
                  <EditButton
                    contentId="example-row"
                    size="sm"
                  />
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="text-2xl font-bold mt-8 mb-4">Working Demo with Editor</h2>
      <AdminEditorDemo />
    </div>
  );
};

export default EditButtonDemo;