import React, { useState } from 'react';
import { ContentRecommendationPanel } from '@/components/content/ContentRecommendationPanel';
import { TrendingTopicsDisplay } from '@/components/content/TrendingTopicsDisplay';
import { ContentGapSuggestions } from '@/components/content/ContentGapSuggestions';
import { RecommendationParams, ContentRecommendation } from '@/hooks/use-recommendations';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckIcon, LayoutDashboard, Lightbulb, Zap } from 'lucide-react';

export default function ContentRecommendationsDemo() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personalized");
  const [selectedRecommendation, setSelectedRecommendation] = useState<ContentRecommendation | null>(null);
  
  // Demo parameters
  const personalizedParams: RecommendationParams = {
    userId: "76364a95-eb36-4b08-aaac-454e8bd66e9b", // admin user
    limit: 6
  };
  
  const blogParams: RecommendationParams = {
    contentType: "blog",
    limit: 6
  };
  
  const relatedParams: RecommendationParams = {
    contentId: 12, // Sample content ID
    limit: 3
  };
  
  // Handle topic selection from trending topics
  const handleTopicSelect = (topic: string) => {
    toast({
      title: "Topic Selected",
      description: `You selected the topic: ${topic}`,
      duration: 3000,
    });
    
    // In a real application, this would navigate to content tagged with this topic
    // or update the recommendations to filter by this topic
    setActiveTab("personalized");
  };
  
  // Handle recommendation selection
  const handleRecommendationSelect = (recommendation: ContentRecommendation) => {
    setSelectedRecommendation(recommendation);
  };
  
  // Handle creating content from gap suggestion
  const handleCreateContent = (suggestion: any) => {
    toast({
      title: "Content Creation Started",
      description: `New content based on "${suggestion.topic}" is being prepared`,
      duration: 5000,
    });
    
    // In a real application, this would navigate to the content editor
    // with pre-filled fields based on the suggestion
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Content Recommendations</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered content recommendations to enhance user engagement
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="default">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content - 3/4 width */}
        <div className="lg:col-span-3 space-y-8">
          <Tabs 
            defaultValue="personalized" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personalized" className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                Personalized
              </TabsTrigger>
              <TabsTrigger value="blog">
                Latest Blog Posts
              </TabsTrigger>
              <TabsTrigger value="related">
                Related Content
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personalized" className="mt-6">
              <ContentRecommendationPanel
                title="Recommended for You"
                params={personalizedParams}
                showControls={true}
                layout="grid"
                onRecommendationSelect={handleRecommendationSelect}
              />
            </TabsContent>
            
            <TabsContent value="blog" className="mt-6">
              <ContentRecommendationPanel
                title="Latest Blog Content"
                params={blogParams}
                showControls={true}
                layout="grid"
                onRecommendationSelect={handleRecommendationSelect}
              />
            </TabsContent>
            
            <TabsContent value="related" className="mt-6">
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-2">Currently Viewing</h3>
                  <div className="flex items-center border rounded-md p-3">
                    <div className="h-12 w-12 bg-primary/10 rounded-md flex items-center justify-center text-primary mr-3">
                      <Lightbulb />
                    </div>
                    <div>
                      <h4 className="font-medium">Cosmic Consciousness: Understanding Universal Energy</h4>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline">consciousness</Badge>
                        <Badge variant="outline">energy</Badge>
                        <Badge variant="outline">meditation</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <ContentRecommendationPanel
                title="Related Content"
                params={relatedParams}
                layout="grid"
                onRecommendationSelect={handleRecommendationSelect}
              />
            </TabsContent>
          </Tabs>
          
          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold mb-4">Content Gap Analysis</h2>
            <p className="text-muted-foreground mb-6">
              AI-powered analysis of content gaps to improve your content strategy
            </p>
            
            <ContentGapSuggestions 
              onCreateContent={handleCreateContent} 
            />
          </div>
        </div>
        
        {/* Sidebar - 1/4 width */}
        <div className="lg:col-span-1 space-y-6">
          <TrendingTopicsDisplay 
            onTopicSelect={handleTopicSelect}
            showRefresh={true}
          />
          
          <Card className="overflow-hidden">
            <div className="bg-primary/10 p-4">
              <h3 className="font-semibold flex items-center">
                <CheckIcon className="mr-2 h-4 w-4" /> Content Optimization Tips
              </h3>
            </div>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-green-600">●</span>
                  <span>Use trending topics in your next content</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-600">●</span>
                  <span>Fill content gaps for better coverage</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">●</span>
                  <span>Create internal links to related content</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600">●</span>
                  <span>Update older content with fresh insights</span>
                </li>
              </ul>
              <Button variant="link" className="p-0 h-auto mt-2 text-sm">
                View full guide
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Recommendation details dialog */}
      <Dialog open={!!selectedRecommendation} onOpenChange={() => setSelectedRecommendation(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedRecommendation?.title}</DialogTitle>
            <DialogDescription>
              Content ID: {selectedRecommendation?.contentId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecommendation && (
            <div className="space-y-4">
              {selectedRecommendation.imageUrl && (
                <div className="rounded-md overflow-hidden h-48 w-full">
                  <img 
                    src={selectedRecommendation.imageUrl} 
                    alt={selectedRecommendation.title} 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium">Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecommendation.summary || "No summary available"}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Recommendation Reason</h4>
                  <p className="text-sm text-muted-foreground">{selectedRecommendation.reason}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Content Type</h4>
                  <Badge className="mt-1">{selectedRecommendation.contentType}</Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRecommendation.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Relevance Score</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${Math.round(selectedRecommendation.score * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-right mt-1 text-muted-foreground">
                    {Math.round(selectedRecommendation.score * 100)}%
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedRecommendation(null)}>
                  Close
                </Button>
                <Button>
                  View Full Content
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}