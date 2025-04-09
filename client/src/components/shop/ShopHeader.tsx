import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Search, ShoppingCart } from "lucide-react";
import CosmicButton from "../ui/cosmic-button";

/**
 * ShopHeader component
 * Provides search functionality and navigation for the shop page
 */

export interface ShopHeaderProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  allCategories: string[];
  categoryFilter: string[];
  setCategoryFilter: (categories: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortOrder: string;
  setSortOrder: (sort: string) => void;
  viewType: "list" | "grid";
  setViewType: React.Dispatch<React.SetStateAction<"list" | "grid">>;
  onSearch?: (query: string) => void;
  cartItemCount?: number;
}

const ShopHeader: React.FC<ShopHeaderProps> = ({ 
  searchQuery,
  setSearchQuery,
  allCategories,
  categoryFilter,
  setCategoryFilter,
  priceRange,
  setPriceRange,
  sortOrder,
  setSortOrder,
  viewType,
  setViewType,
  onSearch,
  cartItemCount = 0
}) => {
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (onSearch) onSearch(value);
    }, 300);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full cosmic-glass-card p-4 rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="cosmic-hover-glow">
              <Home className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/shop">
            <h1 className="text-xl md:text-2xl font-bold cosmic-gradient-text">Cosmic Shop</h1>
          </Link>

          <nav className="hidden md:flex space-x-1">
            <Button variant="ghost" asChild className="text-sm cosmic-hover-text">
              <Link href="/shop/clothing">Clothing</Link>
            </Button>
            <Button variant="ghost" asChild className="text-sm cosmic-hover-text">
              <Link href="/shop/accessories">Accessories</Link>
            </Button>
            <Button variant="ghost" asChild className="text-sm cosmic-hover-text">
              <Link href="/shop/digital">Digital</Link>
            </Button>
          </nav>
        </div>

        <div className="w-full md:w-auto flex items-center gap-2">
          <form 
            onSubmit={handleSearchSubmit}
            className="relative w-full md:w-64 lg:w-80"
          >
            <Input
              type="search"
              placeholder="Search products..."
              className="cosmic-glass-field pr-10"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button 
              type="submit"
              variant="ghost" 
              size="icon"
              className="absolute right-0 top-0 h-10 w-10"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <Link href="/shop/cart">
            <div className="relative">
              <CosmicButton
                size="icon"
                variant="cosmic"
                className="md:hidden"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                    variant="default"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </CosmicButton>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ShopHeader };