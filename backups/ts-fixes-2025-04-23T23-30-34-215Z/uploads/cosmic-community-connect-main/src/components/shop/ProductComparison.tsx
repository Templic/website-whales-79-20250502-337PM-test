
import { useState } from "react";
import { 
  Sheet, 
  SheetClose, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SacredGeometry } from "@/components/ui/sacred-geometry";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/pages/Shop";
import { ArrowRightLeft, CheckCircle2, PlusCircle, X, MinusCircle } from "lucide-react";

interface ProductComparisonProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductComparison = ({ products, onAddToCart }: ProductComparisonProps) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const availableProducts = products.filter(
    product => !selectedProducts.some(p => p.id === product.id)
  );
  
  const filteredAvailableProducts = activeCategory === "all" 
    ? availableProducts 
    : availableProducts.filter(product => product.category === activeCategory);

  const addToComparison = (product: Product) => {
    if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };
  
  const removeFromComparison = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="bg-cosmic-primary/10 border-cosmic-primary/20 hover:bg-cosmic-primary/20">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Compare Products
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] border-cosmic-primary/20 bg-background/95 backdrop-blur-xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
            Product Comparison
          </SheetTitle>
          <SheetDescription>
            Compare up to 3 products side by side to find the perfect fit for your cosmic journey.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full space-y-6">
          {/* Selected Products for Comparison */}
          {selectedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedProducts.map((product, index) => (
                <SacredGeometry 
                  key={product.id} 
                  variant={index === 0 ? "dodecahedron" : index === 1 ? "vesica-piscis" : "seed-of-life"} 
                  intensity="subtle" 
                  className="relative"
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeFromComparison(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="p-4 flex flex-col items-center">
                    <div className="h-24 w-24 rounded-md overflow-hidden bg-cosmic-primary/10">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="mt-4 font-medium text-center">{product.name}</h3>
                    <p className="text-cosmic-primary font-semibold text-center mt-2">
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-2 line-clamp-2">
                      {product.description}
                    </p>
                    <Button 
                      className="mt-4 w-full bg-cosmic-primary hover:bg-cosmic-vivid" 
                      onClick={() => onAddToCart(product)}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </SacredGeometry>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <SacredGeometry variant="flower-of-life" intensity="medium" className="mx-auto w-24 h-24 flex items-center justify-center">
                <ArrowRightLeft className="h-8 w-8 text-cosmic-primary" />
              </SacredGeometry>
              <h3 className="mt-4 text-lg font-medium">No Products Selected</h3>
              <p className="text-muted-foreground mt-2">
                Select up to 3 products below to compare their features
              </p>
            </div>
          )}

          <Separator />
          
          {/* Comparison Table (when products are selected) */}
          {selectedProducts.length > 1 && (
            <SacredGeometry variant="torus" intensity="subtle" className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="py-2 px-4 font-medium">Category</td>
                      {selectedProducts.map((product) => (
                        <td key={`${product.id}-category`} className="py-2 px-4 text-center capitalize">
                          {product.category}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-cosmic-primary/5">
                      <td className="py-2 px-4 font-medium">Price</td>
                      {selectedProducts.map((product) => (
                        <td key={`${product.id}-price`} className="py-2 px-4 text-center font-medium text-cosmic-primary">
                          {formatPrice(product.price)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">Description</td>
                      {selectedProducts.map((product) => (
                        <td key={`${product.id}-desc`} className="py-2 px-4 text-sm">
                          {product.description}
                        </td>
                      ))}
                    </tr>
                    {selectedProducts.some(p => p.backstory) && (
                      <tr className="bg-cosmic-primary/5">
                        <td className="py-2 px-4 font-medium">Backstory</td>
                        {selectedProducts.map((product) => (
                          <td key={`${product.id}-backstory`} className="py-2 px-4 text-sm">
                            {product.backstory || "Not available"}
                          </td>
                        ))}
                      </tr>
                    )}
                    {selectedProducts.some(p => p.inspiration) && (
                      <tr>
                        <td className="py-2 px-4 font-medium">Inspiration</td>
                        {selectedProducts.map((product) => (
                          <td key={`${product.id}-inspiration`} className="py-2 px-4 text-sm">
                            {product.inspiration || "Not available"}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SacredGeometry>
          )}

          {/* Product Selection */}
          <div className="flex-1 overflow-hidden">
            <h3 className="text-lg font-medium mb-4">Add Products to Compare</h3>
            
            <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="clothing">Clothing</TabsTrigger>
                <TabsTrigger value="accessories">Accessories</TabsTrigger>
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="collectibles">Collectibles</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[20vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredAvailableProducts.map((product, index) => (
                    <SacredGeometry 
                      key={product.id}
                      variant={(index % 4 === 0) ? "torus" : (index % 4 === 1) ? "dodecahedron" : (index % 4 === 2) ? "vesica-piscis" : "seed-of-life"}
                      intensity="subtle"
                      className="flex items-center p-3 hover:bg-cosmic-primary/5 cursor-pointer transition-colors"
                      onClick={() => addToComparison(product)}
                    >
                      <div className="h-12 w-12 rounded-md overflow-hidden mr-3">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{product.name}</h4>
                        <p className="text-xs text-cosmic-primary">{formatPrice(product.price)}</p>
                      </div>
                      <PlusCircle className="h-5 w-5 text-cosmic-primary ml-2" />
                    </SacredGeometry>
                  ))}
                </div>
                
                {filteredAvailableProducts.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No more products available in this category
                  </div>
                )}
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductComparison;
