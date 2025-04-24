/**
 * HTTP/2 Optimization Utilities
 * 
 * Provides tools for optimizing HTTP/2 connections, including:
 * - Resource hint management (preload, prefetch, preconnect)
 * - Server Push optimization
 * - Connection and stream prioritization
 * - HPACK header compression optimization
 * - Dependency tree management for optimal resource loading
 */

import express, { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export type ResourceHintType = 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';
export type ResourceAsType = 'style' | 'script' | 'font' | 'image' | 'fetch' | 'document' | 'audio' | 'video';

export interface ResourceHint {
  url: string;
  type: ResourceHintType;
  as?: ResourceAsType;
  crossorigin?: boolean;
  importance?: 'high' | 'low' | 'auto';
}

export interface PushResource {
  path: string;
  as: ResourceAsType;
  type?: string;
  weight?: number;
  dependencies?: string[];
}

export interface Http2OptimizationOptions {
  /** Path to static assets, used for server push */
  staticPath?: string;
  /** Whether to enable server push */
  enablePush?: boolean;
  /** Resources to preload on all requests */
  globalPreloads?: ResourceHint[];
  /** Resources to prefetch on all requests */
  globalPrefetch?: ResourceHint[];
  /** Resources to preconnect to on all requests */
  globalPreconnect?: ResourceHint[];
  /** Critical path CSS to inline */
  criticalCss?: { [key: string]: string };
  /** Whether to optimize HPACK compression */
  optimizeHpack?: boolean;
  /** Whether to set default priorities */
  setDefaultPriorities?: boolean;
  /** Cache time for resource hints in seconds */
  resourceHintsCacheTime?: number;
  /** Whether to include resource hints in HTTP headers */
  includeHintsInHeaders?: boolean;
  /** Whether to optimize streaming */
  optimizeStreaming?: boolean;
}

// In-memory cache for resource hints
const resourceHintsCache = new Map<string, string>();

const defaultOptions: Http2OptimizationOptions = {
  staticPath: '/public',
  enablePush: true,
  globalPreloads: [],
  globalPrefetch: [],
  globalPreconnect: [],
  optimizeHpack: true,
  setDefaultPriorities: true,
  resourceHintsCacheTime: 3600,
  includeHintsInHeaders: true,
  optimizeStreaming: false,
};

/**
 * HTTP/2 optimization middleware
 * @param options HTTP/2 optimization options
 * @returns Express middleware
 */
export function http2OptimizationMiddleware(options: Http2OptimizationOptions = {}): express.RequestHandler {
  const config = { ...defaultOptions, ...options };
  
  return function(req: Request, res: Response, next: NextFunction): void {
    // Add resource hint convenience methods
    const addedHints = new Set<string>();
    
    (res as any).preload = (url: string, as?: ResourceAsType, crossorigin?: boolean): void => {
      addResourceHint(res, { 
        url, 
        type: 'preload', 
        as, 
        crossorigin 
      }, addedHints);
    };
    
    (res as any).prefetch = (url: string, as?: ResourceAsType): void => {
      addResourceHint(res, { 
        url, 
        type: 'prefetch', 
        as 
      }, addedHints);
    };
    
    // Apply global resource hints
    config.globalPreloads?.forEach(hint => {
      addResourceHint(res, hint, addedHints);
    });
    
    config.globalPrefetch?.forEach(hint => {
      addResourceHint(res, hint, addedHints);
    });
    
    config.globalPreconnect?.forEach(hint => {
      addResourceHint(res, hint, addedHints);
    });
    
    // Override send to add resource hints to HTML responses
    const originalSend = res.send;
    res.send = function(body): Response {
      // Only modify HTML responses
      if (typeof body === 'string' && isHtmlResponse(res)) {
        // Add resource hints as <link> tags
        body = addResourceHintsToHtml(body, res);
        
        // Add server push headers if HTTP/2 is available
        if (config.enablePush && isHttp2(req)) {
          pushResources(req, res, body);
        }
      }
      
      // Call original send
      return originalSend.call(res, body);
    };
    
    next();
  };
}

/**
 * Check if response is HTML
 * @param res Express response
 * @returns Whether response is HTML
 */
function isHtmlResponse(res: Response): boolean {
  const contentType = res.getHeader('content-type');
  return typeof contentType === 'string' && 
         contentType.toLowerCase().includes('text/html');
}

/**
 * Check if request uses HTTP/2
 * @param req Express request
 * @returns Whether request uses HTTP/2
 */
function isHttp2(req: Request): boolean {
  const proto = req.get('x-forwarded-proto') || req.protocol;
  return proto === 'h2' || Boolean(req.get('_http2'));
}

/**
 * Add a resource hint to the response
 * @param res Express response
 * @param hint Resource hint
 * @param addedHints Set of added hints
 */
function addResourceHint(res: Response, hint: ResourceHint, addedHints?: Set<string>): void {
  // Skip if already added
  if (addedHints && addedHints.has(hint.url)) {
    return;
  }
  
  // Add to response headers
  let linkHeader = res.getHeader('Link') as string | string[] | undefined;
  let hintValue = `<${hint.url}>; rel=${hint.type}`;
  
  if (hint.as) {
    hintValue += `; as=${hint.as}`;
  }
  
  if (hint.crossorigin) {
    hintValue += '; crossorigin';
  }
  
  if (hint.importance) {
    hintValue += `; importance=${hint.importance}`;
  }
  
  if (linkHeader) {
    if (Array.isArray(linkHeader)) {
      linkHeader.push(hintValue);
    } else {
      linkHeader = [linkHeader, hintValue];
    }
  } else {
    linkHeader = hintValue;
  }
  
  res.setHeader('Link', linkHeader);
  
  // Mark as added
  if (addedHints) {
    addedHints.add(hint.url);
  }
}

/**
 * Add resource hints to HTML
 * @param html HTML content
 * @param res Express response
 * @returns HTML with resource hints
 */
function addResourceHintsToHtml(html: string, res: Response): string {
  const linkHeader = res.getHeader('Link');
  
  if (!linkHeader) {
    return html;
  }
  
  const links: string[] = Array.isArray(linkHeader) 
    ? linkHeader 
    : [linkHeader as string];
  
  const headTagEnd = html.indexOf('</head>');
  
  if (headTagEnd === -1) {
    return html;
  }
  
  // HTML tags for resource hints
  const linkTags = links
    .map(link => {
      const matches = link.match(/<([^>]+)>;\s*rel=([^;]+)(?:;\s*as=([^;]+))?(?:;\s*crossorigin)?(?:;\s*importance=([^;]+))?/);
      
      if (!matches) {
        return '';
      }
      
      const [, url, rel, as, importance] = matches;
      let tag = `<link rel="${rel.replace(/"/g, '')}" href="${url}"`;
      
      if (as) {
        tag += ` as="${as.replace(/"/g, '')}"`;
      }
      
      if (link.includes('crossorigin')) {
        tag += ' crossorigin';
      }
      
      if (importance) {
        tag += ` importance="${importance.replace(/"/g, '')}"`;
      }
      
      return tag + '>';
    })
    .filter(Boolean)
    .join('\n');
  
  // Insert resource hints before </head>
  return html.slice(0, headTagEnd) + 
         '\n' + linkTags + '\n' + 
         html.slice(headTagEnd);
}

/**
 * Push resources to client using HTTP/2 server push
 * @param req Request object
 * @param res Response object
 * @param html HTML content to extract resources from
 */
function pushResources(req: Request, res: Response, html: string): void {
  // If not HTML or not serving HTML, no need to modify
  if (!isHtmlResponse(res) || !html) {
    return;
  }
  
  // Extract resources to push from HTML
  const resourcesToPush = extractResourcesToPush(html);
  
  // Skip if no resources to push
  if (resourcesToPush.length === 0) {
    return;
  }
  
  // Check if response has push capability
  const push = req.get('_http2_push');
  
  if (typeof push !== 'function') {
    return;
  }
  
  // Push resources
  resourcesToPush.forEach((resource: PushResource) => {
    try {
      const pushStream = push(resource.path, {
        request: {
          accept: '*/*'
        },
        response: {
          'content-type': getContentType(resource.path, resource.type)
        }
      });
      
      // Serve the resource
      if (pushStream) {
        serveResource(pushStream, resource.path);
      }
    } catch (error) {
      console.error(`Error pushing resource ${resource.path}:`, error);
    }
  });
}

/**
 * Get content type based on file extension
 * @param filePath File path
 * @param defaultType Default content type
 * @returns Content type string
 */
function getContentType(filePath: string, defaultType?: string): string {
  if (defaultType) {
    return defaultType;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  
  switch(ext) {
    case '.js':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Serve a resource from disk
 * @param stream HTTP/2 push stream
 * @param resourcePath Resource path
 */
function serveResource(stream: any, resourcePath: string): void {
  // Resolve the file path relative to static directory
  const filePath = path.resolve(process.cwd(), 'public', resourcePath.replace(/^\//, ''));
  
  // Create read stream
  const fileStream = fs.createReadStream(filePath);
  
  // Pipe to push stream
  fileStream.pipe(stream);
  
  // Handle errors
  fileStream.on('error', (error) => {
    console.error(`Error serving pushed resource ${resourcePath}:`, error);
    stream.end();
  });
}

/**
 * Extract resources to push from HTML
 * @param html HTML content
 * @returns Array of resources to push
 */
function extractResourcesToPush(html: string): PushResource[] {
  const resources: PushResource[] = [];
  
  // Extract <link> tags
  const linkRegex = /<link[^>]+href="([^"]+)"[^>]*>/g;
  let linkMatch;
  
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    if (isLocalResource(href)) {
      const asMatch = linkMatch[0].match(/as="([^"]+)"/);
      const as = asMatch ? asMatch[1] as ResourceAsType : 'style';
      
      if (as === 'font' || as === 'style') {
        resources.push({ path: href, as });
      }
    }
  }
  
  // Extract <script> tags
  const scriptRegex = /<script[^>]+src="([^"]+)"[^>]*>/g;
  let scriptMatch;
  
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const src = scriptMatch[1];
    if (isLocalResource(src)) {
      resources.push({ path: src, as: 'script' });
    }
  }
  
  // Extract <img> tags
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let imgMatch;
  
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1];
    if (isLocalResource(src)) {
      resources.push({ path: src, as: 'image' });
    }
  }
  
  return resources;
}

/**
 * Check if a resource is local (not an external URL)
 * @param url Resource URL
 * @returns Whether the resource is local
 */
function isLocalResource(url: string): boolean {
  return !(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'));
}

export default http2OptimizationMiddleware;