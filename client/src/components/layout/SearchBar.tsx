import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';

interface SearchBarProps {
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ className = "" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };
  
  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="
          w-[200px] h-[30px] pl-3 pr-10 py-1
          bg-[rgba(0,0,0,0.3)] text-white
          border border-[rgba(255,255,255,0.1)]
          rounded-md placeholder-[rgba(255,255,255,0.5)]
          focus:outline-none focus:ring-1 focus:ring-cyan-400
          transition-all duration-300
        "
      />
      <button
        type="submit"
        aria-label="Search"
        className="
          absolute right-0 top-0 h-full aspect-square
          flex items-center justify-center
          text-cyan-400 hover:text-cyan-300
          transition-colors duration-300
        "
      >
        <Search size={16} />
      </button>
    </form>
  );
};

export default SearchBar;