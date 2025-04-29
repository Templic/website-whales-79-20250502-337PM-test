import React from 'react';
import { useTrendingTopics } from '@/hooks/use-recommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendingTopic {
  topic: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  count: number;
}

interface TrendingTopicsDisplayProps {
  className?: string;
  onTopicSelect?: (topic: string) => void;
  maxTopics?: number;
  showRefresh?: boolean;
}

export function TrendingTopicsDisplay({
  className,
  onTopicSelect,
  maxTopics = 10,
  showRefresh = false
}: TrendingTopicsDisplayProps) {
  const { 
    data: trendingTopics, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching 
  } = useTrendingTopics();
  
  const topicsToShow = trendingTopics?.slice(0, maxTopics) || [];
  
  // Helper to get badge color based on trend
  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (trend === 'down') return 'bg-red-100 text-red-800 hover:bg-red-200';
    return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Topics
        </CardTitle>
        
        {showRefresh && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isFetching}
          >
            <RefreshCw 
              size={16} 
              className={cn("transition-all", isFetching && "animate-spin")} 
            />
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          // Loading state
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        ) : isError ? (
          // Error state
          <div className="text-center py-4 text-muted-foreground">
            <p className="mb-2">Unable to load trending topics</p>
            <p className="text-sm">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : topicsToShow.length > 0 ? (
          // Topics list
          <div className="space-y-2">
            {topicsToShow.map((topic: TrendingTopic, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-1"
              >
                <Badge 
                  variant="outline"
                  className={cn(
                    "cursor-pointer px-3 py-1 text-sm",
                    getTrendColor(topic.trend),
                    onTopicSelect && "hover:shadow-sm transition-all"
                  )}
                  onClick={() => onTopicSelect && onTopicSelect(topic.topic)}
                >
                  {topic.topic}
                </Badge>
                
                <div className="flex items-center gap-1">
                  {topic.trend === 'up' && (
                    <span className="text-green-600 text-xs">↑</span>
                  )}
                  {topic.trend === 'down' && (
                    <span className="text-red-600 text-xs">↓</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {topic.count} mention{topic.count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-6 text-muted-foreground">
            <p>No trending topics available at this time.</p>
            <p className="text-sm mt-1">Check back later for updates.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}