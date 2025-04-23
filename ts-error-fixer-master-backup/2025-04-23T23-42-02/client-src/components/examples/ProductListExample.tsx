/**
 * ProductListExample Component
 * 
 * This component demonstrates how to use our centralized type system with a product list.
 * It shows the use of type guards, transformers, and properly typed data handling.
 */

import React, { useState, useEffect } from 'react';
import { 
  Product, 
  PaginatedResponse, 
  PaginationParams,
  API
} from '@/types';
import { isProduct, isArrayOf } from '@/utils/typeGuards';
import { productToListItem } from '@/utils/typeTransformers';
import { createProductId } from '@/utils/brandedTypeHelpers';

// Sample data with proper types
const sampleProducts: Product[] = [
  {
    id: createProductId('product-1'),
    name: 'Cosmic Meditation Orb',
    description: 'Enhanced meditation tool with embedded frequency generators',
    price: 149.99,
    compareAtPrice: 199.99,
    currency: 'USD',
    images: ['cosmic-orb-1.jpg', 'cosmic-orb-2.jpg'],
    category: 'Meditation',
    tags: ['meditation', 'energy', 'healing'],
    sku: 'CMO-001',
    stock: 15,
    isActive: true,
    isDigital: false,
    ratings: { average: 4.8, count: 32 },
    dimensions: { width: 5, height: 5, depth: 5, unit: 'in' },
    weight: { value: 0.8, unit: 'kg' },
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-03-15T00:00:00Z'
  },
  {
    id: createProductId('product-2'),
    name: 'Frequency Healing Audio Series',
    description: 'A collection of healing frequency audio tracks',
    price: 49.99,
    currency: 'USD',
    images: ['audio-series-1.jpg'],
    category: 'Audio',
    tags: ['audio', 'healing', 'frequency'],
    sku: 'FHA-101',
    stock: 999,
    isActive: true,
    isDigital: true,
    ratings: { average: 4.9, count: 87 },
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-15T00:00:00Z'
  },
  {
    id: createProductId('product-3'),
    name: 'Sacred Geometry Wall Art',
    description: 'Beautiful sacred geometry patterns for your space',
    price: 79.99,
    compareAtPrice: 99.99,
    currency: 'USD',
    images: ['sacred-geo-1.jpg', 'sacred-geo-2.jpg', 'sacred-geo-3.jpg'],
    category: 'Art',
    tags: ['sacred geometry', 'art', 'decor'],
    sku: 'SGWA-202',
    stock: 23,
    isActive: true,
    isDigital: false,
    ratings: { average: 4.7, count: 45 },
    dimensions: { width: 24, height: 24, depth: 1, unit: 'in' },
    weight: { value: 1.2, unit: 'kg' },
    createdAt: '2025-02-20T00:00:00Z',
    updatedAt: '2025-03-05T00:00:00Z'
  }
];

const ProductListExample: React.FC = () => {
  // State with proper typing
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });

  // Simulate data fetching with type validation
  useEffect(() => {
    const fetchProducts = () => {
      setLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        // Validate data with type guards
        if (isArrayOf(sampleProducts, isProduct)) {
          setProducts(sampleProducts);
          setPagination({
            page: 1,
            pageSize: 10,
            totalItems: sampleProducts.length,
            totalPages: Math.ceil(sampleProducts.length / 10)
          });
        } else {
          console.error('Invalid product data received');
        }
        setLoading(false);
      }, 1000);
    };

    fetchProducts();
  }, []);

  // Transforming products to simplified list items
  const productListItems = products.map(product => productToListItem(product));

  // Handle adding to cart with type safety
  const handleAddToCart = (product: Product) => {
    console.log(`Added ${product.name} to cart`);
    // In a real implementation, this would call a cart context method
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Product List Example</h2>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div 
                key={product.id.toString()} 
                className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">
                    {product.images[0] ? `[Image: ${product.images[0]}]` : 'No image'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <span className="font-bold">${product.price.toFixed(2)}</span>
                      {product.compareAtPrice && (
                        <span className="text-gray-500 line-through ml-2">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <p className="text-gray-600">
              Showing {products.length} of {pagination.totalItems} products
            </p>
            <div className="flex gap-2">
              <button 
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button 
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductListExample;