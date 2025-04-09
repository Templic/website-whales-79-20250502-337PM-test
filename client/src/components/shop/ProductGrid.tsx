
/**
 * ProductGrid Component
 * Displays products in a responsive grid layout
 * Handles product filtering and pagination
 */

import React from "react"
import { ProductCard } from "./ProductCard"
import { useProducts } from "@/hooks/use-products"

interface ProductGridProps {
  filters: FilterState // Inherited from ShopPage filters
}

const ProductGrid: React.FC<ProductGridProps> = ({ filters }) => {
  // Custom hook for product data fetching and management
  const { products, loading, error } = useProducts(filters)

  // Loading state handler
  if (loading) {
    return <div className="loading-spinner" />
  }

  // Error state handler
  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Map through filtered products and render ProductCards */}
      {products.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
        />
      ))}
    </div>
  )
}

export default ProductGrid
