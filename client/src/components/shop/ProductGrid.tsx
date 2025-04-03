import React, { useState } from 'react';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import ProductCard from './ProductCard';
import CosmicButton from '../ui/cosmic-button';
import CosmicSpinner from '../ui/cosmic-spinner';
import { Product } from '@shared/schema';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  error?: string | null;
  onProductQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  showViewToggle?: boolean;
  showFiltersToggle?: boolean;
  onFiltersToggle?: () => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  error = null,
  onProductQuickView,
  onAddToCart,
  onAddToWishlist,
  showViewToggle = false,
  showFiltersToggle = false,
  onFiltersToggle,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <CosmicSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-gray-400">
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Grid Controls */}
      {(showViewToggle || showFiltersToggle) && (
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-400">
            Showing {products.length} products
          </div>
          <div className="flex space-x-2">
            {showFiltersToggle && onFiltersToggle && (
              <CosmicButton
                variant="outline"
                size="sm"
                onClick={onFiltersToggle}
                className="md:hidden"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </CosmicButton>
            )}
            
            {showViewToggle && (
              <div className="flex bg-gray-800 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-l-md ${
                    viewMode === 'grid' 
                      ? 'bg-cosmic-primary text-white' 
                      : 'text-gray-400 hover:text-white transition-colors'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-r-md ${
                    viewMode === 'list' 
                      ? 'bg-cosmic-primary text-white' 
                      : 'text-gray-400 hover:text-white transition-colors'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div 
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={viewMode === 'grid' ? 'grid' : 'list'}
            onQuickView={onProductQuickView ? () => onProductQuickView(product) : undefined}
            onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
            onAddToWishlist={onAddToWishlist ? () => onAddToWishlist(product) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;