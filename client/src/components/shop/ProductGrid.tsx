
/**
 * ProductGrid Component
 * Displays products in a responsive grid layout
 * Handles product filtering and pagination
 */

import React from "react"
import { Product } from "@/pages/shop/ShopPage"
import ProductCard from "./ProductCard"
import { useProducts } from "@/hooks/use-products"

interface FilterState {
  category: string[];
  priceRange: [number, number];
  sortBy: string;
}

interface ProductGridProps {
  filters?: FilterState;
  products: Product[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ filters = { category: [], priceRange: [0, 1000], sortBy: "popular" }, products: initialProducts }) => {
  // Custom hook for product data fetching and management
  const { products, loading, error } = useProducts(filters);

  // Loading state handler
  if (loading) {
    return <div className="loading-spinner" />
  }

  // Error state handler
  if (error) {
    return <div className="error-message">{error}</div>
  }

  // Determine which products to show - either from the hook or the provided initialProducts
  const displayProducts = products.length > 0 ? products : initialProducts;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {/* Map through filtered products and render ProductCards */}
      {displayProducts.length > 0 ? (
        displayProducts.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
          />
        ))
      ) : (
        <div className="col-span-full flex items-center justify-center p-10">
          <p className="text-center text-muted-foreground">No products found matching your criteria</p>
        </div>
      )}
    </div>
  )
}

export default ProductGrid
