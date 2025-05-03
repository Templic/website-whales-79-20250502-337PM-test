/**
 * CSRF-protected fetch utilities
 * 
 * These utilities are used to automatically include CSRF tokens in API requests
 * and handle token validation errors.
 */

import { getCSRFToken, fetchCSRFToken } from './csrfUtils';

/**
 * Error response from CSRF validation failure
 */
interface CSRFErrorResponse {
  error: string;
  code: string;
}

/**
 * Enhanced fetch function that automatically includes CSRF tokens
 * and handles token validation errors by fetching a new token and retrying.
 */
export const csrfFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Prepare headers
  const headers = new Headers(options.headers || {});
  
  // Set default content type if not provided
  if (!headers.has('Content-Type') && !options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Get CSRF token from cookies or storage
  const token = getCSRFToken();
  
  // Add CSRF token to headers if available
  if (token) {
    headers.set('X-CSRF-Token', token);
  }
  
  // Prepare the request with updated headers
  const requestOptions: RequestInit = {
    ...options,
    headers,
    // Ensure credentials are included for cookies
    credentials: 'include'
  };
  
  // Make the request
  let response = await fetch(url, requestOptions);
  
  // Handle CSRF token validation failures (403 with specific error code)
  if (response.status === 403) {
    try {
      const errorData = await response.clone().json() as CSRFErrorResponse;
      
      // If the error is related to CSRF token validation
      if (errorData.code === 'CSRF_ERROR') {
        console.info('CSRF token validation failed, fetching new token and retrying...');
        
        // Get a fresh token from the server
        await fetchCSRFToken();
        
        // Update the token in headers
        const freshToken = getCSRFToken();
        if (freshToken) {
          headers.set('X-CSRF-Token', freshToken);
        }
        
        // Retry the request with the new token
        requestOptions.headers = headers;
        return fetch(url, requestOptions);
      }
    } catch (err) {
      // Not a JSON response or another type of error
      // Continue with the original response
      console.warn('Error parsing CSRF error response:', err);
    }
  }
  
  return response;
};

/**
 * Creates standard Headers object with CSRF token included
 */
export const createCSRFHeaders = (): Headers => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  const token = getCSRFToken();
  if (token) {
    headers.set('X-CSRF-Token', token);
  }
  
  return headers;
};

export default csrfFetch;