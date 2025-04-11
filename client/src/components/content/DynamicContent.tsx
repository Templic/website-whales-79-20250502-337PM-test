import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';

interface ContentItemType {
  id: number;
  type: 'text' | 'image' | 'html';
  key: string;
  title: string;
  content: string;
  page: string;
  section: string;
  imageUrl?: string;
  version: number;
}

interface DynamicContentProps {
  contentKey: string;  // Unique identifier for the content
  fallback?: string;   // Fallback text if content is not found
  page?: string;       // Page identifier (optional)
  section?: string;    // Section identifier (optional)
  className?: string;  // Optional class name for styling
  asImage?: boolean;   // Display as image (regardless of content type)
  imageProps?: React.ImgHTMLAttributes<HTMLImageElement>; // Props for image if asImage is true
}

/**
 * DynamicContent component that fetches and displays content from the API
 * based on a content key. This allows dynamic content to be managed via the admin panel.
 * 
 * Usage:
 * <DynamicContent contentKey="home-hero-title" fallback="Welcome to Our Site" />
 * <DynamicContent contentKey="about-image" asImage={true} imageProps={{ alt: "About Us" }} />
 */
const DynamicContent: React.FC<DynamicContentProps> = ({
  contentKey,
  fallback = '',
  page,
  section,
  className = '',
  asImage = false,
  imageProps = {},
}) => {
  const [contentError, setContentError] = useState<boolean>(false);

  // Fetch content item by key
  const { data: contentItem, isLoading, error } = useQuery<ContentItemType>({
    queryKey: [`/api/content/key/${contentKey}`],
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once to avoid flooding server with requests for non-existent content
    enabled: contentKey.length > 0,
    onError: () => {
      setContentError(true);
    }
  });

  // Reset error state when contentKey changes
  useEffect(() => {
    setContentError(false);
  }, [contentKey]);

  // Render loading state
  if (isLoading) {
    if (asImage) {
      return <Skeleton className={`h-40 w-full ${className}`} />;
    }
    return <Skeleton className={`h-6 w-48 ${className}`} />;
  }

  // Render error state or fallback
  if (contentError || error || !contentItem) {
    if (asImage && fallback) {
      return <img src={fallback} {...imageProps} className={className} />;
    }
    return <span className={className}>{fallback}</span>;
  }

  // Render image if asImage is true or content type is image
  if (asImage || contentItem.type === 'image') {
    const imageSrc = contentItem.imageUrl || contentItem.content;
    return (
      <img 
        src={imageSrc} 
        {...imageProps} 
        className={`${className} ${imageProps.className || ''}`} 
      />
    );
  }

  // Render HTML content
  if (contentItem.type === 'html') {
    return (
      <div 
        className={className} 
        dangerouslySetInnerHTML={{ __html: contentItem.content }} 
      />
    );
  }

  // Render plain text content
  return <span className={className}>{contentItem.content}</span>;
};

export default DynamicContent;