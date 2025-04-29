import React, { useState } from 'react';
import { useRecommendations, RecommendationParams, ContentRecommendation } from '@/hooks/use-recommendations';
import { RecommendationCard, RecommendationCardSkeleton } from '@/components/ui/recommendation-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ContentRecommendationPanelProps {
  title?: string;
  params: RecommendationParams;
  layout?: 'grid' | 'list' | 'carousel';
  className?: string;
  onRecommendationSelect?: (recommendation: ContentRecommendation) => void;
  showControls?: boolean;
  compact?: boolean;
  maxItems?: number;
}

export function ContentRecommendationPanel({
  title = 'Recommendations',
  params,
  layout = 'grid',
  className,
  onRecommendationSelect,
  showControls = false,
  compact = false,
  maxItems = 10
}: ContentRecommendationPanelProps) {
  const [currentLayout, setCurrentLayout] = useState<'grid' | 'list' | 'carousel'>(layout);
  const [contentTypeFilter, setContentTypeFilter] = useState<string | undefined>(params.contentType);
  
  // Setup recommendation query with specified params and limits
  const recommendationParams: RecommendationParams = {
    ...params,
    contentType: contentTypeFilter,
    limit: maxItems,
    pageSize: maxItems
  };
  
  const {
    recommendations,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    loadMore,
    hasMore
  } = useRecommendations(recommendationParams);
  
  // Function to handle content type filter change
  const handleContentTypeChange = (value: string) => {
    setContentTypeFilter(value === 'all' ? undefined : value);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with title and controls */}
      <div className="flex flex-wrap justify-between items-center">
        <h3 className="text-xl font-semibold">{title}</h3>
        
        {showControls && (
          <div className="flex gap-2 items-center">
            <Select 
              value={contentTypeFilter || 'all'} 
              onValueChange={handleContentTypeChange}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blog">Blog Posts</SelectItem>
                <SelectItem value="page">Pages</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>
            
            <Tabs 
              value={currentLayout} 
              onValueChange={(value) => setCurrentLayout(value as 'grid' | 'list' | 'carousel')}
              className="ml-2"
            >
              <TabsList className="h-9">
                <TabsTrigger value="grid" className="px-3">Grid</TabsTrigger>
                <TabsTrigger value="list" className="px-3">List</TabsTrigger>
                <TabsTrigger value="carousel" className="px-3">Carousel</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()} 
              disabled={isFetching}
              className="h-9 w-9"
            >
              <RefreshCw size={16} className={cn("transition-all", isFetching && "animate-spin")} />
            </Button>
          </div>
        )}
      </div>
      
      {/* Error state */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error 
              ? error.message 
              : 'Failed to load recommendations. Please try again later.'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Grid layout */}
      <TabsContent value="grid" className="m-0">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecommendationCardSkeleton key={i} compact={compact} />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((recommendation) => (
                <RecommendationCard 
                  key={recommendation.contentId} 
                  recommendation={recommendation}
                  onSelect={onRecommendationSelect} 
                  compact={compact}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={loadMore} 
                  disabled={isFetching}
                >
                  {isFetching ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No recommendations found. Try changing your filters or checking back later.
          </div>
        )}
      </TabsContent>
      
      {/* List layout */}
      <TabsContent value="list" className="m-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="max-w-3xl">
                <RecommendationCardSkeleton compact={true} />
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <>
            <div className="space-y-2">
              {recommendations.map((recommendation) => (
                <div key={recommendation.contentId} className="max-w-3xl">
                  <RecommendationCard 
                    recommendation={recommendation}
                    onSelect={onRecommendationSelect} 
                    compact={true}
                  />
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore} 
                  disabled={isFetching}
                >
                  {isFetching ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No recommendations found. Try changing your filters or checking back later.
          </div>
        )}
      </TabsContent>
      
      {/* Carousel layout */}
      <TabsContent value="carousel" className="m-0">
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className="min-w-[300px] snap-start"
              >
                <RecommendationCardSkeleton compact={compact} />
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {recommendations.map((recommendation) => (
              <div 
                key={recommendation.contentId} 
                className="min-w-[300px] snap-start"
              >
                <RecommendationCard 
                  recommendation={recommendation}
                  onSelect={onRecommendationSelect} 
                  compact={compact}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No recommendations found. Try changing your filters or checking back later.
          </div>
        )}
      </TabsContent>
    </div>
  );
}