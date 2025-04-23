
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  categories: string[];
}

const CategoryFilter = ({ selectedCategory, setSelectedCategory, categories }: CategoryFilterProps) => {
  return (
    <div className="flex overflow-x-auto space-x-2 py-1 md:justify-end">
      <Badge 
        variant={!selectedCategory ? "nebula" : "stardust"}
        className="cursor-pointer px-4 py-2 flex items-center space-x-1 cosmic-interactive font-space"
        onClick={() => setSelectedCategory(null)}
      >
        <Sparkles className="h-3 w-3 mr-1" />
        <span>All</span>
      </Badge>
      
      {categories.map((category) => (
        <Badge 
          key={category}
          variant={selectedCategory === category ? "nebula" : "stardust"}
          className="cursor-pointer px-4 py-2 capitalize cosmic-interactive font-space"
          onClick={() => setSelectedCategory(category)}
        >
          {category}
        </Badge>
      ))}
    </div>
  );
};

export default CategoryFilter;
