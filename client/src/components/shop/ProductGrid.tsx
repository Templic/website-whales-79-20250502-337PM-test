
/**
 * ProductGrid Component
 * Displays products in a responsive grid layout
 * Handles product filtering and pagination
 */

import React from "react"
import { ProductCard } from "./ProductCard"
import { ProductFilterOptions } from "@/hooks/use-products"
import { Product } from "@/pages/shop/ShopPage"

interface ProductGridProps {
  filters: ProductFilterOptions; // Inherited from ShopPage filters
  products: Product[]; // Products to display
  addToCart: (product: Product) => void; // Function to add a product to cart
}

const ProductGrid: React.FC<ProductGridProps> = ({ filters, products, addToCart }) => {
  // Loading state handler shown when products aren't ready
  if (!products || products.length === 0) {
    return <div className="flex justify-center py-12">No products found matching your criteria</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Map through products and render ProductCards */}
      {products.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
          onAddToCart={addToCart}
        />
      ))}
    </div>
  )
}

export { ProductGrid }
