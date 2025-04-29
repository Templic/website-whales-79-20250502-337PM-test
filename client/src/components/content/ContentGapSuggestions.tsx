import React from 'react';
import { useContentGapSuggestions } from '@/hooks/use-recommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, FileText, PlusCircle, RefreshCw, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ContentGap {
  id: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggestedTags: string[];
  suggestedTitle?: string;
  existingRelatedContent?: Array<{
    id: number;
    title: string;
    type: string;
  }>;
}

interface ContentGapSuggestionsProps {
  className?: string;
  onCreateContent?: (suggestion: ContentGap) => void;
}

export function ContentGapSuggestions({
  className,
  onCreateContent
}: ContentGapSuggestionsProps) {
  const {
    data: gapSuggestions,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useContentGapSuggestions();
  
  // Helper for priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-700 border-red-300 bg-red-50';
      case 'medium':
        return 'text-amber-700 border-amber-300 bg-amber-50';
      case 'low':
        return 'text-blue-700 border-blue-300 bg-blue-50';
      default:
        return 'text-gray-700 border-gray-300 bg-gray-50';
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Target className="h-5 w-5" />
          Content Gap Analysis
        </CardTitle>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8"
        >
          <RefreshCw 
            size={14} 
            className={cn("mr-1 transition-all", isFetching && "animate-spin")} 
          />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error 
                ? error.message 
                : 'Failed to load content gap suggestions. Please try again.'}
            </AlertDescription>
          </Alert>
        ) : gapSuggestions?.length ? (
          <Accordion type="single" collapsible className="w-full">
            {gapSuggestions.map((gap: ContentGap) => (
              <AccordionItem key={gap.id} value={gap.id} className="border rounded-md my-2 px-0">
                <div className="flex items-center justify-between px-4 pt-3">
                  <Badge 
                    variant="outline" 
                    className={cn("font-medium", getPriorityStyle(gap.priority))}
                  >
                    {gap.priority.toUpperCase()} PRIORITY
                  </Badge>
                </div>
                
                <AccordionTrigger className="px-4 hover:no-underline">
                  <h3 className="text-left font-medium">{gap.topic}</h3>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{gap.reason}</p>
                    
                    {gap.suggestedTitle && (
                      <div>
                        <div className="mb-1 text-sm font-medium">Suggested Title:</div>
                        <div className="text-sm border-l-2 border-primary pl-3 italic">{gap.suggestedTitle}</div>
                      </div>
                    )}
                    
                    <div>
                      <div className="mb-1 text-sm font-medium">Suggested Tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {gap.suggestedTags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {gap.existingRelatedContent && gap.existingRelatedContent.length > 0 && (
                      <div>
                        <div className="mb-1 text-sm font-medium">Related Existing Content:</div>
                        <ul className="text-sm list-disc list-inside">
                          {gap.existingRelatedContent.map((content) => (
                            <li key={content.id} className="text-muted-foreground">
                              {content.title} <Badge variant="outline">{content.type}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="pt-2 flex gap-2">
                      {onCreateContent && (
                        <Button 
                          size="sm" 
                          className="text-xs"
                          onClick={() => onCreateContent(gap)}
                        >
                          <PlusCircle size={14} className="mr-1" />
                          Create Content
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open(`/admin/content-management/new?suggestion=${gap.id}`, '_blank')}
                      >
                        <FileText size={14} className="mr-1" />
                        Open in Editor
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No content gaps identified at this time.</p>
            <p className="text-sm mt-1">Your content strategy appears to be covering all relevant topics.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}