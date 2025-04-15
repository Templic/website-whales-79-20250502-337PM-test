/**
 * EditButtonDemo.tsx
 * 
 * Component for demonstrating the EditButton functionality
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditButtonProps {
  contentId: string | number;
  onEdit?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'icon';
  label?: string;
  disabled?: boolean;
}

// EditButton Component
const EditButton: React.FC<EditButtonProps> = ({
  contentId,
  onEdit,
  size = 'md',
  variant = 'default',
  label = 'Edit',
  disabled = false
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-10'
  };
  
  // Handle edit button click
  const handleClick = () => {
    if (onEdit) {
      onEdit();
    }
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={`rounded-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
        aria-label={label}
        data-content-id={contentId}
      >
        <Edit className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />
      </Button>
    );
  }

  // Subtle variant (text + icon)
  if (variant === 'subtle') {
    return (
      <Button
        variant="ghost"
        onClick={handleClick}
        className={`p-1 h-auto flex items-center text-muted-foreground hover:text-foreground ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
        data-content-id={contentId}
      >
        <Edit className="mr-1 h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </Button>
    );
  }

  // Default variant (standard button)
  return (
    <Button
      variant="outline"
      size={size === 'lg' ? 'default' : 'sm'}
      onClick={handleClick}
      className={sizeClasses[size]}
      disabled={disabled}
      data-content-id={contentId}
    >
      <Edit className={`mr-1.5 ${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
      {label}
    </Button>
  );
};

// Demo component for EditButton
const EditButtonDemo: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('examples');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Handle edit action
  const handleEdit = (id: string) => {
    setIsEditing(id);
    toast({
      title: 'Edit Mode',
      description: `Editing content with ID: ${id}`,
    });
  };
  
  // Handle save action
  const handleSave = (id: string) => {
    setIsEditing(null);
    toast({
      title: 'Changes Saved',
      description: `Content with ID: ${id} has been updated`,
    });
  };
  
  // Handle cancel action
  const handleCancel = () => {
    setIsEditing(null);
    toast({
      title: 'Edit Cancelled',
      description: 'No changes were saved',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Button Demo</CardTitle>
          <CardDescription>
            A demonstration of the EditButton component which provides a consistent interface for editing content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="examples" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Button Variants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium">Default</p>
                      <EditButton
                        contentId="example-default"
                        onEdit={() => handleEdit('example-default')}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium">Subtle</p>
                      <EditButton
                        contentId="example-subtle"
                        variant="subtle"
                        onEdit={() => handleEdit('example-subtle')}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-medium">Icon Only</p>
                      <EditButton
                        contentId="example-icon"
                        variant="icon"
                        onEdit={() => handleEdit('example-icon')}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-md font-medium mb-3">Button Sizes</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium">Small</p>
                        <EditButton
                          contentId="example-small"
                          size="sm"
                          onEdit={() => handleEdit('example-small')}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium">Medium (Default)</p>
                        <EditButton
                          contentId="example-medium"
                          size="md"
                          onEdit={() => handleEdit('example-medium')}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium">Large</p>
                        <EditButton
                          contentId="example-large"
                          size="lg"
                          onEdit={() => handleEdit('example-large')}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inline Usage Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 prose max-w-none">
                    <p className="flex items-center justify-between">
                      <span>This text uses a right-aligned edit button</span>
                      <EditButton
                        contentId="example-right"
                        size="sm"
                      />
                    </p>
                    <p className="edit-button-row">
                      <span>This text uses the row layout for alignment with edit button</span>
                      <span className="edit-button-inline">
                        <EditButton
                          contentId="example-row"
                          size="sm"
                        />
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Interactive Example</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-4">
                    {isEditing === 'demo-content' ? (
                      <div className="space-y-4">
                        <textarea
                          className="w-full p-3 border rounded-md"
                          rows={4}
                          defaultValue="This is a sample editable content area. Click the edit button to enter edit mode."
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancel}
                          >
                            <X className="mr-1.5 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleSave('demo-content')}
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="prose">
                          <p className="text-base">
                            This is a sample editable content area. Click the edit button to enter edit mode.
                          </p>
                        </div>
                        <EditButton
                          contentId="demo-content"
                          variant="icon"
                          onEdit={() => handleEdit('demo-content')}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="usage" className="space-y-4">
              <div className="rounded-md border p-4">
                <h3 className="font-mono text-sm font-bold mb-2">Component API</h3>
                <div className="prose text-sm">
                  <p>The <code>EditButton</code> component accepts the following props:</p>
                  <ul>
                    <li><code>contentId</code>: Required. Unique identifier for the content being edited.</li>
                    <li><code>onEdit</code>: Function called when the edit button is clicked.</li>
                    <li><code>size</code>: Button size - 'sm', 'md' (default), or 'lg'.</li>
                    <li><code>variant</code>: Button style - 'default', 'subtle', or 'icon'.</li>
                    <li><code>label</code>: Text label for the button (default: "Edit").</li>
                    <li><code>disabled</code>: Boolean to disable the button.</li>
                  </ul>
                </div>
                
                <h3 className="font-mono text-sm font-bold mb-2 mt-4">Example Usage</h3>
                <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                  {`import { EditButton } from "@/components/features/admin";

// Basic usage
<EditButton 
  contentId="page-title"
  onEdit={() => setEditingTitle(true)} 
/>

// Custom size and variant
<EditButton 
  contentId="page-description"
  size="sm"
  variant="subtle"
  onEdit={() => setEditingDescription(true)}
  label="Edit Description" 
/>`}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t p-4 text-sm text-muted-foreground">
          <p>
            The EditButton component provides a consistent user interface for editing content
            throughout the application. It supports different sizes and styles to fit various use cases.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditButtonDemo;