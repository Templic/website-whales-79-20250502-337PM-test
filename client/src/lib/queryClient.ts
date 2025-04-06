import { QueryClient } from '@tanstack/react-query';

interface ApiRequestOptions {
  headers?: Record<string, string>;
  skipCsrfToken?: boolean;
}

// Store the CSRF token
let csrfToken: string | null = null;

// Function to fetch CSRF token
export async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  
  try {
    // Use development/test mode check to bypass CSRF in development
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      console.log('Development mode detected, using empty CSRF token');
      return '';
    }
    
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
      // Adding cache: 'no-store' to prevent caching issues
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.warn('Failed to fetch CSRF token, status:', response.status);
      // Return empty string instead of throwing to allow the request to proceed without CSRF
      return '';
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken || '';
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    // Return empty string instead of throwing to allow the request to proceed without CSRF
    return '';
  }
}

// Default fetch function for React Query
export const getQueryFn = <T>({ 
  on401 = "throw" 
}: { 
  on401?: "throw" | "returnNull" 
} = {}) => 
  async ({ queryKey }: { queryKey: unknown[] }): Promise<T> => {
    const url = queryKey[0] as string;
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Special handling for unauthorized requests based on configuration
    if (response.status === 401 && on401 === "returnNull") {
      return null as unknown as T;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  };

// Default fetch function for API requests
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  options: Omit<ApiRequestOptions, 'method' | 'data'> = {}
) {
  const { headers = {}, skipCsrfToken = false } = options;

  // Only add CSRF token for mutation requests (non-GET)
  if (method !== 'GET' && !skipCsrfToken && endpoint.startsWith('/api')) {
    try {
      // Get CSRF token
      const token = await fetchCsrfToken();
      headers['X-CSRF-Token'] = token;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      // Continue with the request even if CSRF token fetching fails
    }
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, config);

    // Handle HTTP errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'An error occurred');
    }

    // Return null for empty responses
    if (response.status === 204) {
      return null;
    }

    // Parse JSON response
    try {
      return await response.json();
    } catch (error) {
      // Return raw response if JSON parsing fails
      return response;
    }
  } catch (error) {
    console.error("API request failed:", error); // Log the error for debugging
    throw new Error(error instanceof Error ? error.message : "Failed to fetch data from API."); 
  }
}

// Create and configure QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default queryClient;