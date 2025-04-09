/**
 * useProducts Hook
 * Fetches and manages product data based on filters
 */

import { useState, useEffect } from "react"

// Define the Product interface
export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  tags: string[]
  inStock: boolean
  rating: number
  reviewCount: number
  featured?: boolean
  createdAt: string
  updatedAt: string
}

// Define FilterState interface (imported from ShopPage)
export interface FilterState {
  category?: string
  priceRange?: [number, number]
  tags?: string[]
  search?: string
  inStock?: boolean
  sortBy?: "price-asc" | "price-desc" | "newest" | "rating"
  page?: number
  limit?: number
}

// Mock product data for demonstration
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Cosmic Healing Crystal",
    description: "A powerful healing crystal that channels cosmic energy",
    price: 49.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "crystals",
    tags: ["healing", "energy", "meditation"],
    inStock: true,
    rating: 4.8,
    reviewCount: 24,
    featured: true,
    createdAt: "2024-03-15T14:28:00Z",
    updatedAt: "2024-03-15T14:28:00Z",
  },
  {
    id: "2",
    name: "Celestial Sound Bowl",
    description: "Hand-crafted sound bowl tuned to celestial frequencies",
    price: 129.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "instruments",
    tags: ["sound", "meditation", "healing"],
    inStock: true,
    rating: 4.9,
    reviewCount: 36,
    featured: true,
    createdAt: "2024-03-14T11:15:00Z",
    updatedAt: "2024-03-14T11:15:00Z",
  },
  {
    id: "3",
    name: "Astral Projection Guide",
    description: "Comprehensive guide to astral projection techniques",
    price: 24.95,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "books",
    tags: ["guide", "astral", "consciousness"],
    inStock: true,
    rating: 4.7,
    reviewCount: 19,
    createdAt: "2024-03-12T09:45:00Z",
    updatedAt: "2024-03-12T09:45:00Z",
  },
  {
    id: "4",
    name: "Meditation Cushion",
    description: "Ergonomic cushion for comfortable meditation sessions",
    price: 59.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "accessories",
    tags: ["meditation", "comfort"],
    inStock: false,
    rating: 4.6,
    reviewCount: 42,
    createdAt: "2024-03-10T16:30:00Z",
    updatedAt: "2024-03-10T16:30:00Z",
  },
  {
    id: "5",
    name: "Frequency Tuning Fork Set",
    description: "Set of precision tuning forks for sound healing",
    price: 89.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "instruments",
    tags: ["frequency", "healing", "sound"],
    inStock: true,
    rating: 4.8,
    reviewCount: 28,
    createdAt: "2024-03-08T13:20:00Z",
    updatedAt: "2024-03-08T13:20:00Z",
  },
  {
    id: "6",
    name: "Sacred Geometry Art Print",
    description: "Hand-designed sacred geometry print for your space",
    price: 34.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "art",
    tags: ["geometry", "art", "decor"],
    inStock: true,
    rating: 4.5,
    reviewCount: 15,
    createdAt: "2024-03-05T10:10:00Z",
    updatedAt: "2024-03-05T10:10:00Z",
  },
]

export function useProducts(filters: FilterState = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call with setTimeout
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Apply filters
        let filteredProducts = [...mockProducts]

        // Category filter
        if (filters.category) {
          filteredProducts = filteredProducts.filter(p => p.category === filters.category)
        }

        // Price range filter
        if (filters.priceRange) {
          const [min, max] = filters.priceRange
          filteredProducts = filteredProducts.filter(p => p.price >= min && p.price <= max)
        }

        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          filteredProducts = filteredProducts.filter(p => 
            p.tags.some(tag => filters.tags?.includes(tag))
          )
        }

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchLower) || 
            p.description.toLowerCase().includes(searchLower)
          )
        }

        // In stock filter
        if (filters.inStock !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.inStock === filters.inStock)
        }

        // Sorting
        if (filters.sortBy) {
          switch (filters.sortBy) {
            case "price-asc":
              filteredProducts.sort((a, b) => a.price - b.price)
              break
            case "price-desc":
              filteredProducts.sort((a, b) => b.price - a.price)
              break
            case "newest":
              filteredProducts.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              break
            case "rating":
              filteredProducts.sort((a, b) => b.rating - a.rating)
              break
          }
        }

        // Pagination
        const page = filters.page || 1
        const limit = filters.limit || 9
        const start = (page - 1) * limit
        const end = start + limit
        
        const paginatedProducts = filteredProducts.slice(start, end)

        setProducts(paginatedProducts)
      } catch (err) {
        setError("Error fetching products. Please try again.")
        console.error("Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters])

  return { products, loading, error }
}