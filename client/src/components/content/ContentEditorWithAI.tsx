/**
 * Content Editor with AI
 * 
 * An enhanced content editor that integrates AI-powered content features
 * to assist with content creation, enhancement, and optimization.
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ContentAIPanel } from './ContentAIPanel';
import { Edit3, Sparkles, Save, Tag } from 'lucide-react';

interface ContentEditorProps {
  initialContent?: {
    title: string;
    body: string;
    tags: string[];
  };
  onSave?: (content: { title: string; body: string; tags: string[] }) => void;
  className?: string;
}

export function ContentEditorWithAI({
  initialContent = { title: '', body: '', tags: [] },
  onSave,
  className
}: ContentEditorProps) {
  const [content, setContent] = useState({
    title: initialContent.title,
    body: initialContent.body,
    tags: initialContent.tags
  });

  const [activeTab, setActiveTab] = useState('edit');

  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
  };

  const handleApplyContent = (newContent: string) => {
    setContent({
      ...content,
      body: newContent
    });
  };

  const handleApplyTags = (newTags: string[]) => {
    setContent({
      ...content,
      tags: newTags
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={content.title}
          onChange={(e) => setContent({ ...content, title: e.target.value })}
          placeholder="Enter content title"
          className="text-xl"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <div className="space-y-4">
            <div>
              <Label htmlFor="body">Content</Label>
              <Textarea
                id="body"
                value={content.body}
                onChange={(e) => setContent({ ...content, body: e.target.value })}
                placeholder="Write your content here..."
                className="min-h-[400px] font-mono"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex items-center gap-2 flex-wrap border rounded-md p-2 min-h-[42px]">
                {content.tags.map((tag, index) => (
                  <div key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md flex items-center gap-1">
                    <span>{tag}</span>
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setContent({
                        ...content,
                        tags: content.tags.filter((_, i) => i !== index)
                      })}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <input
                  className="flex-1 min-w-[200px] bg-transparent border-none outline-none focus:ring-0"
                  placeholder="Add tags (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      setContent({
                        ...content,
                        tags: [...content.tags, e.currentTarget.value.trim()]
                      });
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <Button onClick={handleSave} className="mt-4">
              <Save className="mr-2 h-4 w-4" />
              Save Content
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <ContentAIPanel
            initialContent={content.body}
            onApplyContent={handleApplyContent}
            onApplyTags={handleApplyTags}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}