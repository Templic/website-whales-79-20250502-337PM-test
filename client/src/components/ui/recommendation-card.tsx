import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Button } from './button';
import { Info } from 'lucide-react';
import { ContentRecommendation } from '@/hooks/use-recommendations';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface RecommendationCardProps {
  recommendation: ContentRecommendation;
  className?: string;
  onSelect?: (recommendation: ContentRecommendation) => void;
  compact?: boolean;
}

export function RecommendationCard({
  recommendation,
  className,
  onSelect,
  compact = false
}: RecommendationCardProps) {
  const {
    contentId,
    title,
    summary,
    contentType,
    tags,
    score,
    reason,
    imageUrl
  } = recommendation;
  
  // Format score as percentage
  const scorePercent = Math.round(score * 100);
  
  // Determine content URL based on type
  let contentUrl = '#';
  if (contentType === 'blog' || contentType === 'post') {
    contentUrl = `/blog/post/${contentId}`;
  } else if (contentType === 'page') {
    contentUrl = `/page/${contentId}`;
  } else {
    contentUrl = `/content/${contentId}`;
  }

  return (
    <Card 
      className={cn("overflow-hidden h-full transition-all hover:shadow-md", 
        className
      )}
    >
      <CardHeader className={cn("pb-2", compact ? "p-3" : "")}>
        <div className="flex justify-between items-start">
          <CardTitle className={cn("font-medium line-clamp-2", 
            compact ? "text-sm" : "text-lg"
          )}>
            <Link href={contentUrl} className="hover:underline">
              {title}
            </Link>
          </CardTitle>
          
          <Badge 
            variant="outline" 
            className={`${scorePercent >= 80 ? 'bg-green-100' : scorePercent >= 50 ? 'bg-yellow-100' : 'bg-gray-100'} rounded-full`}
          >
            {scorePercent}%
          </Badge>
        </div>
      </CardHeader>
      
      {!compact && imageUrl && (
        <div className="relative h-32 w-full overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title} 
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      <CardContent className={cn("text-sm text-muted-foreground", 
        compact ? "p-3 pt-0" : "pt-2"
      )}>
        {summary && (
          <p className="line-clamp-3">{summary}</p>
        )}
        
        {!compact && tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className={cn("flex justify-between items-center text-xs text-muted-foreground border-t",
        compact ? "p-3" : ""
      )}>
        <Badge variant="outline" className="capitalize">
          {contentType}
        </Badge>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Info size={14} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="max-w-60">{reason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {onSelect && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onSelect(recommendation)}
              className="ml-2 text-xs h-6"
            >
              Select
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Loading skeleton version of RecommendationCard
export function RecommendationCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="overflow-hidden h-full animate-pulse">
      <CardHeader className={cn("pb-2", compact ? "p-3" : "")}>
        <div className="flex justify-between items-start">
          <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
          <div className="w-12 h-5 bg-gray-200 rounded-full"></div>
        </div>
      </CardHeader>
      
      {!compact && (
        <div className="h-32 w-full bg-gray-200"></div>
      )}
      
      <CardContent className={cn("pt-2", compact ? "p-3 pt-0" : "")}>
        <div className="space-y-2">
          <div className="w-full h-4 bg-gray-200 rounded"></div>
          <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
          {!compact && (
            <div className="w-4/6 h-4 bg-gray-200 rounded"></div>
          )}
        </div>
        
        {!compact && (
          <div className="flex gap-1 mt-3">
            <div className="w-16 h-5 bg-gray-200 rounded"></div>
            <div className="w-16 h-5 bg-gray-200 rounded"></div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className={cn("border-t", compact ? "p-3" : "")}>
        <div className="w-full flex justify-between">
          <div className="w-16 h-5 bg-gray-200 rounded"></div>
          <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
      </CardFooter>
    </Card>
  );
}