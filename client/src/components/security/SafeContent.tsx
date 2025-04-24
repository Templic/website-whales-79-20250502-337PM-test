/**
 * Safe Content Components
 * 
 * These components provide a higher-level abstraction for safely displaying
 * user-generated content in different contexts.
 */

import React from 'react';
import { 
  SafeHtml, 
  SafeImage, 
  SafeExternalLink, 
  UserContent, 
  SecureIframe 
} from '@/lib/security/XssPrevention';

/**
 * This component safely renders user-generated content in a card format
 */
export function ContentCard({
  title,
  content,
  imageUrl,
  linkUrl,
  linkText,
  author,
  date,
  className,
  ...rest
}: {
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  author?: string;
  date?: string | Date;
  className?: string;
  [key: string]: any;
}) {
  const formattedDate = date instanceof Date ? date.toLocaleDateString() : date;
  
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${className || ''}`} {...rest}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      {imageUrl && (
        <div className="mb-3">
          <SafeImage 
            src={imageUrl} 
            alt={title} 
            className="w-full h-auto rounded-md" 
          />
        </div>
      )}
      
      <UserContent 
        content={content} 
        context="html" 
        className="text-sm mb-3" 
      />
      
      {(author || formattedDate) && (
        <div className="text-xs text-gray-500 mb-2">
          {author && <span className="font-medium">{author}</span>}
          {author && formattedDate && <span className="mx-1">•</span>}
          {formattedDate && <span>{formattedDate}</span>}
        </div>
      )}
      
      {linkUrl && (
        <div className="mt-3">
          <SafeExternalLink 
            href={linkUrl}
            className="text-sm text-blue-600 hover:underline"
          >
            {linkText || 'Read more'}
          </SafeExternalLink>
        </div>
      )}
    </div>
  );
}

/**
 * This component safely renders embedded content like videos or maps
 */
export function EmbeddedContent({
  src,
  title,
  type = 'iframe',
  width = '100%',
  height = '315',
  className,
  allowFullscreen = true,
  allowScripts = true,
  ...rest
}: {
  src: string;
  title: string;
  type?: 'iframe' | 'video' | 'audio';
  width?: string | number;
  height?: string | number;
  className?: string;
  allowFullscreen?: boolean;
  allowScripts?: boolean;
  [key: string]: any;
}) {
  const sandbox = allowScripts 
    ? 'allow-scripts allow-same-origin allow-forms' 
    : 'allow-same-origin allow-forms';
    
  const fullSandbox = allowFullscreen 
    ? `${sandbox} allow-presentation allow-popups` 
    : sandbox;
    
  // Render based on content type
  switch (type) {
    case 'video':
      return (
        <div className={className}>
          <video
            src={src}
            title={title}
            width={width}
            height={height}
            controls
            {...rest}
          />
        </div>
      );
      
    case 'audio':
      return (
        <div className={className}>
          <audio
            src={src}
            title={title}
            controls
            {...rest}
          />
        </div>
      );
      
    case 'iframe':
    default:
      return (
        <div className={className}>
          <SecureIframe
            src={src}
            title={title}
            width={width}
            height={height}
            sandbox={fullSandbox}
            referrerPolicy="no-referrer"
            loading="lazy"
            {...rest}
          />
        </div>
      );
  }
}

/**
 * This component safely renders a comment with user-generated content
 */
export function Comment({
  author,
  authorAvatar,
  content,
  date,
  className,
  ...rest
}: {
  author: string;
  authorAvatar?: string;
  content: string;
  date?: string | Date;
  className?: string;
  [key: string]: any;
}) {
  const formattedDate = date instanceof Date ? date.toLocaleDateString() : date;
  
  return (
    <div className={`flex space-x-3 p-3 border-b ${className || ''}`} {...rest}>
      {authorAvatar && (
        <div className="flex-shrink-0">
          <SafeImage
            src={authorAvatar}
            alt={`${author}'s avatar`}
            className="w-10 h-10 rounded-full"
          />
        </div>
      )}
      
      <div className="flex-1">
        <div className="flex items-baseline mb-1">
          <span className="font-medium text-sm">{author}</span>
          {formattedDate && (
            <span className="ml-2 text-xs text-gray-500">{formattedDate}</span>
          )}
        </div>
        
        <UserContent 
          content={content} 
          context="text" 
          className="text-sm"
        />
      </div>
    </div>
  );
}

/**
 * This component safely renders a rich text editor's output
 */
export function RichTextContent({
  content,
  className,
  allowedTags = [
    'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code'
  ],
  ...rest
}: {
  content: string;
  className?: string;
  allowedTags?: string[];
  [key: string]: any;
}) {
  return (
    <div className={`prose ${className || ''}`} {...rest}>
      <SafeHtml 
        html={content} 
        allowedTags={allowedTags}
        allowedAttributes={{ 
          a: ['href', 'target', 'rel'],
          code: ['class'], 
          pre: ['class'] 
        }}
      />
    </div>
  );
}

/**
 * Example usage:
 * 
 * import { ContentCard, EmbeddedContent, Comment, RichTextContent } from '@/components/security/SafeContent';
 * 
 * function MyComponent() {
 *   return (
 *     <div>
 *       <ContentCard
 *         title="User Submitted Article"
 *         content={userSubmittedContent}
 *         imageUrl={userSubmittedImage}
 *         author="John Doe"
 *         date={new Date()}
 *       />
 *       
 *       <EmbeddedContent
 *         src="https://www.youtube.com/embed/dQw4w9WgXcQ"
 *         title="YouTube Video"
 *       />
 *       
 *       <Comment
 *         author="Jane Smith"
 *         authorAvatar="/avatars/jane.jpg"
 *         content={userComment}
 *         date={new Date()}
 *       />
 *       
 *       <RichTextContent content={richTextEditorOutput} />
 *     </div>
 *   );
 * }
 */