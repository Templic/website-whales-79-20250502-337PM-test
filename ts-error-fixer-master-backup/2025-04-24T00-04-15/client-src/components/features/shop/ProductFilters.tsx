/**
 * ProductFilters.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductFiltersProps {
  categories: string[];
  selectedCategories: string[];
  priceRange: number[];
  onCategoryChange: (categories: string[]) => void;
  onPriceChange: (range: [number, number]) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedCategories,
  priceRange,
  onCategoryChange,
  onPriceChange,
}) => {
  // Handle price input changes
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value) || 0;
    onPriceChange([min, priceRange[1]]);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value) || 0;
    onPriceChange([priceRange[0], max]);
  };

  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    onPriceChange([values[0], values[1]]);
  };

  // Handle category toggle
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    onPriceChange([0, 1000]);
    onCategoryChange([]);
  };

  return (
    <div className="space-y-6 cosmic-glass-card p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold cosmic-gradient-text">Filters</h3>
        <Button 
          variant="ghost" 
          className="text-xs h-8"
          onClick={resetFilters}
        >
          Reset
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['price', 'categories']} className="w-full">
        <AccordionItem value="price" className="border-b">
          <AccordionTrigger className="hover:no-underline py-3">
            <span className="font-medium">Price Range</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2"> {/* Changed to 1 column on mobile */}
              <div className="space-y-1">
                <Label htmlFor="min-price" className="text-xs cosmic-label">Min Price</Label>
                <Input
                  id="min-price"
                  type="number"
                  className="h-8 cosmic-glass-field w-full" {/* Added w-full for mobile */}
                  value={priceRange[0]}
                  onChange={handleMinPriceChange}
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-price" className="text-xs cosmic-label">Max Price</Label>
                <Input
                  id="max-price"
                  type="number"
                  className="h-8 cosmic-glass-field w-full" {/* Added w-full for mobile */}
                  value={priceRange[1]}
                  onChange={handleMaxPriceChange}
                  min={priceRange[0]}
                />
              </div>
            </div>

            <Slider
              defaultValue={[0, 1000]}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={handleSliderChange}
              max={1000}
              step={10}
              className="cosmic-slider"
            />

            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="categories" className="border-b">
          <AccordionTrigger className="hover:no-underline py-3">
            <span className="font-medium">Categories</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                      className="cosmic-checkbox"
                    />
                    <Label
                      htmlFor={`category-${category}`}
                      className="text-sm cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductFilters;