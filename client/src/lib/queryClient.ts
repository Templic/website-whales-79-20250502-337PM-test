import { QueryClient } from '@tanstack/react-query';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

// Default fetch function for React Query
export const getQueryFn = <T>(url: string) => 
  async (): Promise<T> => {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
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
  endpoint: string,
  options: ApiRequestOptions = {}
) {
  const { method = 'GET', data, headers = {} } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
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