import { useQuery, useMutation } from '@tanstack/react-query';
import { Theme, InsertTheme } from '../../shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for interacting with theme-related API endpoints
 */
export const useThemeAPI = () => {
  const { toast } = useToast();
  
  // Query for fetching all themes
  const useGetThemes = () => {
    return useQuery<Theme[]>({
      queryKey: ['/api/themes'],
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  // Query for fetching a specific theme
  const useGetTheme = (id: number) => {
    return useQuery<Theme>({
      queryKey: ['/api/themes', id],
      enabled: !!id,
    });
  };
  
  // Query for fetching theme history
  const useGetThemeHistory = (themeId: number) => {
    return useQuery<any[]>({
      queryKey: ['/api/themes', themeId, 'history'],
      enabled: !!themeId,
    });
  };
  
  // Mutation for creating a new theme
  const useCreateTheme = () => {
    return useMutation({
      mutationFn: async (theme: InsertTheme) => {
        const response = await apiRequest('POST', '/api/themes', theme);
        return await response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error creating theme',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  
  // Mutation for updating a theme
  const useUpdateTheme = () => {
    return useMutation({
      mutationFn: async (theme: Theme) => {
        const response = await apiRequest('PUT', `/api/themes/${theme.id}`, theme);
        return await response.json();
      },
      onSuccess: (updatedTheme: Theme) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', updatedTheme.id] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error updating theme',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  
  // Mutation for deleting a theme
  const useDeleteTheme = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        const response = await apiRequest('DELETE', `/api/themes/${id}`);
        return true; // Success indicator
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error deleting theme',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  
  // Mutation for publishing a theme (making it public)
  const usePublishTheme = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        const response = await apiRequest('POST', `/api/themes/${id}/publish`);
        return await response.json();
      },
      onSuccess: (updatedTheme: Theme) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', updatedTheme.id] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error publishing theme',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  
  // Mutation for unpublishing a theme (making it private)
  const useUnpublishTheme = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        const response = await apiRequest('POST', `/api/themes/${id}/unpublish`);
        return await response.json();
      },
      onSuccess: (updatedTheme: Theme) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', updatedTheme.id] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error unpublishing theme',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  
  // Mutation for restoring a theme version
  const useRestoreThemeVersion = () => {
    return useMutation({
      mutationFn: async ({ themeId, historyId }: { themeId: number; historyId: number }) => {
        const response = await apiRequest('POST', `/api/themes/${themeId}/restore/${historyId}`);
        return await response.json();
      },
      onSuccess: (updatedTheme: Theme) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', updatedTheme.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', updatedTheme.id, 'history'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error restoring theme version',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };
  
  return {
    useGetThemes,
    useGetTheme,
    useGetThemeHistory,
    useCreateTheme,
    useUpdateTheme,
    useDeleteTheme,
    usePublishTheme,
    useUnpublishTheme,
    useRestoreThemeVersion,
  };
};

export default useThemeAPI;