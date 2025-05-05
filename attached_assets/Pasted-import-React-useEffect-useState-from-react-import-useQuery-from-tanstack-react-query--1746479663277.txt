import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

/**
 * Interface for content items returned from the API
 */
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

/**
 * Props for the DynamicContent component
 */
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
 * Derives a page name from a content key
 * 
 * Format: "page-section-descriptor"
 * Example: "home-hero-title" -> page: "home"
 * 
 * @param key Content key to parse
 * @returns Derived page name
 */
const derivePageFromKey = (key: string): string => {
  // Extract the first segment of the key as the page name
  const firstSegment = key.split('-')[0];
  
  // Return the segment or fallback to "general" if empty
  return firstSegment || 'general';
};

/**
 * Derives a section name from a content key
 * 
 * Format: "page-section-descriptor"
 * Example: "home-hero-title" -> section: "hero"
 * 
 * @param key Content key to parse
 * @returns Derived section name
 */
const deriveSectionFromKey = (key: string): string => {
  const parts = key.split('-');
  
  // If we have at least two segments, use the second one as section
  if (parts.length > 1 && parts[1]) {
    return parts[1];
  }
  
  // Fallback to "main" section
  return 'main';
};

/**
 * Formats a title from a content key
 * 
 * Example: "home-hero-title" -> "Home Hero Title"
 * 
 * @param key Content key to format
 * @returns Formatted title
 */
const formatTitleFromKey = (key: string): string => {
  return key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * DynamicContent component that fetches and displays content from the API
 * based on a content key. This allows content to be managed through the admin panel.
 * 
 * If content doesn't exist and fallback text is provided, it will be automatically
 * created in the database with derived page and section values.
 * 
 * Usage:
 * <DynamicContent contentKey="home-hero-title" fallback="Welcome to Our Site" />
 * <DynamicContent contentKey="about-image" asImage={true} imageProps={{ alt: "About Us" }} />
 * 
 * To specify page and section explicitly:
 * <DynamicContent contentKey="custom-key" page="home" section="features" fallback="Text" />
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

  // Use explicit values if provided, otherwise derive them from the content key
  const effectivePage = page || derivePageFromKey(contentKey);
  const effectiveSection = section || deriveSectionFromKey(contentKey);

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
        
        // If content doesn't exist and we have fallback text, 
        // create a new content item automatically
        if (response.status === 404 && fallback) {
          try {
            const contentType = asImage ? 'image' : 'text';
            
            const newContent = {
              key: contentKey,
              title: formatTitleFromKey(contentKey),
              content: fallback,
              page: effectivePage,
              section: effectiveSection,
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
              // If creation failed, log details and error response
              const errorText = await createResponse.text();
              console.error(
                `Failed to create content item: ${contentKey}`,
                `Status: ${createResponse.status}`,
                `Response: ${errorText}`,
                `Content: ${JSON.stringify(newContent)}`
              );
              throw new Error(`Failed to create content: ${createResponse.status}`);
            }
          } catch (createErr) {
            console.error('Error creating content:', createErr);
            throw new Error('Content not found');
          }
        } else {
          throw new Error('Content not found');
        }
      } catch (err) {
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

  // DOM-safe rendering functions to prevent DOM nesting errors
  const renderLoadingSkeleton = () => {
    if (asImage) {
      return <span className={className}><Skeleton className="h-40 w-full" /></span>;
    }
    return <span className={className}><Skeleton className="h-6 w-48" /></span>;
  };

  const renderFallback = () => {
    if (asImage && fallback) {
      return (
        <img 
          src={fallback} 
          alt={imageProps.alt || 'Fallback image'} 
          {...imageProps} 
          className={className} 
        />
      );
    }
    return <span className={className}>{fallback}</span>;
  };

  const renderImage = (src: string) => {
    return (
      <img 
        src={src} 
        alt={imageProps.alt || contentItem?.title || 'Content image'}
        {...imageProps} 
        className={`${className} ${imageProps.className || ''}`} 
      />
    );
  };

  const renderHtmlContent = (htmlContent: string) => {
    return (
      <span
        className={className} 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    );
  };

  const renderTextContent = (textContent: string) => {
    return <span className={className}>{textContent}</span>;
  };

  // Render states
  if (isLoading) {
    return renderLoadingSkeleton();
  }

  if (contentError || error || !contentItem) {
    return renderFallback();
  }

  // Render based on content type
  if (asImage || contentItem.type === 'image') {
    const imageSrc = contentItem.imageUrl || contentItem.content;
    return renderImage(imageSrc);
  }

  if (contentItem.type === 'html') {
    return renderHtmlContent(contentItem.content);
  }

  return renderTextContent(contentItem.content);
};

export default DynamicContent;