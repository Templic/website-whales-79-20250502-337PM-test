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
      <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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