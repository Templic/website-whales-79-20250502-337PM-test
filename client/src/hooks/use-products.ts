import { useState, useEffect } from 'react';
import { Product } from '@/pages/shop/ShopPage';

// Interface for the hook's filter options
export interface ProductFilterOptions {
  category?: string[];
  priceRange?: [number, number];
  searchQuery?: string;
  sortBy?: string;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
}

// Sample product data (In a real app, this would come from API)
const sampleProducts: Product[] = [
  {
    id: "prod-1",
    name: "Celestial Crystal Sound Bowl",
    description: "Hand-crafted crystal bowl tuned to 432Hz frequency for deep healing vibrations. Each bowl is cleansed and charged under the full moon.",
    price: 129.99,
    image: "/images/products/crystal-bowl.jpg",
    rating: 4.8,
    inStock: true,
    categories: ["Healing Tools", "Sound Therapy", "Premium"],
    featured: true,
    attributes: {
      material: "Crystal Quartz",
      frequency: "432Hz",
      diameter: "8 inches"
    }
  },
  {
    id: "prod-2",
    name: "Cosmic Energy Pendant",
    description: "Handcrafted pendant containing specialized crystals that resonate with cosmic frequencies. Designed to balance your energy field and enhance intuition.",
    price: 45.99,
    image: "/images/products/energy-pendant.jpg",
    rating: 4.6,
    inStock: true,
    categories: ["Jewelry", "Energy Tools"],
    new: true,
    attributes: {
      material: "Sterling Silver with Labradorite",
      length: "18 inches",
      cleansing: "Moonlight charged"
    }
  },
  {
    id: "prod-3",
    name: "Cosmic Frequency Digital Album",
    description: "A collection of 12 tracks specifically designed to activate different energy centers. Features binaural beats and isochronic tones layered with ambient sounds.",
    price: 18.99,
    image: "/images/products/cosmic-frequency-album.png",
    rating: 4.9,
    inStock: true,
    categories: ["Digital", "Music", "Featured"],
    discountPercent: 15,
    attributes: {
      format: "Digital Download (FLAC + MP3)",
      length: "74 minutes",
      tracks: "12"
    }
  },
  {
    id: "prod-4",
    name: "Meditation Cushion Set",
    description: "Ergonomically designed meditation cushion set with cosmic pattern. Created for proper alignment during extended meditation sessions.",
    price: 89.99,
    image: "/images/products/meditation-cushion.jpg",
    rating: 4.7,
    inStock: true,
    categories: ["Meditation", "Home"],
    attributes: {
      material: "Organic Cotton",
      filling: "Buckwheat hulls",
      dimensions: "16\" diameter, 6\" height"
    }
  },
  {
    id: "prod-5",
    name: "Sacred Geometry Wall Art",
    description: "Hand-painted sacred geometry artwork design to enhance the energetic field of your space. Available in multiple geometric patterns.",
    price: 149.99,
    image: "/images/products/sacred-geometry.jpg",
    rating: 4.9,
    inStock: false,
    categories: ["Art", "Home", "Premium"],
    featured: true,
    attributes: {
      material: "Canvas and non-toxic paint",
      size: "24\" x 24\"",
      pattern: "Metatron's Cube"
    }
  },
  {
    id: "prod-6",
    name: "Cosmic Journey Journal",
    description: "Beautifully designed journal with prompts to document your spiritual journey, dreams, and cosmic insights. Includes moon phase tracking.",
    price: 24.99,
    image: "/images/products/cosmic-journal.jpg",
    rating: 4.5,
    inStock: true,
    categories: ["Books", "Self-Development"],
    new: true,
    discountPercent: 10,
    attributes: {
      pages: "200 with gilt edges",
      material: "Vegan leather cover",
      extras: "Ribbon bookmark, elastic closure"
    }
  }
];

// The custom hook for product data fetching and filtering
export const useProducts = (filters?: ProductFilterOptions) => {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(sampleProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch products (simulated)
  useEffect(() => {
    const fetchProducts = async () => {
      // In a real app, this would be an API call
      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // In a real app, this would be data from an API
        setProducts(sampleProducts);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Effect to apply filters when they change
  useEffect(() => {
    if (!filters) {
      setFilteredProducts(products);
      return;
    }

    let filtered = [...products];

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.categories.some((category) => category.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((product) =>
        product.categories.some((category) => filters.category?.includes(category))
      );
    }

    // Apply price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(
        (product) => 
          product.price >= filters.priceRange![0] && 
          product.price <= filters.priceRange![1]
      );
    }

    // Apply in-stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Apply on-sale filter
    if (filters.onSale) {
      filtered = filtered.filter(product => !!product.discountPercent);
    }

    // Apply featured filter
    if (filters.featured) {
      filtered = filtered.filter(product => product.featured);
    }

    // Apply sorting
    if (filters.sortBy) {
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
        case "name-a-z":
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name-z-a":
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "featured":
        default:
          filtered.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
      }
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  return {
    products: filteredProducts,
    loading,
    error,
  };
};