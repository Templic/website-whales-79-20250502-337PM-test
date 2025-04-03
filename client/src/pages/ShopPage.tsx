import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product, ProductCategory } from '@shared/schema';
import { defaultProducts, productCategories } from '@/data/playlists';
import ProductGrid from '@/components/shop/ProductGrid';
import ProductFilter from '@/components/shop/ProductFilter';
import ProductQuickView from '@/components/shop/ProductQuickView';
import CosmicCard from '@/components/ui/cosmic-card';
import CosmicHeading from '@/components/ui/cosmic-heading';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CosmicButton } from '@/components/ui/cosmic-button';
import { apiRequest } from '@/lib/queryClient';

export default function ShopPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [filters, setFilters] = useState({
    categories: [] as number[],
    priceRange: [0, 1000] as [number, number],
    inStock: false,
    onSale: false,
    featured: false,
    sortBy: 'newest' as 'newest' | 'price-low-high' | 'price-high-low' | 'name-a-z' | 'name-z-a'
  });
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Shop - Dale Loves Whales";
  }, []);

  // Fetch products based on filters
const { 
    data: products, 
    isLoading: productsLoading, 
    isError: productsError 
  } = useQuery({
    queryKey: ['/api/shop/products', filters],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
      if (filters.categories.length > 0) {
        filters.categories.forEach(catId => 
          queryParams.append('category', catId.toString())
        );
      }
      queryParams.append('minPrice', filters.priceRange[0].toString());
      queryParams.append('maxPrice', filters.priceRange[1].toString());
      if (filters.inStock) queryParams.append('inStock', 'true');
      if (filters.onSale) queryParams.append('onSale', 'true');
      if (filters.featured) queryParams.append('featured', 'true');
      queryParams.append('sortBy', filters.sortBy);
      
      const response = await apiRequest<Product[]>(`/api/shop/products?${queryParams.toString()}`);
      return response;
      } catch (error) {
        // Fallback to default products if API fails
        return defaultProducts.filter(product => {
          if (filters.categories.length > 0 && !filters.categories.includes(product.categoryId)) return false;
          if (filters.inStock && product.inventory <= 0) return false;
          if (filters.featured && !product.featured) return false;
          const price = parseFloat(product.price);
          return price >= filters.priceRange[0] && price <= filters.priceRange[1];
        });
      }
    },
    enabled: true,
  });

  // Fetch categories for filter
  const { 
    data: categories, 
    isLoading: categoriesLoading 
  } = useQuery({
    queryKey: ['/api/shop/categories'],
    queryFn: async () => {
      const response = await apiRequest<ProductCategory[]>('/api/shop/categories');
      return response;
    }
  });

  // Handle add to cart
  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    try {
      await apiRequest('/api/shop/cart/items', {
        method: 'POST',
        data: {
          productId,
          quantity
        }
      });
      
      toast({
        title: "Added to cart",
        description: "Item successfully added to your cart",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  // Handle quick view
  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setQuickViewOpen(true);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters({ ...newFilters });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Shop Hero Section */}
      <section className="mb-12">
        <div 
          className="relative h-[300px] rounded-lg overflow-hidden mb-8"
          style={{
            background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(10, 50, 92, 0.7)), 
              url(/images/shop-hero.jpg) no-repeat center center / cover`
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-cosmic">
            <CosmicHeading 
              as="h1" 
              size="3xl" 
              weight="bold" 
              className="mb-4 text-shadow shadow-blue-500"
            >
              Cosmic Shop
            </CosmicHeading>
            <p className="max-w-2xl text-lg mb-4 text-shadow shadow-blue-500">
              Explore our exclusive merchandise and collectibles to take a piece of the cosmic journey home with you.
            </p>
            <CosmicButton 
              variant="glow" 
              size="lg" 
              href="/shop/collaborative"
              className="mt-2"
            >
              Shop Together with Friends
            </CosmicButton>
          </div>
        </div>
      </section>

      {/* Shop Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Section (Desktop) */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <CosmicCard variant="glow" className="sticky top-24">
            <div className="p-4">
              <CosmicHeading as="h2" size="lg" weight="medium" className="mb-4">
                Filters
              </CosmicHeading>
              
              {categoriesLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ProductFilter 
                  categories={categories || []} 
                  initialFilters={filters}
                  onFilterChange={handleFilterChange}
                  minPrice={0}
                  maxPrice={1000}
                />
              )}
            </div>
          </CosmicCard>
        </div>

        {/* Filter Button (Mobile) */}
        <div className="lg:hidden mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <CosmicButton variant="cosmic" className="w-full">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </CosmicButton>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="py-6">
                <CosmicHeading as="h2" size="lg" weight="medium" className="mb-4">
                  Filters
                </CosmicHeading>
                
                {categoriesLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ProductFilter 
                    categories={categories || []} 
                    initialFilters={filters}
                    onFilterChange={handleFilterChange}
                    minPrice={0}
                    maxPrice={1000}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Products Section */}
        <div className="flex-grow">
          {productsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
          ) : productsError ? (
            <div className="text-center p-12">
              <p className="text-destructive mb-4">Failed to load products</p>
              <CosmicButton 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </CosmicButton>
            </div>
          ) : products && products.length > 0 ? (
            <ProductGrid 
              products={products} 
              onQuickView={handleQuickView}
              onAddToCart={(productId) => handleAddToCart(productId)}
            />
          ) : (
            <div className="text-center p-12">
              <p className="mb-4">No products found matching your criteria</p>
              <CosmicButton 
                variant="outline" 
                onClick={() => setFilters({
                  categories: [],
                  priceRange: [0, 1000] as [number, number],
                  inStock: false,
                  onSale: false,
                  featured: false,
                  sortBy: 'newest'
                })}
              >
                Reset Filters
              </CosmicButton>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          open={quickViewOpen}
          onOpenChange={setQuickViewOpen}
          onAddToCart={(quantity) => handleAddToCart(selectedProduct.id, quantity)}
        />
      )}
    </div>
  );
}