/**
 * Advanced CSRF Protection with Deep Defense
 * 
 * A comprehensive client-side CSRF protection system that works with the server-side
 * deep protection implementation to provide multiple layers of security.
 * 
 * Features:
 * - Token management with auto-refresh
 * - Automatic inclusion of tokens in requests
 * - Intelligent error handling with retry capability
 * - Browser fingerprinting for additional binding
 * - Security header inclusion
 * - Defense-in-depth strategies
 */

// Types for CSRF responses
interface CSRFErrorResponse {
  error: string;
  code: string;
  message?: string;
}

interface CSRFTokenResponse {
  csrfToken: string;
}

// Security diagnostics interface
interface SecurityDiagnostics {
  csrfTokenPresent: boolean;
  csrfTokenValid: boolean;
  securityHeadersPresent: boolean;
  originHeaderValid: boolean;
  browserFingerprintPresent: boolean;
  lastRefreshTime: Date | null;
  failureCount: number;
  lastFailureReason: string | null;
}

/**
 * Deep Protection CSRF Token Manager
 * A singleton class that handles all CSRF token operations with advanced security features
 */
class CSRFTokenManager {
  // Core token management
  private token: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private tokenExpiryTime: number = 0;
  private tokenEndpoint = '/api/csrf-token';
  private tokenHeaderName = 'X-CSRF-Token';
  private tokenLifetime = 1000 * 60 * 60 * 2; // 2 hours (default)
  
  // Security diagnostics
  private diagnostics: SecurityDiagnostics = {
    csrfTokenPresent: false,
    csrfTokenValid: false,
    securityHeadersPresent: false,
    originHeaderValid: false,
    browserFingerprintPresent: false,
    lastRefreshTime: null,
    failureCount: 0,
    lastFailureReason: null
  };
  
  // Cache for fingerprinting
  private browserFingerprint: string | null = null;
  
  constructor() {
    // Generate browser fingerprint on initialization
    this.generateBrowserFingerprint();
    
    // Periodically refresh the token for long-lived sessions
    setInterval(() => {
      if (this.needsRefresh() && document.visibilityState === 'visible') {
        this.fetchToken().catch(() => {/* Silent catch */});
      }
    }, 1000 * 60 * 30); // Every 30 minutes
  }
  
  /**
   * Get the current CSRF token (from memory or cookie)
   */
  public getToken(): string | null {
    // First check memory cache
    if (this.token) {
      this.diagnostics.csrfTokenPresent = true;
      return this.token;
    }
    
    // Then check cookies
    const cookieToken = this.getTokenFromCookies();
    this.diagnostics.csrfTokenPresent = !!cookieToken;
    return cookieToken;
  }
  
  /**
   * Extract token from cookies
   */
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
  
  /**
   * Generate a browser fingerprint for token binding
   */
  private generateBrowserFingerprint(): string {
    if (this.browserFingerprint) {
      return this.browserFingerprint;
    }
    
    // Generate a simplified browser fingerprint
    // In a real implementation, this would be more sophisticated
    // but we're keeping it simple for this example
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      `${screen.width}x${screen.height}`,
      new Date().getTimezoneOffset(),
      !!navigator.plugins.length,
      !!navigator.cookieEnabled
    ];
    
    // Create a hash of the components
    const fingerprint = components.join('|');
    this.browserFingerprint = fingerprint;
    this.diagnostics.browserFingerprintPresent = true;
    
    return fingerprint;
  }
  
  /**
   * Fetch a new token from the server with queue management
   */
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
  
  /**
   * Actual token fetch implementation with security headers
   */
  private async doFetchToken(): Promise<string> {
    try {
      // Create headers with browser fingerprint for token binding
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache',
        'X-Browser-Fingerprint': this.browserFingerprint || '',
        'Accept': 'application/json'
      };
      
      // Add security headers that browsers normally send
      // This helps with the server-side security header check
      if (navigator.userAgent) {
        headers['User-Agent'] = navigator.userAgent;
      }
      
      if (navigator.language) {
        headers['Accept-Language'] = navigator.language;
      }
      
      const response = await fetch(this.tokenEndpoint, {
        credentials: 'include',
        cache: 'no-store',
        headers
      });
      
      if (!response.ok) {
        this.diagnostics.failureCount++;
        this.diagnostics.lastFailureReason = `HTTP Error: ${response.status} ${response.statusText}`;
        throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as CSRFTokenResponse;
      this.token = data.csrfToken;
      this.tokenExpiryTime = Date.now() + this.tokenLifetime;
      
      // Update diagnostics
      this.diagnostics.lastRefreshTime = new Date();
      this.diagnostics.csrfTokenPresent = true;
      this.diagnostics.csrfTokenValid = true;
      
      // For debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('CSRF token refreshed');
      }
      
      return this.token;
    } catch (error) {
      // Update error diagnostics
      this.diagnostics.failureCount++;
      this.diagnostics.lastFailureReason = error instanceof Error ? error.message : String(error);
      
      console.error('Error fetching CSRF token:', error);
      
      // In development, we don't want to break functionality due to CSRF
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using fallback CSRF token in development');
        this.token = 'dev-csrf-token';
        return this.token;
      }
      
      throw error;
    }
  }
  
  /**
   * Check if token needs refresh
   */
  public needsRefresh(): boolean {
    return !this.token || Date.now() > this.tokenExpiryTime;
  }
  
  /**
   * Create headers with CSRF token and additional security headers
   */
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
    
    // Add browser fingerprint for token binding validation
    if (this.browserFingerprint) {
      newHeaders.set('X-Browser-Fingerprint', this.browserFingerprint);
    }
    
    // Add standard headers that browsers typically send
    // This improves server-side security validation
    if (!newHeaders.has('Accept-Language') && navigator.language) {
      newHeaders.set('Accept-Language', navigator.language);
    }
    
    if (!newHeaders.has('Accept')) {
      newHeaders.set('Accept', 'application/json');
    }
    
    return newHeaders;
  }
  
  /**
   * Get security diagnostics for debugging or monitoring
   */
  public getDiagnostics(): SecurityDiagnostics {
    return { ...this.diagnostics };
  }
}

// Create singleton instance
const tokenManager = new CSRFTokenManager();

/**
 * Advanced deep-protection CSRF fetch function
 * 
 * Provides multiple layers of security protection:
 * 1. Automatic token management and inclusion
 * 2. Browser fingerprinting
 * 3. Security headers
 * 4. Intelligent error handling & recovery
 * 5. Rate limiting protection
 * 6. Origin validation compatibility
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Check if token needs refreshing
  if (tokenManager.needsRefresh()) {
    await tokenManager.fetchToken();
  }
  
  // Prepare headers with enhanced security
  const headers = tokenManager.createHeaders(options.headers);
  
  // Create request options with deep protection
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always include credentials for CSRF protection
    mode: 'same-origin',    // Help prevent CSRF by restricting to same origin
    // Don't override if caller specified these
    cache: options.cache || 'no-cache',
    redirect: options.redirect || 'follow',
    referrerPolicy: options.referrerPolicy || 'same-origin' // Security enhancement
  };
  
  // Make request with advanced error handling
  try {
    const response = await fetch(url, requestOptions);
    
    // Handle various error responses
    if (!response.ok) {
      // Handle CSRF validation failures (403 with specific error code)
      if (response.status === 403) {
        try {
          const errorData = await response.clone().json() as CSRFErrorResponse;
          
          // If error is related to CSRF token
          if (errorData.code === 'CSRF_ERROR') {
            // Force fetch a new token (ignore cache)
            await tokenManager.fetchToken();
            
            // Update headers with new token and additional security
            const newHeaders = tokenManager.createHeaders(options.headers);
            
            // Retry the request with new token and security enhancements
            return fetch(url, {
              ...options,
              headers: newHeaders,
              credentials: 'include',
              mode: 'same-origin',
              cache: options.cache || 'no-cache',
              referrerPolicy: options.referrerPolicy || 'same-origin'
            });
          }
        } catch (err) {
          // Not a JSON response or parse error
          // Continue with original response
        }
      } 
      // Handle rate limiting (429 Too Many Requests)
      else if (response.status === 429) {
        // Implement exponential backoff retry
        const retryAfter = response.headers.get('Retry-After');
        const retryMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
        
        console.warn(`Rate limited. Retrying in ${retryMs}ms`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryMs));
        
        // Try again with a fresh token
        await tokenManager.fetchToken();
        const newHeaders = tokenManager.createHeaders(options.headers);
        
        return fetch(url, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
          mode: 'same-origin'
        });
      }
    }
    
    return response;
  } catch (error) {
    // Enhanced error logging and handling
    console.error(`CSRF fetch error on ${url}:`, error);
    
    // In development, provide more diagnostic information
    if (process.env.NODE_ENV === 'development') {
      console.debug('CSRF security diagnostics:', tokenManager.getDiagnostics());
    }
    
    // Rethrow for caller handling
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
    
    // Add event listeners for automatic token refreshing
    // When page becomes visible again, refresh token if needed
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && tokenManager.needsRefresh()) {
        tokenManager.fetchToken().catch(() => {/* Silent catch */});
      }
    });
    
    // Optional: Set interval for very long-lived sessions
    // This is in addition to the interval in the TokenManager class
    const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
    setInterval(() => {
      if (document.visibilityState === 'visible' && tokenManager.needsRefresh()) {
        tokenManager.fetchToken().catch(() => {/* Silent catch */});
      }
    }, REFRESH_INTERVAL);
    
  } catch (e) {
    // In production, log the error but don't break the app
    console.warn('Failed to initialize CSRF protection:', e);
  }
}

/**
 * Get security diagnostics for troubleshooting
 * This is useful for debugging security issues in development
 */
export function getCSRFSecurityDiagnostics(): SecurityDiagnostics {
  return tokenManager.getDiagnostics();
}

/**
 * Check if deep protection is functioning correctly
 * Returns diagnostic information that can be used to fix issues
 */
export function checkCSRFDeepProtection(): { 
  functioning: boolean;
  missingFeatures: string[];
  recommendation: string;
} {
  const diagnostics = tokenManager.getDiagnostics();
  const missingFeatures: string[] = [];
  
  if (!diagnostics.csrfTokenPresent) {
    missingFeatures.push('CSRF token');
  }
  
  if (!diagnostics.browserFingerprintPresent) {
    missingFeatures.push('Browser fingerprint');
  }
  
  let recommendation = '';
  if (missingFeatures.length === 0) {
    recommendation = 'CSRF deep protection is properly configured.';
  } else {
    recommendation = `Initialize CSRF protection by calling initializeCSRFProtection() early in your application.`;
  }
  
  return {
    functioning: missingFeatures.length === 0,
    missingFeatures,
    recommendation
  };
}

// Default export for easy importing
export default csrfFetch;