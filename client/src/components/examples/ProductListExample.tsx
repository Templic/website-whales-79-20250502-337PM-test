/**
 * ProductListExample Component
 * 
 * A demonstration component showing how to use centralized types with React Query.
 * This component fetches and displays a list of products with proper typing.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API, PaginationParams } from '@/types';

/**
 * Product List Example Component props
 */
interface ProductListExampleProps {
  initialCategory?: string;
  pageSize?: number;
}

/**
 * ProductListExample Component
 * 
 * @example
 * <ProductListExample initialCategory="music" pageSize={10} />
 */
export const ProductListExample: React.FC<ProductListExampleProps> = ({
  initialCategory = 'all',
  pageSize = 10
}) => {
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);
  
  // Define pagination parameters using central types
  const pagination: PaginationParams = {
    page,
    pageSize,
    totalItems: 0,
    totalPages: 0
  };
  
  // Using React Query with typed API response
  const { data, isLoading, isError } = useQuery<API.ProductListResponse>({
    queryKey: ['/api/products', { category, ...pagination }],
    queryFn: async () => {
      // Simulate API call with mock data for demo
      return {
        success: true,
        data: [
          { id: '1', name: 'Cosmic Meditation Album', price: 19.99, category: 'music', inStock: true },
          { id: '2', name: 'Sound Healing Bowl', price: 65.00, category: 'equipment', inStock: true },
          { id: '3', name: 'Sacred Geometry Pendant', price: 29.99, category: 'jewelry', inStock: true },
          { id: '4', name: 'Chakra Alignment Guide', price: 12.99, category: 'books', inStock: true },
          { id: '5', name: 'Limited Edition Vinyl', price: 45.00, category: 'music', inStock: false },
          { id: '6', name: 'Frequency Tuning Forks', price: 85.00, category: 'equipment', inStock: true },
        ].filter(product => category === 'all' || product.category === category),
        timestamp: new Date().toISOString(),
        totalCount: 6,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 1
      };
    }
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-[150px] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
        Error loading products. Please try again.
      </div>
    );
  }
  
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'music', label: 'Music' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'books', label: 'Books' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="w-full md:w-64">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {data?.totalPages || 1}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!data || page >= data.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.data.map(product => (
          <Card key={product.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant={product.inStock ? "default" : "destructive"}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <Badge variant="outline" className="mb-2">{product.category}</Badge>
                  <p className="font-semibold text-lg">${product.price.toFixed(2)}</p>
                </div>
                <Button size="sm" disabled={!product.inStock}>
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        Showing {data?.data.length} of {data?.totalCount} products
      </div>
    </div>
  );
};

export default ProductListExample;