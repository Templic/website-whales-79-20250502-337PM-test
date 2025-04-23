/**
 * Custom hook for fetching and filtering products
 * Manages loading states and error handling for product data
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '@/pages/shop/ShopPage';

// Define the FilterState interface to match what's used in ShopPage
interface FilterState {
  category: string[];
  priceRange: [number, number];
  sortBy: string;
}

export const useProducts = (filters: FilterState) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch products from API
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('GET', '/api/products'),
  });

  // Apply filters and update filtered products whenever data or filters change
  useEffect(() => {
    if (!data) return;

    // Store original products
    const allProducts = data as Product[];
    setProducts(allProducts);

    // Apply filters
    let filtered = [...allProducts];

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter((product) =>
        product.categories.some((category) => filters.category.includes(category))
      );
    }

    // Apply price range filter
    filtered = filtered.filter(
      (product) => product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Apply sorting
    switch (filters.sortBy) {
      case "price-low-high":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        filtered.sort((a, b) => (a.new === b.new ? 0 : a.new ? -1 : 1));
        break;
      case "featured":
      default:
        filtered.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
    }

    // Update filtered products
    setFilteredProducts(filtered);
  }, [data, filters]);

  // For error handling
  const errorMessage = isError ? (error as Error).message : null;

  // Return necessary data and states
  return {
    products: filteredProducts,
    allProducts: products,
    loading: isLoading,
    error: errorMessage,
  };
};