/**
 * Content AI Panel
 * 
 * A component that provides AI-powered content features including content generation,
 * enhancement, summarization, sentiment analysis, and tag suggestions.
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, Sparkles, Tag, MessageSquare, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for AI panel inputs and responses
type ContentGenerationInput = {
  topic: string;
  type: 'blog' | 'product' | 'landing' | 'about' | 'newsletter';
  tone: 'professional' | 'casual' | 'enthusiastic' | 'informative';
  length: 'short' | 'medium' | 'long';
  keywords?: string[];
  targetAudience?: string;
};

type ContentEnhancementInput = {
  originalContent: string;
  enhancementType: 'clarity' | 'engagement' | 'seo' | 'readability';
  preserveStructure?: boolean;
  targetReadingLevel?: 'elementary' | 'intermediate' | 'advanced';
};

type ContentSummaryInput = {
  content: string;
  maxLength?: number;
  format: 'paragraph' | 'bullets' | 'tweetThread';
  includeKeyInsights?: boolean;
};

type SentimentAnalysisInput = {
  content: string;
};

type TagGenerationInput = {
  content: string;
  title?: string;
};

type SentimentAnalysisResult = {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
  subjectivity: number;
  confidence: number;
};

type ContentTagsResult = {
  mainTopic: string;
  tags: string[];
  categories: string[];
  entities: {
    name: string;
    type: string;
    relevance: number;
  }[];
  keywords: {
    term: string;
    relevance: number;
  }[];
};

// Props for the ContentAIPanel component
interface ContentAIPanelProps {
  initialContent?: string;
  onApplyContent?: (content: string) => void;
  onApplyTags?: (tags: string[]) => void;
  className?: string;
}

export function ContentAIPanel({ 
  initialContent = '', 
  onApplyContent, 
  onApplyTags,
  className
}: ContentAIPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generate');
  
  // Generate Content Tab
  const [generateInput, setGenerateInput] = useState<ContentGenerationInput>({
    topic: '',
    type: 'blog',
    tone: 'professional',
    length: 'medium',
    keywords: [],
    targetAudience: 'general audience'
  });
  const [keywordsInput, setKeywordsInput] = useState('');
  
  // Enhance Content Tab
  const [enhanceInput, setEnhanceInput] = useState<ContentEnhancementInput>({
    originalContent: initialContent,
    enhancementType: 'clarity',
    preserveStructure: true,
    targetReadingLevel: 'intermediate'
  });
  
  // Summarize Content Tab
  const [summaryInput, setSummaryInput] = useState<ContentSummaryInput>({
    content: initialContent,
    maxLength: 250,
    format: 'paragraph',
    includeKeyInsights: true
  });
  
  // Sentiment Analysis Tab
  const [sentimentInput, setSentimentInput] = useState<SentimentAnalysisInput>({
    content: initialContent
  });
  const [sentimentResult, setSentimentResult] = useState<SentimentAnalysisResult | null>(null);
  
  // Tag Generation Tab
  const [tagInput, setTagInput] = useState<TagGenerationInput>({
    content: initialContent,
    title: ''
  });
  const [tagResult, setTagResult] = useState<ContentTagsResult | null>(null);
  
  // Results
  const [generatedContent, setGeneratedContent] = useState('');
  const [enhancedContent, setEnhancedContent] = useState('');
  const [summarizedContent, setSummarizedContent] = useState('');
  
  // Mutations for API calls
  const generateMutation = useMutation({
    mutationFn: (data: ContentGenerationInput) => 
      apiRequest('/api/content-ai/generate', 'POST', data),
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast({
        title: 'Content Generated',
        description: 'AI has successfully generated new content.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Generation Failed',
        description: `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });
  
  const enhanceMutation = useMutation({
    mutationFn: (data: ContentEnhancementInput) => 
      apiRequest('/api/content-ai/enhance', 'POST', data),
    onSuccess: (data) => {
      setEnhancedContent(data.content);
      toast({
        title: 'Content Enhanced',
        description: 'AI has successfully enhanced your content.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Enhancement Failed',
        description: `Failed to enhance content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });
  
  const summarizeMutation = useMutation({
    mutationFn: (data: ContentSummaryInput) => 
      apiRequest('/api/content-ai/summarize', 'POST', data),
    onSuccess: (data) => {
      setSummarizedContent(data.summary);
      toast({
        title: 'Content Summarized',
        description: 'AI has successfully summarized your content.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Summarization Failed',
        description: `Failed to summarize content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });
  
  const sentimentMutation = useMutation({
    mutationFn: (data: SentimentAnalysisInput) => 
      apiRequest('/api/content-ai/sentiment', 'POST', data),
    onSuccess: (data) => {
      setSentimentResult(data);
      toast({
        title: 'Sentiment Analyzed',
        description: 'AI has successfully analyzed the content sentiment.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Sentiment Analysis Failed',
        description: `Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });
  
  const tagMutation = useMutation({
    mutationFn: (data: TagGenerationInput) => 
      apiRequest('/api/content-ai/tags', 'POST', data),
    onSuccess: (data) => {
      setTagResult(data);
      toast({
        title: 'Tags Generated',
        description: 'AI has successfully generated tags for your content.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Tag Generation Failed',
        description: `Failed to generate tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });
  
  // Handlers
  const handleGenerateContent = () => {
    // Parse keywords from comma-separated string to array
    const keywords = keywordsInput.split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    generateMutation.mutate({
      ...generateInput,
      keywords
    });
  };
  
  const handleEnhanceContent = () => {
    enhanceMutation.mutate(enhanceInput);
  };
  
  const handleSummarizeContent = () => {
    summarizeMutation.mutate(summaryInput);
  };
  
  const handleAnalyzeSentiment = () => {
    sentimentMutation.mutate(sentimentInput);
  };
  
  const handleGenerateTags = () => {
    tagMutation.mutate(tagInput);
  };
  
  const handleApplyContent = (content: string) => {
    if (onApplyContent) {
      onApplyContent(content);
      toast({
        title: 'Content Applied',
        description: 'The AI-generated content has been applied to your editor.'
      });
    }
  };
  
  const handleApplyTags = (tags: string[]) => {
    if (onApplyTags) {
      onApplyTags(tags);
      toast({
        title: 'Tags Applied',
        description: 'The AI-generated tags have been applied to your content.'
      });
    }
  };
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-blue-100 text-blue-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Progress bar component for sentiment and emotion scores
  const ProgressBar = ({ value, label, color }: { value: number, label: string, color: string }) => (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{Math.round(value * 100)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${Math.round(value * 100)}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Content Assistant
        </CardTitle>
        <CardDescription>
          Enhance your content with AI-powered tools
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="enhance">Enhance</TabsTrigger>
          <TabsTrigger value="summarize">Summarize</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        
        {/* Generate Content Tab */}
        <TabsContent value="generate">
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input 
                  id="topic" 
                  placeholder="Enter the main topic" 
                  value={generateInput.topic}
                  onChange={(e) => setGenerateInput({...generateInput, topic: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Content Type</Label>
                  <Select 
                    value={generateInput.type}
                    onValueChange={(value: any) => setGenerateInput({...generateInput, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="product">Product Description</SelectItem>
                      <SelectItem value="landing">Landing Page</SelectItem>
                      <SelectItem value="about">About Us</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select 
                    value={generateInput.tone}
                    onValueChange={(value: any) => setGenerateInput({...generateInput, tone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="informative">Informative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="length">Length</Label>
                  <Select 
                    value={generateInput.length}
                    onValueChange={(value: any) => setGenerateInput({...generateInput, length: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (250-400 words)</SelectItem>
                      <SelectItem value="medium">Medium (600-800 words)</SelectItem>
                      <SelectItem value="long">Long (1200-1500 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input 
                    id="audience" 
                    placeholder="e.g., business professionals" 
                    value={generateInput.targetAudience}
                    onChange={(e) => setGenerateInput({...generateInput, targetAudience: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input 
                  id="keywords" 
                  placeholder="e.g., AI, automation, productivity" 
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleGenerateContent} 
                disabled={generateMutation.isPending || !generateInput.topic}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
            
            {generatedContent && (
              <div className="mt-4">
                <Label>Generated Content</Label>
                <div className="bg-muted p-4 rounded-md mt-2 max-h-[400px] overflow-y-auto">
                  <div className="whitespace-pre-wrap">{generatedContent}</div>
                </div>
                <Button 
                  onClick={() => handleApplyContent(generatedContent)} 
                  className="mt-4"
                  variant="secondary"
                >
                  Apply to Editor
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        {/* Enhance Content Tab */}
        <TabsContent value="enhance">
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="originalContent">Original Content</Label>
                <Textarea 
                  id="originalContent" 
                  placeholder="Enter or paste content to enhance" 
                  value={enhanceInput.originalContent}
                  onChange={(e) => setEnhanceInput({...enhanceInput, originalContent: e.target.value})}
                  className="min-h-[150px]"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="enhancementType">Enhancement Type</Label>
                  <Select 
                    value={enhanceInput.enhancementType}
                    onValueChange={(value: any) => setEnhanceInput({...enhanceInput, enhancementType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clarity">Clarity</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="readability">Readability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="readingLevel">Reading Level</Label>
                  <Select 
                    value={enhanceInput.targetReadingLevel}
                    onValueChange={(value: any) => setEnhanceInput({...enhanceInput, targetReadingLevel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elementary">Elementary</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="preserveStructure"
                      checked={enhanceInput.preserveStructure}
                      onChange={(e) => setEnhanceInput({...enhanceInput, preserveStructure: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="preserveStructure">Preserve Structure</Label>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleEnhanceContent} 
                disabled={enhanceMutation.isPending || !enhanceInput.originalContent}
                className="w-full"
              >
                {enhanceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enhance Content
                  </>
                )}
              </Button>
            </div>
            
            {enhancedContent && (
              <div className="mt-4">
                <Label>Enhanced Content</Label>
                <div className="bg-muted p-4 rounded-md mt-2 max-h-[300px] overflow-y-auto">
                  <div className="whitespace-pre-wrap">{enhancedContent}</div>
                </div>
                <Button 
                  onClick={() => handleApplyContent(enhancedContent)} 
                  className="mt-4"
                  variant="secondary"
                >
                  Apply to Editor
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        {/* Summarize Content Tab */}
        <TabsContent value="summarize">
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contentToSummarize">Content to Summarize</Label>
                <Textarea 
                  id="contentToSummarize" 
                  placeholder="Enter or paste content to summarize" 
                  value={summaryInput.content}
                  onChange={(e) => setSummaryInput({...summaryInput, content: e.target.value})}
                  className="min-h-[150px]"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="summaryFormat">Format</Label>
                  <Select 
                    value={summaryInput.format}
                    onValueChange={(value: any) => setSummaryInput({...summaryInput, format: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paragraph">Paragraph</SelectItem>
                      <SelectItem value="bullets">Bullet Points</SelectItem>
                      <SelectItem value="tweetThread">Tweet Thread</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="maxLength">Max Length (words)</Label>
                  <Input 
                    id="maxLength" 
                    type="number" 
                    value={summaryInput.maxLength}
                    onChange={(e) => setSummaryInput({
                      ...summaryInput, 
                      maxLength: parseInt(e.target.value) || 250
                    })}
                  />
                </div>
                
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeKeyInsights"
                      checked={summaryInput.includeKeyInsights}
                      onChange={(e) => setSummaryInput({
                        ...summaryInput, 
                        includeKeyInsights: e.target.checked
                      })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="includeKeyInsights">Include Key Insights</Label>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSummarizeContent} 
                disabled={summarizeMutation.isPending || summaryInput.content.length < 50}
                className="w-full"
              >
                {summarizeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Summarize Content
                  </>
                )}
              </Button>
            </div>
            
            {summarizedContent && (
              <div className="mt-4">
                <Label>Summary</Label>
                <div className="bg-muted p-4 rounded-md mt-2 max-h-[300px] overflow-y-auto">
                  <div className="whitespace-pre-wrap">{summarizedContent}</div>
                </div>
                <Button 
                  onClick={() => handleApplyContent(summarizedContent)} 
                  className="mt-4"
                  variant="secondary"
                >
                  Apply to Editor
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment">
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contentForSentiment">Content to Analyze</Label>
                <Textarea 
                  id="contentForSentiment" 
                  placeholder="Enter or paste content to analyze sentiment" 
                  value={sentimentInput.content}
                  onChange={(e) => setSentimentInput({content: e.target.value})}
                  className="min-h-[150px]"
                />
              </div>
              
              <Button 
                onClick={handleAnalyzeSentiment} 
                disabled={sentimentMutation.isPending || sentimentInput.content.length < 10}
                className="w-full"
              >
                {sentimentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Analyze Sentiment
                  </>
                )}
              </Button>
            </div>
            
            {sentimentResult && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label>Overall Sentiment</Label>
                  <div className="flex items-center mt-2">
                    <Badge className={getSentimentColor(sentimentResult.sentiment)} variant="outline">
                      {sentimentResult.sentiment.charAt(0).toUpperCase() + sentimentResult.sentiment.slice(1)}
                    </Badge>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Confidence: {Math.round(sentimentResult.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label>Sentiment Score</Label>
                  <ProgressBar 
                    value={sentimentResult.score} 
                    label="Sentiment Strength" 
                    color="bg-primary" 
                  />
                </div>
                
                <div>
                  <Label>Emotion Breakdown</Label>
                  <div className="mt-2 space-y-2">
                    <ProgressBar 
                      value={sentimentResult.emotions.joy} 
                      label="Joy" 
                      color="bg-green-500" 
                    />
                    <ProgressBar 
                      value={sentimentResult.emotions.sadness} 
                      label="Sadness" 
                      color="bg-blue-500" 
                    />
                    <ProgressBar 
                      value={sentimentResult.emotions.anger} 
                      label="Anger" 
                      color="bg-red-500" 
                    />
                    <ProgressBar 
                      value={sentimentResult.emotions.fear} 
                      label="Fear" 
                      color="bg-purple-500" 
                    />
                    <ProgressBar 
                      value={sentimentResult.emotions.surprise} 
                      label="Surprise" 
                      color="bg-yellow-500" 
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Subjectivity</Label>
                  <ProgressBar 
                    value={sentimentResult.subjectivity} 
                    label="Subjective vs. Objective" 
                    color="bg-orange-500" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    0 = Highly objective, 1 = Highly subjective
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        {/* Tag Generation Tab */}
        <TabsContent value="tags">
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titleForTags">Content Title (Optional)</Label>
                <Input 
                  id="titleForTags" 
                  placeholder="Enter the content title" 
                  value={tagInput.title}
                  onChange={(e) => setTagInput({...tagInput, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="contentForTags">Content</Label>
                <Textarea 
                  id="contentForTags" 
                  placeholder="Enter or paste content to generate tags" 
                  value={tagInput.content}
                  onChange={(e) => setTagInput({...tagInput, content: e.target.value})}
                  className="min-h-[150px]"
                />
              </div>
              
              <Button 
                onClick={handleGenerateTags} 
                disabled={tagMutation.isPending || tagInput.content.length < 10}
                className="w-full"
              >
                {tagMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Tags...
                  </>
                ) : (
                  <>
                    <Tag className="mr-2 h-4 w-4" />
                    Generate Tags
                  </>
                )}
              </Button>
            </div>
            
            {tagResult && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label>Main Topic</Label>
                  <div className="mt-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {tagResult.mainTopic}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tagResult.categories.map((category, index) => (
                      <Badge key={index} variant="outline" className="bg-secondary text-secondary-foreground">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tagResult.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={() => handleApplyTags(tagResult.tags)} 
                    className="mt-4"
                    variant="secondary"
                    size="sm"
                  >
                    Apply Tags
                  </Button>
                </div>
                
                <div>
                  <Label>Key Entities</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {tagResult.entities.slice(0, 6).map((entity, index) => (
                      <div key={index} className="text-sm flex justify-between p-2 bg-muted rounded-md">
                        <span>{entity.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {entity.type} ({Math.round(entity.relevance * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-end text-xs text-muted-foreground pt-2">
        Powered by OpenAI
      </CardFooter>
    </Card>
  );
}