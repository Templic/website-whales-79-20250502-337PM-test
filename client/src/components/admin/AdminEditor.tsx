import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Define the content item type
interface ContentItem {
  id?: number;
  type: 'text' | 'image' | 'html';
  key: string;
  title: string;
  content: string;
  page: string;
  section: string;
  imageUrl?: string;
  version?: number;
}

interface AdminEditorProps {
  initialContent?: ContentItem;
  onSave?: (content: ContentItem) => void;
  onCancel?: () => void;
  pages: string[];
  isEditing?: boolean;
}

const AdminEditor: React.FC<AdminEditorProps> = ({ 
  initialContent, 
  onSave, 
  onCancel, 
  pages,
  isEditing = false
}) => {
  // Create default content if none is provided
  const defaultContent: ContentItem = {
    type: 'html',
    key: '',
    title: '',
    content: '',
    page: pages[0] || 'home',
    section: ''
  };

  // Set up state for the editor
  const [content, setContent] = useState<ContentItem>(initialContent || defaultContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const queryClient = useQueryClient();

  // Set up mutations for creating and updating content
  const createContentMutation = useMutation({
    mutationFn: async (newContent: ContentItem) => {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContent),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create content');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setSuccess('Content created successfully');
      setSaving(false);
      if (onSave) onSave(content);
    },
    onError: (error: any) => {
      setError(error.message || 'Error creating content');
      setSaving(false);
    }
  });

  const updateContentMutation = useMutation({
    mutationFn: async (updatedContent: ContentItem) => {
      const response = await fetch(`/api/content/${updatedContent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedContent),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update content');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setSuccess('Content updated successfully');
      setSaving(false);
      if (onSave) onSave(content);
    },
    onError: (error: any) => {
      setError(error.message || 'Error updating content');
      setSaving(false);
    }
  });

  // Handle changes to the editor content
  const handleEditorChange = (value: string) => {
    setContent(prev => ({ ...prev, content: value }));
  };

  // Handle changes to the form inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({ ...prev, [name]: value }));
  };

  // Handle changes to the select inputs
  const handleSelectChange = (name: string, value: string) => {
    setContent(prev => ({ ...prev, [name]: value }));
  };

  // Handle saving the content
  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    // Validate the form
    if (!content.key || !content.title || !content.content || !content.page || !content.section) {
      setError('All fields are required');
      setSaving(false);
      return;
    }

    // Generate a key from the title if not provided
    if (!content.key) {
      const key = content.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setContent(prev => ({ ...prev, key }));
    }

    try {
      // Save the content to the API
      if (isEditing && content.id) {
        updateContentMutation.mutate(content);
      } else {
        createContentMutation.mutate(content);
      }
    } catch (error: any) {
      setError(error.message || 'Error saving content');
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Content' : 'Create Content'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="default" className="bg-green-50 border-green-500 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              name="title" 
              value={content.title} 
              onChange={handleInputChange} 
              placeholder="Enter a title" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Key (unique identifier)</Label>
            <Input 
              id="key" 
              name="key" 
              value={content.key} 
              onChange={handleInputChange} 
              placeholder="Enter a unique key" 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="page">Page</Label>
            <Select 
              value={content.page} 
              onValueChange={(value) => handleSelectChange('page', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map((page) => (
                  <SelectItem key={page} value={page}>{page}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input 
              id="section" 
              name="section" 
              value={content.section} 
              onChange={handleInputChange} 
              placeholder="Enter a section name" 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select 
            value={content.type} 
            onValueChange={(value) => handleSelectChange('type', value as 'text' | 'image' | 'html')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {content.type === 'image' && (
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input 
              id="imageUrl" 
              name="imageUrl" 
              value={content.imageUrl || ''} 
              onChange={handleInputChange} 
              placeholder="Enter an image URL" 
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <div className="border rounded-md">
            <Editor
              apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
              onInit={(evt: any, editor: any) => editorRef.current = editor}
              value={content.content}
              onEditorChange={handleEditorChange}
              init={{
                height: 400,
                menubar: true,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminEditor;