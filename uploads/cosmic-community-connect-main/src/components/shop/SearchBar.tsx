
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchBar = ({ searchQuery, setSearchQuery }: SearchBarProps) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className={`relative flex-grow transition-all duration-300 ${isSearchFocused ? 'ring-2 ring-cosmic-primary/50 rounded-lg' : ''}`}>
      <Input
        type="text"
        placeholder="Search cosmic merchandise..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        className="pl-10 py-6 border-cosmic-primary/20 bg-cosmic-primary/5 backdrop-blur-sm focus:bg-cosmic-primary/10 font-space"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-primary/70" />
      {searchQuery && (
        <button 
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
          onClick={() => setSearchQuery("")}
        >
          <X className="h-4 w-4 text-cosmic-primary/70 hover:text-cosmic-primary" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
