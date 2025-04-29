/**
 * Content AI Demo Page
 * 
 * This page demonstrates the AI-powered content features
 * integrated into the content management system.
 */

import React, { useState } from 'react';
import { ContentEditorWithAI } from '../components/content/ContentEditorWithAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContentAIDemo() {
  const { toast } = useToast();
  const [savedContent, setSavedContent] = useState<{
    title: string;
    body: string;
    tags: string[];
  } | null>(null);

  const handleSaveContent = (content: { title: string; body: string; tags: string[] }) => {
    setSavedContent(content);
    toast({
      title: 'Content Saved',
      description: 'Your content has been saved successfully.',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        AI-Powered Content Studio
      </h1>
      <p className="text-muted-foreground mb-8">
        Create, enhance, and analyze content with the help of AI
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ContentEditorWithAI
            initialContent={{
              title: '',
              body: '',
              tags: []
            }}
            onSave={handleSaveContent}
          />
        </div>
        
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>AI-Powered Features</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Generate new content based on topics</li>
                <li>Enhance existing content for clarity and engagement</li>
                <li>Create concise summaries of long-form content</li>
                <li>Analyze sentiment and emotional tone</li>
                <li>Generate relevant tags and categories</li>
              </ul>
            </AlertDescription>
          </Alert>

          {savedContent && (
            <Card>
              <CardHeader>
                <CardTitle>Saved Content</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-bold mb-2">{savedContent.title}</h3>
                <div className="mb-4 overflow-auto max-h-[300px] border p-3 rounded-md whitespace-pre-wrap text-sm">
                  {savedContent.body}
                </div>
                <div>
                  <h4 className="font-medium mb-1">Tags:</h4>
                  <div className="flex flex-wrap gap-1">
                    {savedContent.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI-powered content features use OpenAI's advanced language models to help you create better content faster.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Switch to the "AI Assistant" tab in the editor</li>
                <li>Choose the AI feature you need (Generate, Enhance, etc.)</li>
                <li>Configure the options and submit your request</li>
                <li>Review the AI output and click "Apply" to use it in your editor</li>
                <li>Save your content when you're done</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}