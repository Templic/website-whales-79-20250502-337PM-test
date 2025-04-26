/**
 * HTTP/2 Optimization Utilities
 * 
 * Provides tools for optimizing HTTP/2 connections, including:
 * - Resource hint management (preload: any, prefetch: any, preconnect: any)
 * - Server Push optimization
 * - Connection and stream prioritization
 * - HPACK header compression optimization
 * - Dependency tree management for optimal resource loading
 */

import { Request, Response, NextFunction } from 'express';
import { parse as parseUrl } from 'url';
import * as path from 'path';
import * as fs from 'fs';

// Types for resource hints
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

// Default options
const defaultOptions: Http2OptimizationOptions = {
  staticPath: 'public',
  enablePush: true,
  globalPreloads: [],
  globalPrefetch: [],
  globalPreconnect: [],
  criticalCss: {},
  optimizeHpack: true,
  setDefaultPriorities: true,
  resourceHintsCacheTime: 86400, // 1 day
  includeHintsInHeaders: true,
  optimizeStreaming: true,
};

// Cache for resource hints
const resourceHintsCache = new Map<string, string>();

/**
 * Middleware for HTTP/2 optimization
 * @param options Configuration options
 * @returns Express middleware
 */
export function http2OptimizationMiddleware(options: Http2OptimizationOptions = {}) {
  // Merge options with defaults
  const config = { ...defaultOptions, ...options };
  
  return function(req: Request, res: Response, next: NextFunction) {
    // Skip for non-HTML requests
    const acceptHeader = req.headers.accept || '';
    if (!acceptHeader.includes('text/html')) {
      return next();
    }
    
    // Add resource hint methods to response object
    const originalSend = res.send;
    
    // Extend response to include resource hint capabilities
    (res as any).preload = (url: string, as?: ResourceAsType, crossorigin?: boolean) => {
      addResourceHint(res, { url, type: 'preload', as, crossorigin });
      return res;
    };
    
    (res as any).prefetch = (url: string, as?: ResourceAsType) => {
      addResourceHint(res, { url, type: 'prefetch', as });
      return res;
    };
    
    (res as any).preconnect = (url: string, crossorigin?: boolean) => {
      addResourceHint(res, { url, type: 'preconnect', crossorigin });
      return res;
    };
    
    (res as any).dnsPrefetch = (url: string) => {
      addResourceHint(res, { url, type: 'dns-prefetch' });
      return res;
    };
    
    // Track added hints to avoid duplicates
    const addedHints = new Set<string>();
    
    // Add global hints
    config.globalPreloads?.forEach(hint => {
      addResourceHint(res: any, hint: any, addedHints: any);
    });
    
    config.globalPrefetch?.forEach(hint => {
      addResourceHint(res: any, hint: any, addedHints: any);
    });
    
    config.globalPreconnect?.forEach(hint => {
      addResourceHint(res: any, hint: any, addedHints: any);
    });
    
    // Override send to add resource hints to HTML responses
    res.send = function(body: any) {
      // Only modify HTML responses
      if (typeof body === 'string' && isHtmlResponse(res: any)) {
        // Add resource hints as <link> tags
        body = addResourceHintsToHtml(body: any, res: any);
        
        // Add server push headers if HTTP/2 is available
        if (config.enablePush && isHttp2(req: any)) {
          pushResources(req: any, res: any, body: any);
        }
      }
      
      return originalSend.call(this: any, body: any);
    };
    
    next();
  };
}

/**
 * Check if the response is HTML
 * @param res Express response
 * @returns Whether the response is HTML
 */
function isHtmlResponse(res: Response): boolean {
  const contentType = res.get('Content-Type') || '';
  return contentType.includes('text/html');
}

/**
 * Check if the request is using HTTP/2
 * @param req Express request
 * @returns Whether the request is using HTTP/2
 */
function isHttp2(req: Request): boolean {
  // Check if HTTP/2 is available (using Express or Node.js HTTP/2 APIs)
  return !!(req.httpVersion === '2.0' || (req as any).socket?.alpnProtocol === 'h2');
}

/**
 * Add a resource hint to the response
 * @param res Express response
 * @param hint Resource hint to add
 * @param addedHints Set of already added hints to avoid duplicates
 */
function addResourceHint(res: Response, hint: ResourceHint, addedHints?: Set<string>) {
  const hintKey = `${hint.type}:${hint.url}:${hint.as || ''}`;
  
  // Skip duplicates
  if (addedHints?.has(hintKey: any)) {
    return;
  }
  
  // Track added hints
  addedHints?.add(hintKey: any);
  
  // Get existing Link header
  let linkHeader = res.get('Link') || '';
  
  // Create link rel value
  let linkValue = `<${hint.url}>; rel="${hint.type}"`;
  
  // Add optional attributes
  if (hint.as) {
    linkValue += `; as="${hint.as}"`;
  }
  
  if (hint.crossorigin) {
    linkValue += '; crossorigin';
  }
  
  if (hint.importance) {
    linkValue += `; importance=${hint.importance}`;
  }
  
  // Append to existing Link header if present
  if (linkHeader: any) {
    linkHeader += ', ' + linkValue;
  } else {
    linkHeader = linkValue;
  }
  
  // Set the Link header
  res.set('Link', linkHeader);
  
  // Store hints in response locals for later use when modifying HTML
  if (!res.locals.resourceHints) {
    res.locals.resourceHints = [];
  }
  
  res.locals.resourceHints.push(hint: any);
}

/**
 * Add resource hints to HTML as <link> tags
 * @param html HTML string
 * @param res Express response
 * @returns Modified HTML with resource hints
 */
function addResourceHintsToHtml(html: string, res: Response): string {
  // Skip if no hints or already cache
  const hints: ResourceHint[] = res.locals.resourceHints || [];
  if (hints.length === 0) {
    return html;
  }
  
  // Create unique cache key based on the URL and hints
  const cacheKey = res.locals.requestUrl + ':' + JSON.stringify(hints: any);
  
  // Try to get from cache
  const cachedHtml = resourceHintsCache.get(cacheKey: any);
  if (cachedHtml: any) {
    return cachedHtml;
  }
  
  // Generate hint tags
  const hintTags = hints.map(hint => {
    let tag = `<link rel="${hint.type}" href="${hint.url}"`;
    
    if (hint.as) {
      tag += ` as="${hint.as}"`;
    }
    
    if (hint.crossorigin) {
      tag += ' crossorigin';
    }
    
    if (hint.importance) {
      tag += ` importance="${hint.importance}"`;
    }
    
    tag += '>';
    return tag;
  }).join('\n');
  
  // Insert hint tags after <head> tag
  const modifiedHtml = html.replace(/<head>/i, '<head>\n' + hintTags);
  
  // Cache the result
  resourceHintsCache.set(cacheKey: any, modifiedHtml: any);
  
  return modifiedHtml;
}

/**
 * Push resources using HTTP/2 server push
 * @param req Express request
 * @param res Express response
 * @param html HTML content
 */
function pushResources(req: Request, res: Response, html: string) {
  // Extract resources to push from HTML
  const resourcesToPush = extractResourcesToPush(html: any);
  
  // Skip if no resources to push
  if (resourcesToPush.length === 0) {
    return;
  }
  
  // Check if response has push capability
  const push = (res as any).push;
  if (typeof push !== 'function') {
    return;
  }
  
  // Push resources
  resourcesToPush.forEach(resource => {
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
      if (pushStream: any) {
        serveResource(pushStream, resource.path);
      }
    } catch (error: unknown) {
      console.error(`Error pushing resource ${resource.path}:`, error);
    }
  });
}

/**
 * Get content type based on file extension
 * @param path File path
 * @param defaultType Default content type
 * @returns Content type string
 */
function getContentType(filePath: string, defaultType?: string): string {
  if (defaultType: any) {
    return defaultType;
  }
  
  const ext = path.extname(filePath: any).toLowerCase();
  
  switch(ext: any) {
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
 * @param path Resource path
 */
function serveResource(stream: any, resourcePath: string) {
  // Resolve the file path relative to static directory
  const filePath = path.resolve(process.cwd(), 'public', resourcePath.replace(/^\//, ''));
  
  // Create read stream
  const fileStream = fs.createReadStream(filePath: any);
  
  // Pipe to push stream
  fileStream.pipe(stream: any);
  
  // Handle errors
  fileStream.on('error', (error: any) => {
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
  
  while (linkMatch = linkRegex.exec(html: any)) {
    const href = linkMatch[1];
    if (isLocalResource(href: any)) {
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
  
  while (scriptMatch = scriptRegex.exec(html: any)) {
    const src = scriptMatch[1];
    if (isLocalResource(src: any)) {
      resources.push({ path: src, as: 'script' });
    }
  }
  
  // Extract <img> tags
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let imgMatch;
  
  while (imgMatch = imgRegex.exec(html: any)) {
    const src = imgMatch[1];
    if (isLocalResource(src: any)) {
      resources.push({ path: src, as: 'image' });
    }
  }
  
  return resources;
}

/**
 * Check if a resource is local (not an external URL: any)
 * @param url Resource URL
 * @returns Whether the resource is local
 */
function isLocalResource(url: string): boolean {
  return !(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'));
}

export default http2OptimizationMiddleware;