
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Stars from "@/components/Stars";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import ShopProducts from "@/components/shop/ShopProducts";
import ShoppingCart from "@/components/shop/ShoppingCart";
import ShopHeader from "@/components/shop/ShopHeader";
import PaymentSelector from "@/components/shop/PaymentSelector";
import EnhancedShopping from "@/components/shop/EnhancedShopping";
import CosmicCollectibles from "@/components/shop/CosmicCollectibles";
import SampleOrder from "@/components/shop/SampleOrder";
import ProductComparison from "@/components/shop/ProductComparison";
import Wishlist from "@/components/shop/Wishlist";
import OrderTracking from "@/components/shop/OrderTracking";
import { SacredGeometry } from "@/components/ui/sacred-geometry";
import { Button } from "@/components/ui/button";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "clothing" | "accessories" | "music" | "collectibles";
  backstory?: string;
  inspiration?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Cosmic Harmony T-Shirt",
    description: "Handcrafted t-shirt with cosmic designs that resonate with healing frequencies.",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    category: "clothing",
    backstory: "The design for this shirt came to us during a deep meditation session under the stars at Joshua Tree. The patterns channel the energy of celestial bodies.",
    inspiration: "Inspired by ancient star maps and the geometric patterns of cosmic energy fields that surround us all."
  },
  {
    id: "2",
    name: "Celestial Sound Pendant",
    description: "A beautiful pendant that vibrates with cosmic energy, enhancing your connection to universal harmonies.",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    category: "accessories",
    backstory: "Each pendant is tuned to 528Hz, the 'love frequency' that promotes transformation and miraculous changes. Craftspeople meditate before creating each piece.",
    inspiration: "Inspired by the sacred geometry found in nature and throughout the universe, particularly the Golden Ratio."
  },
  {
    id: "3",
    name: "Cosmic Dreams Vinyl",
    description: "Limited edition vinyl record with our most popular cosmic healing tracks embedded with intentions of peace.",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    category: "music",
    backstory: "Recorded during a rare celestial alignment that only occurs once every 12 years. The ambient sounds of the cosmos were captured and woven into the background of each track.",
    inspiration: "Inspired by the sounds of space – the actual electromagnetic vibrations of planets converted into audible frequencies."
  },
  {
    id: "4",
    name: "Astral Projection Hoodie",
    description: "Comfortable hoodie designed with sacred geometry patterns that aid in meditation and astral journeys.",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    category: "clothing"
  },
  {
    id: "5",
    name: "Frequency Crystal Set",
    description: "Set of tuned crystals that complement our music frequencies for deeper healing experiences.",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    category: "collectibles",
    backstory: "These crystals were sourced from ancient energy vortexes around the world. Each set is cleansed under the full moon and programmed with specific healing intentions.",
    inspiration: "Inspired by the ancient crystal healing traditions of Atlantis and Lemuria, combining modern quantum physics with ancient wisdom."
  },
  {
    id: "6",
    name: "Cosmic Healing Digital Album",
    description: "Our complete cosmic healing collection in high-definition digital format with bonus meditation guides.",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    category: "music"
  }
];

const Shop = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(1250);
  const [paymentType, setPaymentType] = useState<string>("stripe");
  const [showSampleOrder, setShowSampleOrder] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    const titles = document.querySelectorAll('.animate-in');
    titles.forEach((title, index) => {
      setTimeout(() => {
        title.classList.add('fade-in');
      }, index * 200);
    });
  }, []);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartTotalWithDiscount = discountAmount > 0 
    ? cartTotal - discountAmount 
    : cartTotal;

  const cartItemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        return prevItems.map((item) => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevItems, { product, quantity: 1 }];
      }
    });

    setLoyaltyPoints(prev => prev + Math.floor(product.price * 2));

    toast.success(`${product.name} has been added to your cart.`);
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => 
      prevItems.filter((item) => item.product.id !== productId)
    );
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems((prevItems) => 
      prevItems.map((item) => 
        item.product.id === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setShowSampleOrder(false);
    setCouponCode(null);
    setDiscountAmount(0);
  };

  const handleVoiceAddToCart = (productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (product) {
      addToCart(product);
    } else {
      toast.error(`Couldn't find product with ID ${productId}`);
    }
  };

  const handleVoiceFilterCategory = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleVoiceSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProductView = (productId: string) => {
    const productElement = document.getElementById(`product-${productId}`);
    if (productElement) {
      productElement.scrollIntoView({ behavior: "smooth" });
      
      productElement.classList.add("ring-4", "ring-cosmic-primary", "ring-opacity-70");
      setTimeout(() => {
        productElement.classList.remove("ring-4", "ring-cosmic-primary", "ring-opacity-70");
      }, 2000);
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setShowSampleOrder(true);
  };
  
  const applyCoupon = (code: string) => {
    // Simple coupon logic for demo purposes
    if (code.toUpperCase() === "COSMIC20") {
      setCouponCode(code);
      setDiscountAmount(cartTotal * 0.2); // 20% discount
    } else if (code.toUpperCase() === "WELCOME10") {
      setCouponCode(code);
      setDiscountAmount(10); // $10 off
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const categories = ["clothing", "accessories", "music", "collectibles"];

  return (
    <div className="relative min-h-screen bg-background">
      <Stars />
      <Navbar />
      
      <div className="cosmic-container py-12">
        <ShopHeader 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          cartItemCount={cartItemCount}
          setIsCartOpen={setIsCartOpen}
          handleVoiceAddToCart={handleVoiceAddToCart}
          handleVoiceFilterCategory={handleVoiceFilterCategory}
          handleVoiceSearch={handleVoiceSearch}
        />
        
        {showSampleOrder ? (
          <>
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => setShowSampleOrder(false)}
                className="text-sm"
              >
                ← Back to Shopping
              </Button>
            </div>
            <SampleOrder 
              cartItems={cartItems} 
              clearCart={clearCart} 
              paymentType={paymentType} 
            />
          </>
        ) : (
          <>
            <SacredGeometry
              variant="pentagon"
              intensity="subtle"
              className="mb-8 flex justify-between items-center"
            >
              <div className="p-4 text-center w-full">
                <h2 className="text-xl font-bold bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
                  Shop Our Cosmic Collection
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Handcrafted items imbued with healing frequencies for mind, body, and spirit.
                </p>
              </div>
            </SacredGeometry>
            
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              <ProductComparison products={PRODUCTS} onAddToCart={addToCart} />
              <Wishlist products={PRODUCTS} onAddToCart={addToCart} />
              <OrderTracking />
            </div>
            
            <CosmicCollectibles userPoints={loyaltyPoints} />
            
            <EnhancedShopping 
              onProductView={handleProductView}
              products={PRODUCTS}
            />

            <PaymentSelector 
              paymentType={paymentType}
              onValueChange={setPaymentType}
            />

            <ShopProducts 
              addToCart={addToCart} 
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
            />
          </>
        )}
      </div>
      
      <Footer />

      <ShoppingCart 
        isOpen={isCartOpen} 
        setIsOpen={setIsCartOpen}
        cartItems={cartItems}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        cartTotal={cartTotalWithDiscount}
        paymentType={paymentType}
        onCheckout={handleCheckout}
        applyCoupon={applyCoupon}
        clearCart={clearCart}
      />
    </div>
  );
};

export default Shop;
