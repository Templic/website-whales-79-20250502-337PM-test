import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

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
  const { data: contentItem, isLoading, error } = useQuery<ContentItemType, Error>({
    queryKey: [`/api/content/key/${contentKey}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/content/key/${contentKey}`);
        
        // If content exists, return it
        if (response.ok) {
          return response.json();
        }
        
        // If content doesn't exist and we have fallback text and page/section info, 
        // create a new content item automatically (for admin convenience)
        if (response.status === 404 && fallback && page && section) {
          try {
            const contentType = asImage ? 'image' : 'text';
            const title = contentKey
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            const newContent = {
              key: contentKey,
              title: title,
              content: fallback,
              page: page,
              section: section,
              type: contentType
            };
            
            // Create the content item
            const createResponse = await fetch('/api/content', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Auto-Creation': 'true'
              },
              body: JSON.stringify(newContent)
            });
            
            if (createResponse.ok) {
              // If successfully created, return the new content
              return createResponse.json();
            } else {
              // If creation failed, we'll just use the fallback text
              throw new Error('Failed to create content');
            }
          } catch (createErr: unknown) {
            console.error('Error creating content:', createErr);
            throw new Error('Content not found');
          }
        } else {
          throw new Error('Content not found');
        }
      } catch (err: unknown) {
        console.error('Error loading content:', err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once to avoid flooding server with requests for non-existent content
    enabled: contentKey.length > 0
  });
  
  // Set error state when there's an error
  useEffect(() => {
    if (error) {
      setContentError(true);
    }
  }, [error]);

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
      return <img src={fallback} alt={imageProps.alt || 'Fallback image'} {...imageProps} className={className} />;
    }
    return <span className={className}>{fallback}</span>;
  }

  // Render image if asImage is true or content type is image
  if (asImage || contentItem.type === 'image') {
    const imageSrc = contentItem.imageUrl || contentItem.content;
    return (
      <img 
        src={imageSrc} 
        alt={imageProps.alt || contentItem.title || 'Content image'}
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