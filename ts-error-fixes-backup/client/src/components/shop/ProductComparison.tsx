import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CosmicIcon } from '@/components/cosmic/ui/cosmic-icons';
import { CheckCircle2, XCircle, HelpCircle, ShoppingCart, Star, CircleSlash } from 'lucide-react';

// Product interface
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  description: string;
  features: {
    [key: string]: boolean | string | number;
  };
  recommended?: boolean;
  bestValue?: boolean;
}

// Props interface
interface ProductComparisonProps {
  products?: any[];
  onAddToCart?: (product$2 => void;
}

// Products data for comparison
const crystalProducts: Product[] = [
  {
    id: "crystal-1",
    name: "Celestial Quartz Point",
    price: 49.99,
    image: "/images/merchandise/quartz-crystal.svg",
    rating: 4.7,
    description: "A powerful clear quartz point for energy amplification and spiritual clarity.",
    features: {
      "Energy Amplification": true,
      "Chakra Cleansing": true,
      "Size": "Medium (3-4 inches)",
      "Origin": "Brazil",
      "Clarity": "AAA Grade",
      "Inclusions": "Minimal",
      "Polished": true,
      "Ethically Sourced": true,
      "Energy Programming": false,
      "Certificate of Authenticity": true
    },
    recommended: true
  },
  {
    id: "crystal-2",
    name: "Amethyst Cluster",
    price: 79.99,
    image: "/images/merchandise/amethyst-cluster.svg",
    rating: 4.9,
    description: "Premium quality amethyst cluster for spiritual growth and meditation enhancement.",
    features: {
      "Energy Amplification": true,
      "Chakra Cleansing": true,
      "Size": "Large (5-6 inches)",
      "Origin": "Uruguay",
      "Clarity": "AAA+ Grade",
      "Inclusions": "None",
      "Polished": false,
      "Ethically Sourced": true,
      "Energy Programming": true,
      "Certificate of Authenticity": true
    },
    bestValue: true
  },
  {
    id: "crystal-3",
    name: "Labradorite Palm Stone",
    price: 34.99,
    image: "/images/merchandise/labradorite-stone.svg",
    rating: 4.5,
    description: "Smooth labradorite palm stone for protection and enhancing intuitive abilities.",
    features: {
      "Energy Amplification": false,
      "Chakra Cleansing": true,
      "Size": "Small (2-3 inches)",
      "Origin": "Madagascar",
      "Clarity": "AA Grade",
      "Inclusions": "Natural flash",
      "Polished": true,
      "Ethically Sourced": true,
      "Energy Programming": false,
      "Certificate of Authenticity": false
    }
  }
];

// Sound healing products
const soundProducts: Product[] = [
  {
    id: "sound-1",
    name: "Crystal Singing Bowl - Crown Chakra",
    price: 149.99,
    image: "/images/merchandise/crystal-singing-bowl.svg",
    rating: 5.0,
    description: "Clear quartz singing bowl tuned to the frequency of the Crown Chakra (B note).",
    features: {
      "Material": "Clear Quartz",
      "Chakra Attunement": "Crown",
      "Size": "8 inch",
      "Note": "B",
      "Frequency": "480 Hz",
      "Includes Striker": true,
      "Includes Cushion": true,
      "Handcrafted": true,
      "Sound Duration": "90+ seconds",
      "Certification": true
    },
    recommended: true
  },
  {
    id: "sound-2",
    name: "Koshi Chimes - Earth Element",
    price: 89.99,
    image: "/images/merchandise/tibetan-bowl.svg",
    rating: 4.5,
    description: "Handcrafted Koshi Chimes tuned to the Earth element for grounding and calm.",
    features: {
      "Material": "Bamboo & Metal",
      "Chakra Attunement": "Root",
      "Size": "5.5 inches",
      "Note": "Multiple",
      "Frequency": "Various",
      "Includes Striker": false,
      "Includes Cushion": false,
      "Handcrafted": true,
      "Sound Duration": "30+ seconds",
      "Certification": false
    }
  },
  {
    id: "sound-3",
    name: "Tibetan Singing Bowl Set",
    price: 189.99,
    image: "/images/merchandise/tibetan-bowl.svg",
    rating: 4.9,
    description: "Traditional hand-hammered 7-metal Tibetan singing bowl set with accessories.",
    features: {
      "Material": "7-Metal Alloy",
      "Chakra Attunement": "All Chakras",
      "Size": "Medium (5 inch)",
      "Note": "F#",
      "Frequency": "Multiple",
      "Includes Striker": true,
      "Includes Cushion": true,
      "Handcrafted": true,
      "Sound Duration": "120+ seconds",
      "Certification": true
    },
    bestValue: true
  }
];

const ProductComparison: React.FC<ProductComparisonProps> = ({ products: externalProducts, onAddToCart }) => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(crystalProducts);

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Product Comparison
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Compare features and benefits of similar products to find the perfect match for your spiritual journey.
        </p>
      </div>

      <Tabs 
        defaultValue="crystals" 
        className="w-full"
        onValueChange={(value) => {
          if (value === "crystals") setSelectedProducts(crystalProducts);
          if (value === "sound") setSelectedProducts(soundProducts);
        }}
      >
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="crystals">Crystal Collections</TabsTrigger>
          <TabsTrigger value="sound">Sound Healing</TabsTrigger>
        </TabsList>

        <TabsContent value="crystals" className="mt-6">
          <ComparisonTable products={crystalProducts} onAddToCart={onAddToCart} />
        </TabsContent>

        <TabsContent value="sound" className="mt-6">
          <ComparisonTable products={soundProducts} onAddToCart={onAddToCart} />
        </TabsContent>
      </Tabs>

      <div className="mt-12 relative">
        <div className="absolute inset-0 -z-10"
          style={{
            clipPath: "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
            backgroundColor: "rgba(155, 135, 245, 0.05)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(138, 75, 255, 0.2)"
          }}
        ></div>
        <div className="p-8 relative z-10">
          <h3 className="text-xl font-semibold mb-4 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 cosmic-text-glow">
            <CosmicIcon name="sparkles" size={20} className="mr-2 text-amber-400" />
            Shopping Guide
          </h3>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              When choosing cosmic products, consider these key factors:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CosmicIcon name="star" size={16} className="mt-1 text-purple-400" />
                <span><span className="font-medium">Energetic Resonance:</span> Select items that resonate with your current spiritual needs.</span>
              </li>
              <li className="flex items-start gap-2">
                <CosmicIcon name="moon" size={16} className="mt-1 text-purple-400" />
                <span><span className="font-medium">Authenticity:</span> We ensure all products are authentic and ethically sourced.</span>
              </li>
              <li className="flex items-start gap-2">
                <CosmicIcon name="headphones" size={16} className="mt-1 text-purple-400" />
                <span><span className="font-medium">Quality:</span> Higher quality materials provide clearer energy transmission and longer-lasting benefits.</span>
              </li>
              <li className="flex items-start gap-2">
                <CosmicIcon name="sparkles" size={16} className="mt-1 text-purple-400" />
                <span><span className="font-medium">Intuition:</span> Trust your intuition when selecting cosmic tools—your higher self knows what you need.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Comparison table component
const ComparisonTable: React.FC<{ products: Product[], onAddToCart?: (product$2 => void }> = ({ products, onAddToCart }) => {
  // Get all unique feature keys from all products
  const allFeatures = Array.from(
    new Set(
      products.flatMap(product => Object.keys(product.features))
    )
  );

  return (
    <div className="overflow-x-auto">
      <Table className="cosmic-glass-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Features</TableHead>
            {products.map((product) => (
              <TableHead key={product.id} className="text-center min-w-[200px]">
                <div className="space-y-2">
                  <div className="mx-auto w-20 h-20 mb-2 overflow-hidden" 
                      style={{
                        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                      }}>
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <h3 className="font-medium">{product.name}</h3>
                  <div className="flex justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={`${i < Math.round(product.rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} 
                      />
                    ))}
                  </div>
                  <p className="text-lg font-bold">${product.price.toFixed(2)}</p>

                  <div className="flex flex-col gap-2">
                    {product.recommended && (
                      <Badge className="bg-purple-500 text-white mx-auto w-fit">
                        Recommended
                      </Badge>
                    )}
                    {product.bestValue && (
                      <Badge className="bg-emerald-500 text-white mx-auto w-fit">
                        Best Value
                      </Badge>
                    )}
                  </div>

                  <Button 
                    size="sm" 
                    className="mt-2 bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border-0 cosmic-hover-glow"
                    onClick={() => onAddToCart && onAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Description</TableCell>
            {products.map((product) => (
              <TableCell key={`${product.id}-desc`} className="text-sm">
                {product.description}
              </TableCell>
            ))}
          </TableRow>

          {allFeatures.map((feature) => (
            <TableRow key={feature}>
              <TableCell className="font-medium">{feature}</TableCell>
              {products.map((product) => (
                <TableCell key={`${product.id}-${feature}`} className="text-center">
                  {renderFeatureValue(product.features[feature])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Helper function to render feature values appropriately
const renderFeatureValue = (value$2 => {
  if (value === undefined) {
    return <HelpCircle className="h-5 w-5 text-muted-foreground mx-auto" />;
  }

  if (typeof value === 'boolean') {
    return value ? 
      <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" /> : 
      <XCircle className="h-5 w-5 text-red-400 mx-auto" />;
  }

  if (value === null || value === '') {
    return <CircleSlash className="h-5 w-5 text-muted-foreground mx-auto" />;
  }

  return <span>{value}</span>;
};

export default ProductComparison;