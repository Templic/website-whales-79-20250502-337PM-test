/**
 * Enhanced CSRF Protection Utilities
 * 
 * Provides a comprehensive set of utilities for handling CSRF tokens
 * in client-side requests with intelligent error handling and token refresh.
 */

// Types
interface CSRFErrorResponse {
  error: string;
  code: string;
  message?: string;
}

interface CSRFTokenResponse {
  csrfToken: string;
}

/**
 * CSRF Token Management Class
 * A singleton class that handles all CSRF token operations
 */
class CSRFTokenManager {
  private token: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private tokenExpiryTime: number = 0;
  private tokenEndpoint = '/api/csrf-token';
  private tokenHeaderName = 'X-CSRF-Token';
  private tokenLifetime = 1000 * 60 * 60 * 2; // 2 hours (default)
  
  // Get the current CSRF token (from memory or cookie)
  public getToken(): string | null {
    // First check memory cache
    if (this.token) {
      return this.token;
    }
    
    // Then check cookies
    return this.getTokenFromCookies();
  }
  
  // Get token from cookies
  private getTokenFromCookies(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token' || name === '_csrf') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
  
  // Fetch a new token from the server
  public async fetchToken(): Promise<string> {
    // If a token refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    // Create new refresh promise
    this.refreshPromise = this.doFetchToken();
    
    try {
      // Wait for the token and return it
      const token = await this.refreshPromise;
      return token;
    } finally {
      // Clear the refresh promise when done
      this.refreshPromise = null;
    }
  }
  
  // Actual token fetch implementation
  private async doFetchToken(): Promise<string> {
    try {
      const response = await fetch(this.tokenEndpoint, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as CSRFTokenResponse;
      this.token = data.csrfToken;
      this.tokenExpiryTime = Date.now() + this.tokenLifetime;
      
      // For debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('CSRF token refreshed');
      }
      
      return this.token;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      // In development, we don't want to break functionality due to CSRF
      if (process.env.NODE_ENV === 'development') {
        this.token = 'dev-csrf-token';
        return this.token;
      }
      throw error;
    }
  }
  
  // Check if token needs refresh
  public needsRefresh(): boolean {
    return !this.token || Date.now() > this.tokenExpiryTime;
  }
  
  // Create headers with CSRF token included
  public createHeaders(headers?: HeadersInit): Headers {
    const newHeaders = new Headers(headers || {});
    
    // Set default content type if not already set
    if (!newHeaders.has('Content-Type')) {
      newHeaders.set('Content-Type', 'application/json');
    }
    
    // Add CSRF token if available
    const token = this.getToken();
    if (token) {
      newHeaders.set(this.tokenHeaderName, token);
    }
    
    return newHeaders;
  }
}

// Create singleton instance
const tokenManager = new CSRFTokenManager();

/**
 * Enhanced fetch function with automatic CSRF token inclusion
 * and intelligent error handling with token refresh
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Check if token needs refreshing
  if (tokenManager.needsRefresh()) {
    await tokenManager.fetchToken();
  }
  
  // Prepare headers with token
  const headers = tokenManager.createHeaders(options.headers);
  
  // Create request options
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  };
  
  // Make request
  try {
    const response = await fetch(url, requestOptions);
    
    // Handle CSRF validation failures (403 with specific error code)
    if (response.status === 403) {
      try {
        const errorData = await response.clone().json() as CSRFErrorResponse;
        
        // If error is related to CSRF token
        if (errorData.code === 'CSRF_ERROR') {
          // Fetch a new token
          await tokenManager.fetchToken();
          
          // Update headers with new token
          const newHeaders = tokenManager.createHeaders(options.headers);
          
          // Retry the request with new token
          return fetch(url, {
            ...options,
            headers: newHeaders,
            credentials: 'include'
          });
        }
      } catch (err) {
        // Not a JSON response or other error
        // Continue with original response
      }
    }
    
    return response;
  } catch (error) {
    // Log the error
    console.error(`CSRF fetch error on ${url}:`, error);
    throw error;
  }
}

/**
 * Create fetch-compatible headers with CSRF token
 */
export function createCSRFHeaders(headers?: HeadersInit): Headers {
  return tokenManager.createHeaders(headers);
}

/**
 * Manually refresh the CSRF token
 */
export function refreshCSRFToken(): Promise<string> {
  return tokenManager.fetchToken();
}

/**
 * Initialize CSRF protection - call this early in your application
 */
export async function initializeCSRFProtection(): Promise<void> {
  try {
    await tokenManager.fetchToken();
  } catch (e) {
    // In production, log the error but don't break the app
    console.warn('Failed to initialize CSRF protection:', e);
  }
}

export default csrfFetch;