"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SlidersHorizontal, Check } from "lucide-react"

interface ProductFiltersProps {
  categories: string[];
  materials: string[];
  onFilterChange: (filters: ProductFilters) => void;
  initialFilters?: ProductFilters;
  maxPrice?: number;
}

export interface ProductFilters {
  categories: string[];
  materials: string[];
  priceRange: [number, number];
}

export function ProductFilters({
  categories = [],
  materials = [],
  onFilterChange,
  initialFilters,
  maxPrice = 500
}: ProductFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters?.categories || []);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(initialFilters?.materials || []);
  const [priceRange, setPriceRange] = useState<[number, number]>(initialFilters?.priceRange || [0, maxPrice]);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    updateFilters();
  }, [selectedCategories, selectedMaterials, priceRange]);
  
  const updateFilters = () => {
    onFilterChange({
      categories: selectedCategories,
      materials: selectedMaterials,
      priceRange
    });
  };
  
  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    }
  };
  
  const handleMaterialChange = (material: string, checked: boolean) => {
    if (checked) {
      setSelectedMaterials([...selectedMaterials, material]);
    } else {
      setSelectedMaterials(selectedMaterials.filter(m => m !== material));
    }
  };
  
  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };
  
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= priceRange[1]) {
      setPriceRange([value, priceRange[1]]);
    }
  };
  
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= priceRange[0]) {
      setPriceRange([priceRange[0], value]);
    }
  };
  
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedMaterials([]);
    setPriceRange([0, maxPrice]);
  };
  
  return (
    <div className="mb-6">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 bg-black/20 border-white/10 hover:bg-black/40 hover:border-white/20">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(selectedCategories.length > 0 || selectedMaterials.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice) && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black text-xs font-semibold">
                {selectedCategories.length + selectedMaterials.length + (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0)}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="max-w-sm w-full bg-black/90 border-l border-white/10 backdrop-blur">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-white">Filters</SheetTitle>
            <SheetDescription className="text-white/70">
              Filter products by category, material, and price
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* Price Range Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white">Price Range</h3>
              <Slider
                defaultValue={priceRange}
                min={0}
                max={maxPrice}
                step={10}
                value={priceRange}
                onValueChange={handlePriceChange}
                className="mb-6"
              />
              <div className="flex items-center gap-3">
              <div className="space-y-1">
                <Label htmlFor="min-price" className="text-xs cosmic-label">Min Price</Label>
                <Input
                  id="min-price"
                  type="number"
                  className="h-8 cosmic-glass-field w-full" 
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
                  className="h-8 cosmic-glass-field w-full" 
                  value={priceRange[1]}
                  onChange={handleMaxPriceChange}
                  min={priceRange[0]}
                />
              </div>
              </div>
            </div>
            
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center gap-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => handleCategoryChange(category, checked === true)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm text-white/90 cursor-pointer"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Materials Filter */}
            {materials.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Materials</h3>
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div key={material} className="flex items-center gap-2">
                      <Checkbox
                        id={`material-${material}`}
                        checked={selectedMaterials.includes(material)}
                        onCheckedChange={(checked) => handleMaterialChange(material, checked === true)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <label
                        htmlFor={`material-${material}`}
                        className="text-sm text-white/90 cursor-pointer"
                      >
                        {material}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Clear Filters
              </Button>
              <Button onClick={() => setIsOpen(false)} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Check className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}