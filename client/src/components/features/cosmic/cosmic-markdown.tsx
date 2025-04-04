/**
 * cosmic-markdown.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define markdown container variants
const markdownContainerVariants = cva(
  "prose max-w-none", // Base styles using Tailwind Typography
  {
    variants: {
      variant: {
        default: "prose-invert", // Dark theme by default (light text on dark bg)
        light: "prose-stone", // Light theme (dark text on light bg)
        cosmic: [
          "prose-invert",
          "prose-headings:text-cosmic-primary prose-headings:font-cosmic",
          "prose-h1:bg-clip-text prose-h1:text-transparent prose-h1:bg-gradient-to-r prose-h1:from-cosmic-primary prose-h1:to-cosmic-secondary",
          "prose-a:text-cosmic-accent prose-a:no-underline prose-a:border-b prose-a:border-cosmic-accent/30 hover:prose-a:border-cosmic-accent",
          "prose-strong:text-cosmic-primary",
          "prose-code:text-cosmic-highlight prose-code:bg-gray-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-gray-800/80 prose-pre:border prose-pre:border-gray-700/50 prose-pre:rounded-md prose-pre:backdrop-blur-sm",
          "prose-blockquote:border-l-cosmic-primary/50 prose-blockquote:bg-gray-800/20 prose-blockquote:p-4 prose-blockquote:rounded-r-md prose-blockquote:not-italic",
          "prose-hr:border-cosmic-primary/20",
          "prose-img:rounded-md prose-img:shadow-lg",
          "prose-li:marker:text-cosmic-primary/70"
        ],
        nebula: [
          "prose-invert",
          "prose-headings:font-cosmic prose-headings:bg-clip-text prose-headings:text-transparent prose-headings:bg-gradient-to-r prose-headings:from-purple-400 prose-headings:via-pink-500 prose-headings:to-cosmic-primary",
          "prose-a:text-blue-400 prose-a:no-underline prose-a:border-b prose-a:border-blue-400/30 hover:prose-a:border-blue-400",
          "prose-strong:text-pink-400",
          "prose-code:text-purple-300 prose-code:bg-purple-900/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-gray-900/80 prose-pre:border prose-pre:border-purple-800/50 prose-pre:rounded-md",
          "prose-blockquote:border-l-pink-500 prose-blockquote:bg-pink-900/10 prose-blockquote:p-4 prose-blockquote:rounded-r-md prose-blockquote:not-italic",
          "prose-hr:border-purple-500/20",
          "prose-img:rounded-md prose-img:shadow-[0_0_15px_rgba(216,180,254,0.3)]",
          "prose-li:marker:text-pink-400"
        ],
        glow: [
          "prose-invert",
          "prose-headings:text-white prose-headings:font-cosmic prose-headings:drop-shadow-[0_0_8px_rgba(191,219,254,0.8)]",
          "prose-a:text-cyan-300 prose-a:no-underline prose-a:border-b prose-a:border-cyan-300/30 hover:prose-a:border-cyan-300 hover:prose-a:text-cyan-200 hover:prose-a:drop-shadow-[0_0_8px_rgba(103,232,249,0.6)]",
          "prose-strong:text-cyan-200 prose-strong:drop-shadow-[0_0_4px_rgba(103,232,249,0.6)]",
          "prose-code:text-cyan-200 prose-code:bg-cyan-900/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]",
          "prose-pre:bg-gray-900/80 prose-pre:border prose-pre:border-cyan-800/50 prose-pre:rounded-md",
          "prose-blockquote:border-l-cyan-500 prose-blockquote:bg-cyan-900/10 prose-blockquote:p-4 prose-blockquote:rounded-r-md prose-blockquote:not-italic",
          "prose-hr:border-cyan-500/30",
          "prose-img:rounded-md prose-img:shadow-[0_0_15px_rgba(8,145,178,0.5)]",
          "prose-li:marker:text-cyan-400"
        ],
        minimal: [
          "prose-invert",
          "prose-headings:font-cosmic",
          "prose-a:text-white prose-a:no-underline prose-a:border-b prose-a:border-white/30 hover:prose-a:border-white",
          "prose-blockquote:border-l-white/30 prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-md prose-blockquote:not-italic",
          "prose-img:rounded-md",
        ]
      },
      size: {
        sm: "prose-sm",
        default: "prose-base",
        lg: "prose-lg",
        xl: "prose-xl",
        '2xl': "prose-2xl"
      },
      animate: {
        true: "animate-in fade-in duration-500"
      }
    },
    defaultVariants: {
      variant: "cosmic",
      size: "default"
    }
  }
);

// Define the component props
export interface CosmicMarkdownProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof markdownContainerVariants> {
  content: string;
  allowHtml?: boolean;
  className?: string;
}

// The Markdown component
export const CosmicMarkdown: React.FC<CosmicMarkdownProps> = ({
  content,
  variant,
  size,
  animate,
  allowHtml = false,
  className,
  ...props
}) => {
  return (
    <div 
      className={cn(markdownContainerVariants({ variant, size, animate }), className)}
      {...props}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        // Only include the following if allowHtml is true
        {...(allowHtml ? { allowDangerousHtml: true } : {})}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default CosmicMarkdown;