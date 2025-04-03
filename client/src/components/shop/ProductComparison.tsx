import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { Product } from "@/pages/imported-pages/CosmicMerchandisePage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProductComparisonProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function ProductComparison({ products, onAddToCart }: ProductComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Toggle product selection for comparison
  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Filter products for comparison
  const productsToCompare = products.filter(product => 
    selectedProducts.includes(product.id)
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mb-12 bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Scale className="h-5 w-5 text-purple-400 mr-2" />
          <h3 className="text-lg font-semibold">Product Comparison</h3>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="ml-2">{isOpen ? "Hide" : "Show"} Comparison</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="mt-4">
        {selectedProducts.length < 2 ? (
          <div className="mb-6">
            <p className="text-muted-foreground mb-4">
              Select at least two products below to compare their features and benefits.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedProducts.includes(product.id)
                      ? "border-purple-500/50 bg-purple-500/5"
                      : "border-gray-500/20 hover:border-purple-500/30"
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                    </div>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                      selectedProducts.includes(product.id)
                        ? "bg-purple-500 text-white"
                        : "bg-gray-500/20"
                    }`}>
                      {selectedProducts.includes(product.id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Comparing {selectedProducts.length} Products</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedProducts([])}
              >
                Clear Selection
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Feature</TableHead>
                    {productsToCompare.map((product) => (
                      <TableHead key={product.id} className="min-w-[160px]">
                        {product.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Price</TableCell>
                    {productsToCompare.map((product) => (
                      <TableCell key={`${product.id}-price`}>
                        ${product.price.toFixed(2)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rating</TableCell>
                    {productsToCompare.map((product) => (
                      <TableCell key={`${product.id}-rating`}>
                        {product.rating}/5
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">In Stock</TableCell>
                    {productsToCompare.map((product) => (
                      <TableCell key={`${product.id}-stock`}>
                        {product.inStock ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Featured</TableCell>
                    {productsToCompare.map((product) => (
                      <TableCell key={`${product.id}-featured`}>
                        {product.featured ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">New Release</TableCell>
                    {productsToCompare.map((product) => (
                      <TableCell key={`${product.id}-new`}>
                        {product.new ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Discount</TableCell>
                    {productsToCompare.map((product) => (
                      <TableCell key={`${product.id}-discount`}>
                        {product.discountPercent ? (
                          <span className="text-green-500">{product.discountPercent}% off</span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Categories</TableCell>
                    {productsToCompare.map((product) => (
                      <TableCell key={`${product.id}-categories`}>
                        <div className="flex flex-wrap gap-1">
                          {product.categories.map((category, idx) => (
                            <span 
                              key={`${product.id}-cat-${idx}`}
                              className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {productsToCompare.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full overflow-hidden mb-4">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h4 className="font-medium mb-1">{product.name}</h4>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <Button
                      onClick={() => onAddToCart(product)}
                      className="w-full"
                    >
                      Add to Cart - ${product.price.toFixed(2)}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}