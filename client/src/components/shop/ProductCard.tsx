/**
 * ProductCard Component
 * Displays individual product information in card format
 */

import React from "react"
import { Product } from "../../hooks/use-products"

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
        {product.featured && (
          <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            Featured
          </div>
        )}
        {!product.inStock && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Out of Stock
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
            {product.name}
          </h3>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            ${product.price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              ({product.reviewCount})
            </span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {product.category}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {product.tags.map(tag => (
            <span 
              key={tag} 
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <button 
          className={`w-full py-2 rounded-md text-white font-medium transition-colors ${
            product.inStock 
              ? 'bg-indigo-600 hover:bg-indigo-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={!product.inStock}
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  )
}

export default ProductCard