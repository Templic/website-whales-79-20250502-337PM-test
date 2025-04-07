/**
 * ProductGrid.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
import React from 'react';
import { Product } from '@/pages/shop/ShopPage';
import { Grid } from '@/components/ui/grid';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  return (
    <div className="w-full">
      <Grid className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 p-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </Grid>
    </div>
  );
};

export default ProductGrid;