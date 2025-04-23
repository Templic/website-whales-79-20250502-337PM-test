/**
 * Secure API Client
 * 
 * This client automatically handles CSRF tokens, authentication,
 * and provides proper error handling for API requests.
 */

import { apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';

// Type for API request options
interface ApiRequestOptions {
  headers?: Record<string, string>;
  abortSignal?: AbortSignal;
  withCredentials?: boolean;
}

// Type for API response
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  headers: Headers;
}

// CSRF token storage
let csrfToken: string | null = null;

/**
 * Get the current CSRF token from the document cookies
 */
function getCsrfTokenFromCookies(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'X-CSRF-Token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Get the current CSRF token, either from memory or from cookies
 */
function getCsrfToken(): string | null {
  if (!csrfToken) {
    csrfToken = getCsrfTokenFromCookies();
  }
  return csrfToken;
}

/**
 * Set the CSRF token in memory
 */
function setCsrfToken(token: string): void {
  csrfToken = token;
}

/**
 * Make a secure API request with CSRF token handling
 */
export async function secureApiRequest<T = any>(
  method: string,
  url: string,
  data?: any,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> {
  try {
    // Get the current CSRF token
    const token = getCsrfToken();
    
    // Create headers with CSRF token if available
    const headers: Record<string, string> = {
      ...(options?.headers || {}),
    };
    
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    
    // Make the API request
    const response = await apiRequest(
      method,
      url,
      data,
      {
        ...options,
        headers
      }
    );
    
    // Check for a new CSRF token in the response headers
    const newToken = response.headers.get('X-CSRF-Token');
    if (newToken) {
      setCsrfToken(newToken);
    }
    
    // Parse the response body
    const responseData = await response.json();
    
    // Check if the request was successful
    if (!response.ok) {
      // Check if the error is a CSRF token error
      if (response.status === 403 && responseData.code?.startsWith('CSRF_TOKEN')) {
        // Refresh the page to get a new CSRF token
        window.location.reload();
        
        throw new Error('Session expired. Refreshing the page...');
      }
      
      // Handle other errors
      throw new Error(responseData.message || 'An unknown error occurred');
    }
    
    // Return the successful response
    return {
      data: responseData,
      error: null,
      status: response.status,
      headers: response.headers
    };
  } catch (error: unknown) {
    // Return the error response
    return {
      data: null,
      error: (error as Error).message,
      status: 0,
      headers: new Headers()
    };
  }
}

/**
 * React hook for making secure API requests
 */
export function useSecureApi() {
  const { toast } = useToast();
  
  /**
   * Make a secure API request with automatic error toasts
   */
  const request = async <T = any>(
    method: string,
    url: string,
    data?: any,
    options?: ApiRequestOptions & { showErrorToast?: boolean }
  ): Promise<ApiResponse<T>> => {
    const showErrorToast = options?.showErrorToast !== false;
    const response = await secureApiRequest<T>(method, url, data, options);
    
    if (response.error && showErrorToast) {
      toast({
        title: 'API Error',
        description: response.error,
        variant: 'destructive'
      });
    }
    
    return response;
  };
  
  return {
    get: <T = any>(url: string, options?: ApiRequestOptions & { showErrorToast?: boolean }) => 
      request<T>('GET', url, undefined, options),
    post: <T = any>(url: string, data?: any, options?: ApiRequestOptions & { showErrorToast?: boolean }) => 
      request<T>('POST', url, data, options),
    put: <T = any>(url: string, data?: any, options?: ApiRequestOptions & { showErrorToast?: boolean }) => 
      request<T>('PUT', url, data, options),
    patch: <T = any>(url: string, data?: any, options?: ApiRequestOptions & { showErrorToast?: boolean }) => 
      request<T>('PATCH', url, data, options),
    delete: <T = any>(url: string, options?: ApiRequestOptions & { showErrorToast?: boolean }) => 
      request<T>('DELETE', url, undefined, options)
  };
}

/**
 * Client-side wrapper for generating an anti-CSRF form field
 */
export function CsrfFormField(): JSX.Element {
  const token = getCsrfToken();
  
  if (!token) {
    return <></>;
  }
  
  return <input type="hidden" name="_csrf" value={token} />;
}

// Default export for convenience
export default useSecureApi;