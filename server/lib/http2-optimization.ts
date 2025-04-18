/**
 * HTTP/2 Optimization Utilities
 * 
 * Utilities for optimizing performance with HTTP/2, including server push,
 * resource hints, prioritization, and connection management.
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Resource types for server push
 */
export type ResourceType = 
  | 'script'
  | 'style'
  | 'image'
  | 'font'
  | 'video'
  | 'audio'
  | 'document'
  | 'manifest'
  | 'other';

/**
 * Resource definition for HTTP/2 server push
 */
export interface PushResource {
  /** Path to the resource */
  path: string;
  /** Type of resource */
  type: ResourceType;
  /** Whether the resource is critical for rendering */
  critical?: boolean;
  /** Custom cache directive */
  cache?: string;
  /** Priority level */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * HTTP/2 Server Push Configuration
 */
export interface ServerPushConfig {
  /** Base path for resolving relative paths */
  basePath?: string;
  /** Resources to push for all requests */
  globalResources?: PushResource[];
  /** Resource mapping by route pattern */
  routeResources?: Record<string, PushResource[]>;
  /** Maximum number of resources to push per request */
  maxResources?: number;
  /** Whether to use preload instead of server push */
  usePreloadHeader?: boolean;
  /** Whether to add the nopush attribute to preload headers */
  noPush?: boolean;
  /** Whether to include a Vary header */
  includeVaryHeader?: boolean;
  /** Custom options for push streams */
  streamOptions?: {
    /** End stream after pushing resource */
    endStream?: boolean;
    /** Custom HTTP headers */
    headers?: Record<string, string>;
  };
}

/**
 * Resource hints definition
 */
export interface ResourceHints {
  /** Resources to preload */
  preload?: string[];
  /** Resources to prefetch */
  prefetch?: string[];
  /** Resources to preconnect */
  preconnect?: string[];
  /** Resources to dns-prefetch */
  dnsPrefetch?: string[];
  /** Resources to prerender */
  prerender?: string[];
  /** Whether to apply the crossorigin attribute to all hints */
  crossorigin?: boolean;
}

/**
 * Default server push configuration
 */
const defaultPushConfig: ServerPushConfig = {
  basePath: './public',
  maxResources: 15,
  usePreloadHeader: true,
  noPush: false,
  includeVaryHeader: true
};

/**
 * Cache for resource existence checks
 */
const resourceCache = new Map<string, boolean>();

/**
 * Map of content types by resource type
 */
const contentTypeMap: Record<ResourceType, string> = {
  script: 'application/javascript',
  style: 'text/css',
  image: 'image/jpeg', // Default, will be overridden based on extension
  font: 'font/woff2',  // Default, will be overridden based on extension
  video: 'video/mp4',
  audio: 'audio/mpeg',
  document: 'text/html',
  manifest: 'application/manifest+json',
  other: 'application/octet-stream'
};

/**
 * Map of file extensions to content types
 */
const extensionMap: Record<string, string> = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.html': 'text/html',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json'
};

/**
 * Check if a resource exists on the filesystem
 * @param filePath Path to the resource
 * @param basePath Base path for resolving relative paths
 * @returns Whether the resource exists
 */
function resourceExists(filePath: string, basePath: string): boolean {
  const cacheKey = `${basePath}:${filePath}`;
  
  // Check cache first
  if (resourceCache.has(cacheKey)) {
    return resourceCache.get(cacheKey) || false;
  }
  
  // Handle URL paths
  let normalizedPath = filePath;
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1);
  }
  
  const fullPath = path.join(basePath, normalizedPath);
  
  try {
    // Check if file exists
    const exists = fs.existsSync(fullPath);
    resourceCache.set(cacheKey, exists);
    
    // Limit cache size
    if (resourceCache.size > 1000) {
      const keys = Array.from(resourceCache.keys());
      resourceCache.delete(keys[0]);
    }
    
    return exists;
  } catch (error) {
    console.error(`Error checking if resource exists: ${fullPath}`, error);
    return false;
  }
}

/**
 * Get the content type for a resource
 * @param resource Resource definition
 * @returns Content type for the resource
 */
function getContentType(resource: PushResource): string {
  const extension = path.extname(resource.path).toLowerCase();
  
  // Use extension mapping if available
  if (extension && extensionMap[extension]) {
    return extensionMap[extension];
  }
  
  // Fallback to resource type mapping
  return contentTypeMap[resource.type];
}

/**
 * Get the as attribute for a resource
 * @param resource Resource definition
 * @returns As attribute for the resource
 */
function getAsAttribute(resource: PushResource): string {
  return resource.type;
}

/**
 * Get resources to push for a request
 * @param req HTTP request
 * @param config Server push configuration
 * @returns Array of resources to push
 */
function getResourcesToPush(req: Request, config: ServerPushConfig): PushResource[] {
  const resources: PushResource[] = [...(config.globalResources || [])];
  
  // Add route-specific resources
  if (config.routeResources) {
    const url = req.originalUrl || req.url;
    
    // Find matching route patterns
    Object.entries(config.routeResources).forEach(([pattern, routeResources]) => {
      // Simple string match
      if (pattern === url) {
        resources.push(...routeResources);
      }
      // Regex pattern match
      else if (pattern.includes('*') || pattern.includes(':')) {
        const regexPattern = pattern
          .replace(/\*/g, '.*')
          .replace(/:\w+/g, '[^/]+');
        
        if (new RegExp(`^${regexPattern}$`).test(url)) {
          resources.push(...routeResources);
        }
      }
    });
  }
  
  // Filter and sort resources
  return resources
    // Filter to only existing resources
    .filter(resource => resourceExists(resource.path, config.basePath || './public'))
    // Sort by priority and critical flag
    .sort((a, b) => {
      const aPriority = a.critical ? 3 : (a.priority === 'high' ? 2 : (a.priority === 'medium' ? 1 : 0));
      const bPriority = b.critical ? 3 : (b.priority === 'high' ? 2 : (b.priority === 'medium' ? 1 : 0));
      return bPriority - aPriority;
    })
    // Limit to max resources
    .slice(0, config.maxResources || 15);
}

/**
 * Create resource hints for HTTP headers
 * @param resources Resources to include in hints
 * @param config Server push configuration
 * @returns Resource hint headers
 */
function createResourceHints(resources: PushResource[], config: ServerPushConfig): Record<string, string> {
  if (!resources.length) {
    return {};
  }
  
  // Create Link header
  const linkValues = resources.map(resource => {
    const contentType = getContentType(resource);
    const asAttribute = getAsAttribute(resource);
    
    let link = `<${resource.path}>; rel=preload; as=${asAttribute}; type=${contentType}`;
    
    if (resource.priority) {
      link += `; importance=${resource.priority}`;
    }
    
    if (config.noPush) {
      link += '; nopush';
    }
    
    if (resource.type === 'font') {
      link += '; crossorigin=anonymous';
    }
    
    return link;
  });
  
  return {
    'Link': linkValues.join(', ')
  };
}

/**
 * Perform HTTP/2 server push for resources
 * @param res HTTP response
 * @param resources Resources to push
 * @param config Server push configuration
 */
function pushResources(res: Response, resources: PushResource[], config: ServerPushConfig): void {
  // Skip if not HTTP/2 or no push method available
  // @ts-ignore - http2 property may not be defined in typings
  if (!res.push) {
    return;
  }
  
  resources.forEach(resource => {
    try {
      const contentType = getContentType(resource);
      
      // Determine cache control header based on resource type and criticality
      let cacheControl = resource.cache;
      if (!cacheControl) {
        if (resource.critical) {
          cacheControl = 'public, max-age=31536000, immutable';
        } else {
          cacheControl = 'public, max-age=86400';
        }
      }
      
      // @ts-ignore - http2 property may not be defined in typings
      const pushStream = res.push(resource.path, {
        status: 200,
        method: 'GET',
        request: {
          accept: '*/*'
        },
        response: {
          'content-type': contentType,
          'cache-control': cacheControl,
          'x-pushed': 'true'
        },
        ...(config.streamOptions || {})
      });
      
      // Handle the pushed stream
      if (pushStream) {
        const filePath = path.join(config.basePath || './public', resource.path.startsWith('/') ? resource.path.substring(1) : resource.path);
        
        fs.readFile(filePath, (err, data) => {
          if (err) {
            console.error(`Error reading file for HTTP/2 push: ${filePath}`, err);
            pushStream.end();
          } else {
            pushStream.end(data);
          }
        });
      }
    } catch (error) {
      console.error(`Error pushing resource: ${resource.path}`, error);
    }
  });
}

/**
 * Create HTTP/2 server push middleware
 * @param config Server push configuration
 * @returns Express middleware for HTTP/2 server push
 */
export function createServerPushMiddleware(config: ServerPushConfig = {}) {
  const finalConfig = { ...defaultPushConfig, ...config };
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Get resources to push for this request
    const resources = getResourcesToPush(req, finalConfig);
    
    if (resources.length > 0) {
      // Add Vary header if configured
      if (finalConfig.includeVaryHeader) {
        res.setHeader('Vary', 'Accept');
      }
      
      if (finalConfig.usePreloadHeader) {
        // Use Link header for preloading
        const headers = createResourceHints(resources, finalConfig);
        Object.entries(headers).forEach(([name, value]) => {
          res.setHeader(name, value);
        });
      } else {
        // Use HTTP/2 server push
        // @ts-ignore - http2 property may not be defined in typings
        if (res.push) {
          pushResources(res, resources, finalConfig);
        }
      }
    }
    
    next();
  };
}

/**
 * Create middleware to add resource hints to responses
 * @param hints Resource hints configuration
 * @returns Express middleware for adding resource hints
 */
export function createResourceHintsMiddleware(hints: ResourceHints = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const linkValues: string[] = [];
    
    // Add preload hints
    if (hints.preload && hints.preload.length) {
      hints.preload.forEach(resource => {
        const ext = path.extname(resource);
        const type = ext && extensionMap[ext] ? extensionMap[ext] : 'application/octet-stream';
        const as = ext === '.css' ? 'style' : (ext === '.js' ? 'script' : 'fetch');
        
        let hint = `<${resource}>; rel=preload; as=${as}; type=${type}`;
        if (hints.crossorigin || as === 'font') {
          hint += '; crossorigin=anonymous';
        }
        
        linkValues.push(hint);
      });
    }
    
    // Add prefetch hints
    if (hints.prefetch && hints.prefetch.length) {
      hints.prefetch.forEach(resource => {
        let hint = `<${resource}>; rel=prefetch`;
        if (hints.crossorigin) {
          hint += '; crossorigin=anonymous';
        }
        
        linkValues.push(hint);
      });
    }
    
    // Add preconnect hints
    if (hints.preconnect && hints.preconnect.length) {
      hints.preconnect.forEach(resource => {
        let hint = `<${resource}>; rel=preconnect`;
        if (hints.crossorigin) {
          hint += '; crossorigin=anonymous';
        }
        
        linkValues.push(hint);
      });
    }
    
    // Add dns-prefetch hints
    if (hints.dnsPrefetch && hints.dnsPrefetch.length) {
      hints.dnsPrefetch.forEach(resource => {
        linkValues.push(`<${resource}>; rel=dns-prefetch`);
      });
    }
    
    // Add prerender hints
    if (hints.prerender && hints.prerender.length) {
      hints.prerender.forEach(resource => {
        linkValues.push(`<${resource}>; rel=prerender`);
      });
    }
    
    // Add Link header if there are any hints
    if (linkValues.length) {
      res.setHeader('Link', linkValues.join(', '));
    }
    
    next();
  };
}

/**
 * Create middleware to optimize HTTP/2 connection management
 * @returns Express middleware for HTTP/2 connection management
 */
export function createHttp2ConnectionOptimizer() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply to HTTP/2 connections
    if (req.httpVersion === '2.0') {
      // Add HTTP/2-specific headers
      res.setHeader('X-Protocol', 'HTTP/2');
      
      // Disable keepalive for HTTP/2
      res.setHeader('Connection', '');
      
      // Set HPACK compression hints
      res.setHeader('X-HPACK-Compress', '1');
    }
    
    next();
  };
}

/**
 * Create middleware to prioritize HTTP/2 streams
 * @returns Express middleware for HTTP/2 stream prioritization
 */
export function createHttp2PriorityMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply to HTTP/2 connections
    if (req.httpVersion === '2.0') {
      // @ts-ignore - http2 property may not be defined in typings
      if (res.stream && res.stream.priority) {
        const url = req.originalUrl || req.url;
        
        // Apply different priorities based on resource type
        if (url.match(/\.(css|js)$/)) {
          // Prioritize critical CSS and JS
          // @ts-ignore
          res.stream.priority({
            exclusive: false,
            parent: 0,
            weight: 32,
            silent: false
          });
        } else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          // Lower priority for images
          // @ts-ignore
          res.stream.priority({
            exclusive: false,
            parent: 0,
            weight: 16,
            silent: false
          });
        } else if (url.match(/\.(woff2|woff|ttf|otf)$/)) {
          // Medium priority for fonts
          // @ts-ignore
          res.stream.priority({
            exclusive: false,
            parent: 0,
            weight: 24,
            silent: false
          });
        }
      }
    }
    
    next();
  };
}

/**
 * Create full HTTP/2 optimization middleware stack
 * @param pushConfig Server push configuration
 * @param hints Resource hints configuration
 * @returns Array of Express middleware for HTTP/2 optimization
 */
export function createHttp2OptimizationMiddleware(
  pushConfig?: ServerPushConfig,
  hints?: ResourceHints
) {
  return [
    createHttp2ConnectionOptimizer(),
    createHttp2PriorityMiddleware(),
    createServerPushMiddleware(pushConfig),
    createResourceHintsMiddleware(hints)
  ];
}