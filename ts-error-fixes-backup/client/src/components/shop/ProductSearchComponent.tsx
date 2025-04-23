/**
 * ProductSearchComponent.tsx
 * 
 * A specialized search component for the shop section that allows
 * searching products with dropdown results and quick access
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ShoppingBag, Tag, Star, XCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { Product } from '@/types/shop';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';

interface ProductSearchComponentProps {
  onResultClick?: (product: Product) => void;
  className?: string;
  placeholder?: string;
}

export default function ProductSearchComponent({
  onResultClick,
  className = '',
  placeholder = 'Search products...'
}: ProductSearchComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'name' | 'category' | 'description'>('all');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, navigate] = useLocation();
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Search function with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        // Call the API with filters
        const response = await axios.get('/api/shop/search', {
          params: {
            q: searchQuery,
            filter: searchFilter !== 'all' ? searchFilter : undefined
          }
        });
        
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, searchFilter]);

  // Handle clicking a search result
  const handleResultClick = (product: Product) => {
    // Close the popover
    setOpen(false);
    
    // Clear the search
    setSearchQuery('');
    
    // If a callback was provided, use it
    if (onResultClick) {
      onResultClick(product);
      return;
    }
    
    // Otherwise, navigate to the product page
    navigate(`/shop/product/${product.id}`);
  };

  // Handle adding product to cart
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent triggering the parent click
    
    addToCart(product);
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
      variant: "default"
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}&filter=${searchFilter}`);
      setOpen(false);
    }
  };

  // Get the highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-cyan-500/20 text-cyan-300">{part}</span> : part
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-10 py-2 w-full bg-black/30 focus:bg-black/40 transition-colors border-purple-700/30 focus:border-purple-500/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 opacity-70 hover:opacity-100"
                  onClick={() => setSearchQuery('')}
                  type="button"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[60vh] overflow-auto" 
            align="start"
          >
            <Command className="rounded-lg border-0">
              <div className="px-3 pt-3 pb-1">
                <Tabs defaultValue={searchFilter} onValueChange={(v$2 => setSearchFilter(v)} className="w-full">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="all" className="text-xs">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="name" className="text-xs">
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      Name
                    </TabsTrigger>
                    <TabsTrigger value="category" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      Category
                    </TabsTrigger>
                    <TabsTrigger value="description" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Description
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CommandInput
                placeholder="Type to search products..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-b-0"
              />
              <CommandList>
                {loading ? (
                  <div className="py-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Searching products...</p>
                  </div>
                ) : (
                  <>
                    <CommandEmpty className="py-6 text-center">
                      <p>No products found for "{searchQuery}"</p>
                      <p className="text-sm text-muted-foreground mt-1">Try a different search term or filter</p>
                    </CommandEmpty>

                    {searchResults.length > 0 && (
                      <CommandGroup heading="Products">
                        {searchResults.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`product-${product.id}`}
                            className="py-2 cursor-pointer"
                            onSelect={() => handleResultClick(product)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              {product.images && product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-12 w-12 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded bg-purple-800/30 flex items-center justify-center flex-shrink-0">
                                  <ShoppingBag className="h-5 w-5 text-purple-300" />
                                </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">
                                    {highlightMatch(product.name, searchQuery)}
                                  </p>
                                  <span className="font-bold text-green-400">
                                    ${product.price.toFixed(2)}
                                  </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {product.category && (
                                    <Badge variant="outline" className="text-xs py-0 px-1">
                                      {highlightMatch(product.category, searchQuery)}
                                    </Badge>
                                  )}
                                  
                                  {product.ratings && product.ratings.average && (
                                    <div className="flex items-center text-amber-400 text-xs">
                                      <Star className="h-3 w-3 fill-amber-400 mr-0.5" />
                                      {product.ratings.average.toFixed(1)}
                                    </div>
                                  )}
                                </div>
                                
                                {product.description && searchFilter === 'description' && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {highlightMatch(product.description, searchQuery)}
                                  </p>
                                )}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto flex-shrink-0 h-8 px-2 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30"
                                onClick={(e) => handleAddToCart(e, product)}
                              >
                                <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                                Add
                              </Button>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button type="submit" className="sr-only">Search</Button>
    </form>
  );
}