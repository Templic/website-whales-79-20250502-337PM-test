import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronLeft, ShoppingCart, Heart, Share2, ArrowLeft } from "lucide-react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { Product, sampleProducts } from "./ShopPage";

export default function ProductDetailPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/shop/product/:productId');
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>(() => {
    // Load cart from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cosmic-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  useEffect(() => {
    // Simulate loading the product
    setLoading(true);
    
    if (params?.productId) {
      const foundProduct = sampleProducts.find(p => p.id === params.productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
        setSelectedImage(getProductImage(foundProduct));
        
        // Scroll to top when product loads
        window.scrollTo(0, 0);
        
        // Add delay to simulate API fetch
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } else {
        // Product not found
        toast({
          title: "Product not found",
          description: "We couldn't find the product you're looking for.",
          variant: "destructive"
        });
        setLocation("/shop");
      }
    }
  }, [params?.productId, setLocation, toast]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cosmic-cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cosmic-cart');
    }
  }, [cart]);

  const addToCart = () => {
    if (!product) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { product, quantity }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const getProductImage = (product: Product): string => {
    // Force using the fallback system for demonstration
    const { name, description, categories = [] } = product;
    const combinedText = `${name} ${description} ${categories.join(' ')}`.toLowerCase();
    
    // Map for category-specific images
    const categoryPlaceholders: Record<string, string> = {
      'healing tools': '/images/products/samples/crystal-bowl.jpg',
      'sound therapy': '/images/products/samples/tibetan-bowl.jpg',
      'jewelry': '/images/products/samples/cosmic-pendant.jpg',
      'energy tools': '/images/products/samples/clear-quartz.jpg',
      'digital': '/images/products/samples/album-cover.jpg',
      'music': '/images/products/samples/album-cover.jpg',
      'meditation': '/images/products/samples/meditation-cushion.jpg',
      'home': '/images/products/samples/crystal-bowl.jpg',
      'art': '/images/products/samples/sacred-geometry.jpg',
      'books': '/images/products/samples/spiritual-journal.jpg',
      'self-development': '/images/products/samples/spiritual-journal.jpg'
    };
    
    // Check if product content matches any specific categories
    if (categories && categories.length > 0) {
      for (const productCategory of categories) {
        const lowerCategory = productCategory.toLowerCase();
        for (const [category, imagePath] of Object.entries(categoryPlaceholders)) {
          if (lowerCategory.includes(category.toLowerCase())) {
            return imagePath;
          }
        }
      }
    }
    
    // Common product types to check for with specific descriptions
    const productTypes = [
      { keywords: ['crystal', 'bowl', 'singing'], image: '/images/products/samples/crystal-bowl.jpg' },
      { keywords: ['clear quartz', 'point', 'amplification'], image: '/images/products/samples/clear-quartz.jpg' },
      { keywords: ['pendant', 'necklace', 'jewelry', 'cosmic'], image: '/images/products/samples/cosmic-pendant.jpg' },
      { keywords: ['album', 'frequency', 'music', 'sound', 'tracks'], image: '/images/products/samples/album-cover.jpg' },
      { keywords: ['cushion', 'meditation', 'cork', 'organic'], image: '/images/products/samples/meditation-cushion.jpg' },
      { keywords: ['geometry', 'art', 'wall', 'hand-painted'], image: '/images/products/samples/sacred-geometry.jpg' },
      { keywords: ['t-shirt', 'cotton'], image: '/images/products/samples/sacred-geometry-tshirt.jpg' },
      { keywords: ['journal', 'diary', 'write', 'book'], image: '/images/products/samples/spiritual-journal.jpg' },
      { keywords: ['amethyst', 'cluster'], image: '/images/products/samples/amethyst-cluster.jpg' },
      { keywords: ['labradorite', 'palm stone'], image: '/images/products/samples/labradorite.jpg' },
      { keywords: ['tibetan', 'metal', 'singing bowl'], image: '/images/products/samples/tibetan-bowl.jpg' },
      { keywords: ['koshi', 'chimes'], image: '/images/products/samples/koshi-chimes.jpg' },
    ];
    
    // Check for keyword matches in name or description
    for (const type of productTypes) {
      if (type.keywords.some(keyword => combinedText.includes(keyword))) {
        return type.image;
      }
    }
    
    // Default to different images based on product ID to ensure unique visuals
    const defaultImages = [
      '/images/products/samples/cosmic-pendant.jpg',
      '/images/products/samples/crystal-bowl.jpg',
      '/images/products/samples/sacred-geometry.jpg',
      '/images/products/samples/meditation-cushion.jpg',
      '/images/products/samples/album-cover.jpg',
    ];
    
    // Use product ID to deterministically select an image
    const idNumber = parseInt(product.id.replace(/\D/g, '')) || 0;
    const defaultImage = defaultImages[idNumber % defaultImages.length];
    return defaultImage;
  };

  // Generate additional product images for the gallery
  const generateProductImages = (product: Product): string[] => {
    // Start with the main product image
    const mainImage = getProductImage(product);
    const images = [mainImage];
    
    // Add related images based on product categories
    if (product.categories.includes('Healing Tools') || product.categories.includes('Sound Therapy')) {
      if (mainImage !== '/images/products/samples/crystal-bowl.jpg') {
        images.push('/images/products/samples/crystal-bowl.jpg');
      }
      if (mainImage !== '/images/products/samples/tibetan-bowl.jpg') {
        images.push('/images/products/samples/tibetan-bowl.jpg');
      }
    }
    
    if (product.categories.includes('Jewelry') || product.categories.includes('Energy Tools')) {
      if (mainImage !== '/images/products/samples/cosmic-pendant.jpg') {
        images.push('/images/products/samples/cosmic-pendant.jpg');
      }
      if (mainImage !== '/images/products/samples/clear-quartz.jpg') {
        images.push('/images/products/samples/clear-quartz.jpg');
      }
    }
    
    if (product.categories.includes('Art') || product.categories.includes('Home')) {
      if (mainImage !== '/images/products/samples/sacred-geometry.jpg') {
        images.push('/images/products/samples/sacred-geometry.jpg');
      }
    }
    
    if (product.categories.includes('Meditation')) {
      if (mainImage !== '/images/products/samples/meditation-cushion.jpg') {
        images.push('/images/products/samples/meditation-cushion.jpg');
      }
    }
    
    if (product.categories.includes('Books') || product.categories.includes('Self-Development')) {
      if (mainImage !== '/images/products/samples/spiritual-journal.jpg') {
        images.push('/images/products/samples/spiritual-journal.jpg');
      }
    }
    
    // Ensure we have at least 3 images by adding defaults if needed
    const defaultExtras = [
      '/images/products/samples/amethyst-cluster.jpg',
      '/images/products/samples/koshi-chimes.jpg',
      '/images/products/samples/labradorite.jpg'
    ];
    
    for (const extra of defaultExtras) {
      if (images.length < 3 && !images.includes(extra)) {
        images.push(extra);
      }
    }
    
    return images;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CosmicBackground opacity={0.2} />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <CosmicBackground opacity={0.2} />
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">We couldn't find the product you're looking for.</p>
        <Button 
          variant="default" 
          onClick={() => setLocation('/shop')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Button>
      </div>
    );
  }

  const productImages = generateProductImages(product);
  const discountedPrice = product.discountPercent
    ? product.price * (1 - product.discountPercent / 100)
    : null;

  return (
    <div className="min-h-screen relative">
      <CosmicBackground opacity={0.3} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm mb-6 space-x-2">
          <Button 
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 hover:bg-transparent p-0 h-auto text-muted-foreground"
            onClick={() => setLocation('/shop')}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shop
          </Button>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative group rounded-lg overflow-hidden bg-muted/30 border border-muted">
                <img 
                  src={selectedImage} 
                  alt={product.name}
                  className="w-full object-cover aspect-square"
                />
                
                {product.new && (
                  <Badge className="absolute top-4 left-4 bg-cyan-500 hover:bg-cyan-600">New</Badge>
                )}
                
                {product.discountPercent && (
                  <Badge className="absolute top-4 right-4 bg-rose-500 hover:bg-rose-600">
                    {product.discountPercent}% OFF
                  </Badge>
                )}
              </div>
              
              {/* Thumbnail gallery */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {productImages.map((image, idx) => (
                  <div 
                    key={idx}
                    className={`w-20 h-20 rounded-md overflow-hidden border-2 cursor-pointer transition-all 
                      ${selectedImage === image ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground'}`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.categories.map(category => (
                    <Badge key={category} variant="secondary">{category}</Badge>
                  ))}
                </div>
                
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500 cosmic-text-glow">
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating) 
                            ? 'text-amber-400 fill-amber-400' 
                            : i < product.rating
                              ? 'text-amber-400 fill-amber-400 opacity-50'
                              : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating.toFixed(1)} rating
                  </span>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
              
              <div className="pt-2">
                {product.discountPercent ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      ${discountedPrice?.toFixed(2)}
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      ${product.price.toFixed(2)}
                    </span>
                    <Badge variant="outline" className="ml-2 text-rose-500 border-rose-500">
                      Save ${(product.price - (discountedPrice || 0)).toFixed(2)}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-2xl font-bold">
                    ${product.price.toFixed(2)}
                  </span>
                )}
                
                <div className="text-sm text-muted-foreground mt-1">
                  {product.inStock ? (
                    <span className="text-emerald-500">In Stock</span>
                  ) : (
                    <span className="text-amber-500">Out of Stock</span>
                  )}
                </div>
              </div>
              
              {/* Product Attributes */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <h3 className="font-medium">Specifications</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-muted-foreground capitalize">{key}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add to Cart */}
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex bg-muted/50 rounded-md border border-input">
                    <button 
                      className="px-3 py-2 border-r border-input"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={!product.inStock}
                    >
                      -
                    </button>
                    <span className="px-4 py-2">{quantity}</span>
                    <button 
                      className="px-3 py-2 border-l border-input"
                      onClick={() => setQuantity(q => q + 1)}
                      disabled={!product.inStock}
                    >
                      +
                    </button>
                  </div>
                  
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={addToCart}
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" disabled={!product.inStock}>
                    <Heart className="h-4 w-4" />
                    Save for Later
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Related Products Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sampleProducts
                .filter(p => p.id !== product.id && p.categories.some(c => product.categories.includes(c)))
                .slice(0, 4)
                .map(relatedProduct => (
                  <Card 
                    key={relatedProduct.id}
                    className="overflow-hidden transition-all hover:shadow-md group border border-muted bg-muted/20"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img 
                        src={getProductImage(relatedProduct)}
                        alt={relatedProduct.name}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      />
                      
                      {relatedProduct.new && (
                        <Badge className="absolute top-2 left-2 bg-cyan-500 hover:bg-cyan-600">New</Badge>
                      )}
                      
                      {relatedProduct.discountPercent && (
                        <Badge className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600">
                          {relatedProduct.discountPercent}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {relatedProduct.categories.slice(0, 2).map(category => (
                          <Badge key={category} variant="outline" className="text-xs">{category}</Badge>
                        ))}
                      </div>
                      
                      <h3 className="font-medium mb-1 line-clamp-1">{relatedProduct.name}</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {relatedProduct.discountPercent ? (
                            <>
                              <span className="font-bold">
                                ${(relatedProduct.price * (1 - relatedProduct.discountPercent / 100)).toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                ${relatedProduct.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="font-bold">${relatedProduct.price.toFixed(2)}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span className="text-xs ml-1">
                            {relatedProduct.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="default"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => setLocation(`/shop/product/${relatedProduct.id}`)}
                      >
                        View Product
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}