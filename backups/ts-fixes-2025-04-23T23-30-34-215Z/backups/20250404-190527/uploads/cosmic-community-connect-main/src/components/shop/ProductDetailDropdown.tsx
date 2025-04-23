
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '@/pages/Shop';
import { cn } from '@/lib/utils';

interface ProductDetailDropdownProps {
  product: Product;
}

const ProductDetailDropdown = ({ product }: ProductDetailDropdownProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-1 text-sm text-cosmic-primary focus:outline-none group"
      >
        <span className="font-medium group-hover:underline">
          {isExpanded ? 'Hide Details' : 'View Details'}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isExpanded ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
      )}>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground">Description</h4>
            <p>{product.description}</p>
          </div>
          
          {product.backstory && (
            <div>
              <h4 className="font-medium text-foreground">Backstory</h4>
              <p>{product.backstory}</p>
            </div>
          )}
          
          {product.inspiration && (
            <div>
              <h4 className="font-medium text-foreground">Inspiration</h4>
              <p>{product.inspiration}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-foreground">Details</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Category: {product.category}</li>
              <li>Handcrafted with cosmic intention</li>
              <li>Limited availability</li>
              <li>Free cosmic energy included</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailDropdown;
