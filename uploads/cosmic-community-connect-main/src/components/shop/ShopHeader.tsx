
import { ShoppingBag } from "lucide-react";
import VoiceCommands from "@/components/shop/VoiceCommands";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";

interface ShopHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  categories: string[];
  cartItemCount: number;
  setIsCartOpen: (isOpen: boolean) => void;
  handleVoiceAddToCart: (productId: string) => void;
  handleVoiceFilterCategory: (category: string | null) => void;
  handleVoiceSearch: (query: string) => void;
}

const ShopHeader = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  cartItemCount,
  setIsCartOpen,
  handleVoiceAddToCart,
  handleVoiceFilterCategory,
  handleVoiceSearch
}: ShopHeaderProps) => {
  return (
    <div className="flex flex-col space-y-6 mb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cosmic-light via-cosmic-primary to-cosmic-blue bg-clip-text text-transparent animate-in font-orbitron">
          Cosmic Merchandise
        </h1>
        
        <div className="flex items-center gap-2">
          <VoiceCommands 
            onAddToCart={handleVoiceAddToCart}
            onFilterCategory={handleVoiceFilterCategory}
            onSearch={handleVoiceSearch}
          />
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-cosmic-primary/20 backdrop-blur-sm rounded-full hover:bg-cosmic-primary/30 transition-colors group"
            aria-label="Open shopping cart"
          >
            <ShoppingBag className="h-6 w-6 text-cosmic-primary group-hover:scale-110 transition-transform" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cosmic-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse-gentle">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 animate-in">
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
      </div>
    </div>
  );
};

export default ShopHeader;
