/**
 * Theme API Hook
 * 
 * This hook provides access to the theme management API endpoints:
 * - Fetch public themes
 * - Fetch user themes
 * - Create, update, delete themes
 * - Record theme usage
 * - Query theme history and versions
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { Theme } from '../../shared/schema';

export const useThemeAPI = () => {
  // Query key constants
  const QUERY_KEYS = {
    PUBLIC_THEMES: '/api/themes/public',
    USER_THEMES: (userId: string) => `/api/themes/user/${userId}`,
    THEME: (id: number) => `/api/themes/${id}`,
    THEME_HISTORY: (id: number) => `/api/themes/${id}/history`,
    THEME_STATS: '/api/themes/stats',
    THEME_CATEGORIES: '/api/themes/categories',
    THEME_TAGS: '/api/themes/tags',
  };

  // Function to get public themes
  const usePublicThemes = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.PUBLIC_THEMES],
      // The actual fetch is handled by the default queryFn in queryClient
    });
  };

  // Function to get user themes
  const useUserThemes = (userId: string) => {
    return useQuery({
      queryKey: [QUERY_KEYS.USER_THEMES(userId)],
      enabled: !!userId, // Only run query if userId is available
    });
  };

  // Function to get a specific theme by ID
  const useTheme = (id: number) => {
    return useQuery({
      queryKey: [QUERY_KEYS.THEME(id)],
      enabled: id > 0, // Only run query if id is valid
    });
  };

  // Function to get theme history
  const useThemeHistory = (id: number) => {
    return useQuery({
      queryKey: [QUERY_KEYS.THEME_HISTORY(id)],
      enabled: id > 0, // Only run query if id is valid
    });
  };

  // Function to get theme stats
  const useThemeStats = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.THEME_STATS],
    });
  };

  // Function to get theme categories
  const useThemeCategories = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.THEME_CATEGORIES],
    });
  };

  // Function to get theme tags
  const useThemeTags = () => {
    return useQuery({
      queryKey: [QUERY_KEYS.THEME_TAGS],
    });
  };

  // Function to create a new theme
  const useCreateTheme = () => {
    return useMutation({
      mutationFn: async (theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>) => {
        const response = await fetch('/api/themes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(theme),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create theme');
        }
        
        return await response.json();
      },
      onSuccess: () => {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PUBLIC_THEMES] });
        // Don't invalidate user themes yet since we don't know the ID
      },
    });
  };

  // Function to update a theme
  const useUpdateTheme = () => {
    return useMutation({
      mutationFn: async (theme: Theme) => {
        const response = await fetch(`/api/themes/${theme.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(theme),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update theme');
        }
        
        return await response.json();
      },
      onSuccess: (data) => {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PUBLIC_THEMES] });
        if (data.userId) {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_THEMES(data.userId)] });
        }
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.THEME(data.id)] });
      },
    });
  };

  // Function to delete a theme
  const useDeleteTheme = () => {
    return useMutation({
      mutationFn: async (themeId: number) => {
        const response = await fetch(`/api/themes/${themeId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete theme');
        }
        
        return themeId;
      },
      onSuccess: (themeId) => {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PUBLIC_THEMES] });
        // User ID is not available here, so we'll use a prefix match
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey.join('/');
            return queryKey.includes('/api/themes/user/');
          }
        });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.THEME(themeId)] });
      },
    });
  };

  // Function to clone a theme
  const useCloneTheme = () => {
    return useMutation({
      mutationFn: async ({ id, name }: { id: number, name: string }) => {
        const response = await fetch(`/api/themes/${id}/clone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to clone theme');
        }
        
        return await response.json();
      },
      onSuccess: () => {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PUBLIC_THEMES] });
        // User ID is not available here, so we'll use a prefix match
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey.join('/');
            return queryKey.includes('/api/themes/user/');
          }
        });
      },
    });
  };

  // Function to publish a theme
  const usePublishTheme = () => {
    return useMutation({
      mutationFn: async (themeId: number) => {
        const response = await fetch(`/api/themes/${themeId}/publish`, {
          method: 'PUT',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to publish theme');
        }
        
        return await response.json();
      },
      onSuccess: (data) => {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PUBLIC_THEMES] });
        if (data.userId) {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_THEMES(data.userId)] });
        }
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.THEME(data.id)] });
      },
    });
  };

  // Function to unpublish a theme
  const useUnpublishTheme = () => {
    return useMutation({
      mutationFn: async (themeId: number) => {
        const response = await fetch(`/api/themes/${themeId}/unpublish`, {
          method: 'PUT',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to unpublish theme');
        }
        
        return await response.json();
      },
      onSuccess: (data) => {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PUBLIC_THEMES] });
        if (data.userId) {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_THEMES(data.userId)] });
        }
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.THEME(data.id)] });
      },
    });
  };

  // Function to record theme usage
  const useRecordThemeUsage = () => {
    return useMutation({
      mutationFn: async (themeId: number) => {
        const response = await fetch(`/api/themes/${themeId}/record-usage`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          // Don't throw for recording usage - just log and continue
          console.error('Failed to record theme usage');
        }
        
        return themeId;
      },
      // No invalidation needed since stats are periodically fetched
    });
  };

  // Return all the hooks
  return {
    usePublicThemes,
    useUserThemes,
    useTheme,
    useThemeHistory,
    useThemeStats,
    useThemeCategories,
    useThemeTags,
    useCreateTheme,
    useUpdateTheme,
    useDeleteTheme,
    useCloneTheme,
    usePublishTheme,
    useUnpublishTheme,
    useRecordThemeUsage,
  };
};