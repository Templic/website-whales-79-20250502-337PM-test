/**
 * ContentPreview.tsx
 * 
 * Component for previewing content scheduled for publication
 * Shows how content will appear when published, including different device views
 */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  EyeIcon, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Calendar, 
  Clock,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

// Types
interface ContentItem {
  id: number;
  key: string;
  title: string;
  content: string;
  type: string;
  status: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  location?: string;
  scheduledPublishAt?: string | null;
  expirationDate?: string | null;
  timezone?: string;
  recurringSchedule?: any;
}

interface ContentPreviewProps {
  contentId: number;
  scheduledDate?: string | null;
  timezone?: string;
}

interface PreviewMetadata {
  images?: string[];
  attachments?: string[];
  seoDescription?: string;
  tags?: string[];
  customStyles?: string;
}

/**
 * ContentPreview component
 * 
 * Displays a preview of how content will appear when published
 * Supports multiple device view modes (desktop, tablet, mobile)
 * Shows scheduling information
 */
const ContentPreview: React.FC<ContentPreviewProps> = ({
  contentId,
  scheduledDate,
  timezone = "UTC"
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  
  // Query to fetch content data for preview
  const { data: contentItem, isLoading } = useQuery<ContentItem>({
    queryKey: [`/api/admin/content/${contentId}/preview`, contentId, scheduledDate],
    queryFn: () => apiRequest('GET', `/api/admin/content/${contentId}/preview${scheduledDate ? `?scheduledDate=${scheduledDate}` : ''}`),
    enabled: isPreviewOpen,
  });
  
  // Get metadata as typed object
  const getMetadata = (): PreviewMetadata => {
    if (!contentItem?.metadata) return {};
    
    // If metadata is a string, parse it
    if (typeof contentItem.metadata === 'string') {
      try {
        return JSON.parse(contentItem.metadata);
      } catch {
        return {};
      }
    }
    
    return contentItem.metadata as PreviewMetadata;
  };
  
  const metadata = getMetadata();
  
  // Get device class based on selected view
  const getDeviceClass = (): string => {
    switch (deviceView) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      case "desktop":
      default:
        return "max-w-full";
    }
  };
  
  // Format date with timezone
  const formatDateWithTimezone = (dateString?: string | null): string => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    return `${format(date, 'MMM d, yyyy h:mm a')} (${timezone || 'UTC'})`;
  };
  
  // Render content based on type
  const renderContent = () => {
    if (!contentItem) return null;
    
    switch (contentItem.type) {
      case "html":
        return (
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: contentItem.content }} />
          </div>
        );
      case "text":
        return (
          <div className="whitespace-pre-wrap">
            {contentItem.content}
          </div>
        );
      case "markdown":
        // In a real implementation, this would render markdown
        return (
          <div className="prose dark:prose-invert max-w-none">
            {contentItem.content}
          </div>
        );
      default:
        return (
          <div className="whitespace-pre-wrap">
            {contentItem.content}
          </div>
        );
    }
  };
  
  // Render images if they exist in metadata
  const renderImages = () => {
    const images = metadata.images || [];
    
    if (images.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-2">
        {images.map((img, index) => (
          <img 
            key={index}
            src={img}
            alt={`Content image ${index + 1}`}
            className="rounded-md max-w-full h-auto"
          />
        ))}
      </div>
    );
  };
  
  return (
    <>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
            <DialogDescription>
              Preview how content will appear when published on {scheduledDate ? formatDateWithTimezone(scheduledDate) : 'the scheduled date'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            {/* Device view selection */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Device:</span>
                <Tabs value={deviceView} onValueChange={(v) => setDeviceView(v as any)}>
                  <TabsList>
                    <TabsTrigger value="desktop">
                      <Monitor className="h-4 w-4 mr-1" />
                      Desktop
                    </TabsTrigger>
                    <TabsTrigger value="tablet">
                      <Tablet className="h-4 w-4 mr-1" />
                      Tablet
                    </TabsTrigger>
                    <TabsTrigger value="mobile">
                      <Smartphone className="h-4 w-4 mr-1" />
                      Mobile
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Scheduling info */}
              {scheduledDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{formatDateWithTimezone(scheduledDate)}</span>
                </div>
              )}
            </div>
            
            {/* Content preview */}
            <Card className={`border shadow-sm mx-auto ${getDeviceClass()}`}>
              <CardHeader className="pb-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-3/4" />
                ) : (
                  <CardTitle>{contentItem?.title || "Content Preview"}</CardTitle>
                )}
                {contentItem?.status && (
                  <Badge variant="outline" className="w-fit">
                    {contentItem.status}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  <>
                    {renderContent()}
                    {renderImages()}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between text-sm text-muted-foreground">
                <div>
                  {contentItem?.expirationDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Expires: {formatDateWithTimezone(contentItem.expirationDate)}</span>
                    </div>
                  )}
                </div>
                
                {!isLoading && !contentItem && (
                  <div className="flex items-center text-amber-600 gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Content not available for preview</span>
                  </div>
                )}
              </CardFooter>
            </Card>
            
            {/* Preview notice */}
            <div className="text-xs text-center text-muted-foreground">
              This is a preview and may differ slightly from the final published version.
              Timezone used for scheduling: {timezone || "UTC"}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
            <Button variant="ghost" asChild>
              <a href={`/admin/content/${contentId}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Edit Content
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContentPreview;