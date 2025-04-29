import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

// Types for our recommendations
export interface ContentRecommendation {
  contentId: number;
  title: string;
  summary?: string;
  contentType: string;
  tags: string[];
  score: number;
  reason: string;
  imageUrl?: string;
}

export interface RecommendationParams {
  contentId?: number;         // Source content ID to find similar content
  userId?: string;            // User ID to personalize recommendations
  tags?: string[];            // Tags to filter recommendations
  contentType?: string;       // Type of content to recommend
  limit?: number;             // Maximum number of recommendations
  excludeIds?: number[];      // Content IDs to exclude
  page?: number;              // Page number for pagination
  pageSize?: number;          // Items per page
}

interface RecommendationResponse {
  recommendations: ContentRecommendation[];
  totalCount: number;
  hasMore: boolean;
}

// Fetch data with proper caching
const fetchRecommendations = async (params: RecommendationParams): Promise<RecommendationResponse> => {
  const queryParams = new URLSearchParams();
  
  // Add parameters if they exist
  if (params.contentId) queryParams.append('contentId', params.contentId.toString());
  if (params.userId) queryParams.append('userId', params.userId);
  if (params.contentType) queryParams.append('contentType', params.contentType);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  
  // Handle arrays
  if (params.tags?.length) {
    params.tags.forEach(tag => queryParams.append('tags', tag));
  }
  
  if (params.excludeIds?.length) {
    params.excludeIds.forEach(id => queryParams.append('excludeIds', id.toString()));
  }
  
  // Limit parameter with default
  queryParams.append('limit', params.limit?.toString() || '10');
  
  const response = await fetch(`/api/content-recommendations?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  
  return await response.json();
};

// Hook for content recommendations
export function useRecommendations(initialParams: RecommendationParams) {
  const [params, setParams] = useState<RecommendationParams>(initialParams);
  
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['recommendations', params],
    queryFn: () => fetchRecommendations(params),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Function to load more items (pagination)
  const loadMore = () => {
    if (data?.hasMore && !isFetching) {
      setParams(prev => ({
        ...prev,
        page: (prev.page || 1) + 1
      }));
    }
  };
  
  // Function to update filters
  const updateFilters = (newParams: Partial<RecommendationParams>) => {
    setParams(prev => ({
      ...prev,
      ...newParams,
      page: 1 // Reset to first page when filters change
    }));
  };
  
  return {
    recommendations: data?.recommendations || [],
    totalCount: data?.totalCount || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isError,
    error,
    loadMore,
    updateFilters,
    refetch,
    isFetching
  };
}

// Hook for trending topics
export function useTrendingTopics() {
  return useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      const response = await fetch('/api/content-recommendations/trending-topics');
      if (!response.ok) {
        throw new Error('Failed to fetch trending topics');
      }
      return await response.json();
    },
    staleTime: 30 * 60 * 1000, // Consider data fresh for 30 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for content gap suggestions (admin only)
export function useContentGapSuggestions() {
  return useQuery({
    queryKey: ['content-gap-suggestions'],
    queryFn: async () => {
      const response = await fetch('/api/content-recommendations/gap-suggestions');
      if (!response.ok) {
        throw new Error('Failed to fetch content gap suggestions');
      }
      return await response.json();
    },
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    refetchOnWindowFocus: false,
  });
}