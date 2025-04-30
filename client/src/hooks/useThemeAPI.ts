/**
 * Theme API Hook
 * 
 * This hook provides methods for interacting with the Theme API endpoints.
 * It encapsulates all the API calls needed for theme operations including:
 * - Fetching themes (all, public, user-specific)
 * - Creating, updating, and deleting themes
 * - Recording theme usage and events
 * - Getting analytics data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Theme, ThemeAnalytic } from '../../shared/schema';

// Define the return type for the usage report
interface ThemeUsageReport {
  mostUsedThemes: Array<{ themeId: number; name: string; applications: number }>;
  topRatedThemes: Array<{ themeId: number; name: string; sentiment: number }>;
  averageUsageTime: number;
  totalUniqueUsers: number;
}

export function useThemeAPI() {
  const queryClient = useQueryClient();
  
  // All public themes
  const usePublicThemes = () => {
    return useQuery({ 
      queryKey: ['/api/themes/public'],
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  // User's themes
  const useUserThemes = (userId: string) => {
    return useQuery({ 
      queryKey: ['/api/themes/user', userId],
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  // Get specific theme
  const useTheme = (id: number) => {
    return useQuery<Theme>({ 
      queryKey: ['/api/themes', id],
      enabled: !!id,
    });
  };
  
  // Create theme
  const useCreateTheme = () => {
    return useMutation({
      mutationFn: (newTheme: Partial<Theme>) => {
        return apiRequest('/api/themes', { method: 'POST', data: newTheme });
      },
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/themes/public'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes/user'] });
      },
    });
  };
  
  // Update theme
  const useUpdateTheme = () => {
    return useMutation({
      mutationFn: ({ id, theme }: { id: number; theme: Partial<Theme> }) => {
        return apiRequest(`/api/themes/${id}`, { method: 'PUT', data: theme });
      },
      onSuccess: (_, variables) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/themes', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes/public'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes/user'] });
      },
    });
  };
  
  // Delete theme
  const useDeleteTheme = () => {
    return useMutation({
      mutationFn: (id: number) => {
        return apiRequest(`/api/themes/${id}`, { method: 'DELETE' });
      },
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/themes/public'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes/user'] });
      },
    });
  };
  
  // Get analytics for a theme
  const useThemeAnalytics = (id: number) => {
    return useQuery<ThemeAnalytic>({ 
      queryKey: ['/api/themes', id, 'analytics'],
      enabled: !!id,
    });
  };
  
  // Record theme usage
  const useRecordThemeUsage = () => {
    return useMutation({
      mutationFn: (id: number) => {
        return apiRequest(`/api/themes/${id}/usage`, { method: 'POST' });
      },
      onSuccess: (_, variables) => {
        // Invalidate analytics for this theme
        queryClient.invalidateQueries({ queryKey: ['/api/themes', variables, 'analytics'] });
      },
    });
  };
  
  // Record theme event
  const useRecordThemeEvent = () => {
    return useMutation({
      mutationFn: ({ id, eventType, metadata }: { id: number; eventType: string; metadata?: Record<string, any> }) => {
        return apiRequest(`/api/themes/${id}/event`, { 
          method: 'POST',
          data: { eventType, metadata }
        });
      },
      onSuccess: (_, variables) => {
        // Invalidate analytics for this theme
        queryClient.invalidateQueries({ queryKey: ['/api/themes', variables.id, 'analytics'] });
      },
    });
  };
  
  // Get theme usage report (admin only)
  const useThemeUsageReport = (fromDate?: Date, toDate?: Date) => {
    // Format dates for query params
    const fromDateString = fromDate?.toISOString();
    const toDateString = toDate?.toISOString();
    
    return useQuery<ThemeUsageReport>({ 
      queryKey: ['/api/themes/reports/usage', fromDateString, toDateString],
      enabled: true,
    });
  };
  
  return {
    // Query hooks
    usePublicThemes,
    useUserThemes,
    useTheme,
    useThemeAnalytics,
    useThemeUsageReport,
    
    // Mutation hooks
    useCreateTheme,
    useUpdateTheme,
    useDeleteTheme,
    useRecordThemeUsage,
    useRecordThemeEvent,
  };
}

export default useThemeAPI;