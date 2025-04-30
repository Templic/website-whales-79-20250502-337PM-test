import { useMutation, useQuery } from '@tanstack/react-query';
import { Theme, InsertTheme } from '../../shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Type definitions for API responses
interface ThemeStatsResponse {
  totalThemes: number;
  publicThemes: number;
  privateThemes: number;
  recentUsage: number;
  topThemes: { id: number; name: string; count: number }[];
}

interface ThemeCategoryResponse {
  name: string;
  count: number;
}

interface ThemeTagResponse {
  tag: string;
  count: number;
}

export const useThemeAPI = () => {
  const { toast } = useToast();
  
  // GET /api/themes
  const useGetThemes = () => {
    return useQuery({ 
      queryKey: ['/api/themes'],
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
  
  // GET /api/themes/:id
  const useGetTheme = (id: number) => {
    return useQuery({ 
      queryKey: ['/api/themes', id],
      enabled: !!id,
    });
  };
  
  // GET /api/themes/stats
  const useGetThemeStats = () => {
    return useQuery<ThemeStatsResponse>({ 
      queryKey: ['/api/themes/stats'],
      staleTime: 1000 * 60 * 15, // 15 minutes
    });
  };
  
  // GET /api/themes/categories
  const useGetThemeCategories = () => {
    return useQuery<ThemeCategoryResponse[]>({ 
      queryKey: ['/api/themes/categories'],
      staleTime: 1000 * 60 * 30, // 30 minutes
    });
  };
  
  // GET /api/themes/tags
  const useGetThemeTags = () => {
    return useQuery<ThemeTagResponse[]>({ 
      queryKey: ['/api/themes/tags'],
      staleTime: 1000 * 60 * 30, // 30 minutes
    });
  };
  
  // GET /api/themes/:id/history
  const useGetThemeHistory = (themeId: number) => {
    return useQuery({ 
      queryKey: ['/api/themes', themeId, 'history'],
      enabled: !!themeId,
    });
  };
  
  // POST /api/themes
  const useCreateTheme = () => {
    return useMutation({
      mutationFn: async (theme: InsertTheme) => {
        const res = await apiRequest('POST', '/api/themes', theme);
        return await res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes/stats'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: `Failed to create theme: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // PATCH /api/themes/:id
  const useUpdateTheme = () => {
    return useMutation({
      mutationFn: async (theme: Theme) => {
        const res = await apiRequest('PATCH', `/api/themes/${theme.id}`, theme);
        return await res.json();
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', data.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes/stats'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: `Failed to update theme: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // DELETE /api/themes/:id
  const useDeleteTheme = () => {
    return useMutation({
      mutationFn: async (themeId: number) => {
        await apiRequest('DELETE', `/api/themes/${themeId}`);
      },
      onSuccess: (_, themeId) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', themeId] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes/stats'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: `Failed to delete theme: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // POST /api/themes/:id/clone
  const useCloneTheme = () => {
    return useMutation({
      mutationFn: async ({ id, name }: { id: number; name?: string }) => {
        const res = await apiRequest('POST', `/api/themes/${id}/clone`, { name });
        return await res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes/stats'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: `Failed to clone theme: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // POST /api/themes/:id/publish
  const usePublishTheme = () => {
    return useMutation({
      mutationFn: async (themeId: number) => {
        const res = await apiRequest('POST', `/api/themes/${themeId}/publish`);
        return await res.json();
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', data.id] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: `Failed to publish theme: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // POST /api/themes/:id/unpublish
  const useUnpublishTheme = () => {
    return useMutation({
      mutationFn: async (themeId: number) => {
        const res = await apiRequest('POST', `/api/themes/${themeId}/unpublish`);
        return await res.json();
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', data.id] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: `Failed to unpublish theme: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // POST /api/themes/generate
  const useGenerateTheme = () => {
    return useMutation({
      mutationFn: async (prompt: string) => {
        const res = await apiRequest('POST', '/api/themes/generate', { prompt });
        return await res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: `Failed to generate theme: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  // POST /api/themes/:id/versions/:historyId/restore
  const useRestoreThemeVersion = () => {
    return useMutation({
      mutationFn: async ({ themeId, historyId }: { themeId: number; historyId: number }) => {
        const res = await apiRequest('POST', `/api/themes/${themeId}/versions/${historyId}/restore`);
        return await res.json();
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', data.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/themes', data.id, 'history'] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: `Failed to restore theme version: ${error.message}`,
          variant: 'destructive',
        });
      },
    });
  };
  
  return {
    useGetThemes,
    useGetTheme,
    useGetThemeStats,
    useGetThemeCategories,
    useGetThemeTags,
    useGetThemeHistory,
    useCreateTheme,
    useUpdateTheme,
    useDeleteTheme,
    useCloneTheme,
    usePublishTheme,
    useUnpublishTheme,
    useGenerateTheme,
    useRestoreThemeVersion,
  };
};