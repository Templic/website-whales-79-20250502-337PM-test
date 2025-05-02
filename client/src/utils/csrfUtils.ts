/**
 * CSRF Protection Utilities
 * 
 * Client-side utilities for handling CSRF tokens in API requests
 */

/**
 * Get the CSRF token from cookies
 */
export function getCSRFToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Interface for CSRF Token API response
 */
interface CSRFTokenResponse {
  csrfToken: string;
}

/**
 * Fetch a fresh CSRF token from the server
 */
export async function fetchCSRFToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token');
    const data = await response.json() as CSRFTokenResponse;
    return data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Create headers with CSRF token for fetch requests
 */
export function createCSRFHeaders(): HeadersInit {
  const csrfToken = getCSRFToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
}

/**
 * Interface for CSRF error response
 */
interface CSRFErrorResponse {
  error: string;
  code: string;
}

/**
 * API client that automatically includes CSRF token
 */
export const csrfFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Get CSRF token from cookies
  const csrfToken = getCSRFToken();
  
  // Setup headers
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  // Include CSRF token if available
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  
  // Create new options with updated headers
  const newOptions: RequestInit = {
    ...options,
    headers
  };
  
  // Make the request
  const response = await fetch(url, newOptions);
  
  // Handle CSRF token errors (403 with special error code)
  if (response.status === 403) {
    try {
      const errorData = await response.clone().json() as CSRFErrorResponse;
      
      if (errorData.code === 'CSRF_ERROR') {
        // Token is invalid or expired, fetch a new one and retry the request
        await fetchCSRFToken();
        
        // Update the CSRF token for the retry
        const newToken = getCSRFToken();
        if (newToken) {
          headers.set('X-CSRF-Token', newToken);
        }
        
        // Retry the request
        return fetch(url, {
          ...newOptions,
          headers
        });
      }
    } catch (e) {
      // Not a JSON response or other error, just continue
    }
  }
  
  return response;
};

/**
 * Example usage:
 * 
 * // Use with fetch API
 * fetch('/api/users', {
 *   method: 'POST',
 *   headers: createCSRFHeaders(),
 *   body: JSON.stringify({ name: 'John' })
 * });
 * 
 * // Or use the csrfFetch helper
 * csrfFetch('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 */