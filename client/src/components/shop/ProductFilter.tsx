import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import CosmicButton from '../ui/cosmic-button';
import CosmicSlider from '../ui/cosmic-slider';
import CosmicCheckbox from '../ui/cosmic-checkbox';
import CosmicHeading from '../ui/cosmic-heading';
import { ProductCategory } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

export interface FilterOptions {
  categories: number[];
  priceRange: [number, number];
  inStock: boolean;
  onSale: boolean;
  featured: boolean;
  sortBy: 'newest' | 'price-low-high' | 'price-high-low' | 'name-a-z' | 'name-z-a';
}

export interface ProductFilterProps {
  categories: ProductCategory[];
  initialFilters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  minPrice: number;
  maxPrice: number;
  isMobile?: boolean;
  className?: string;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  initialFilters,
  onFilterChange,
  minPrice,
  maxPrice,
  isMobile = false,
  className = '',
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    availability: true,
    sort: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleFilterChange = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCategoryToggle = (categoryId: number) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];
    
    handleFilterChange('categories', newCategories);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      categories: [],
      priceRange: [minPrice, maxPrice],
      inStock: false,
      onSale: false,
      featured: false,
      sortBy: 'newest',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => toggleSection('categories')}
        >
          <CosmicHeading as="h3" size="sm">Categories</CosmicHeading>
          {expandedSections.categories ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
        
        {expandedSections.categories && (
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <CosmicCheckbox
                  id={`category-${category.id}`}
                  checked={filters.categories.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  label={category.name}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Price Range */}
      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => toggleSection('price')}
        >
          <CosmicHeading as="h3" size="sm">Price Range</CosmicHeading>
          {expandedSections.price ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
        
        {expandedSections.price && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{formatCurrency(filters.priceRange[0])}</span>
              <span>{formatCurrency(filters.priceRange[1])}</span>
            </div>
            
            <CosmicSlider
              variant="cosmic"
              min={minPrice}
              max={maxPrice}
              step={5}
              value={filters.priceRange}
              onValueChange={(value) => 
                handleFilterChange('priceRange', value as [number, number])
              }
              className="mt-2"
            />
          </div>
        )}
      </div>
      
      {/* Availability */}
      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => toggleSection('availability')}
        >
          <CosmicHeading as="h3" size="sm">Availability</CosmicHeading>
          {expandedSections.availability ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
        
        {expandedSections.availability && (
          <div className="space-y-2">
            <div className="flex items-center">
              <CosmicCheckbox
                id="in-stock"
                checked={filters.inStock}
                onCheckedChange={() => 
                  handleFilterChange('inStock', !filters.inStock)
                }
                label="In Stock"
              />
            </div>
            
            <div className="flex items-center">
              <CosmicCheckbox
                id="on-sale"
                checked={filters.onSale}
                onCheckedChange={() => 
                  handleFilterChange('onSale', !filters.onSale)
                }
                label="On Sale"
              />
            </div>
            
            <div className="flex items-center">
              <CosmicCheckbox
                id="featured"
                checked={filters.featured}
                onCheckedChange={() => 
                  handleFilterChange('featured', !filters.featured)
                }
                label="Featured"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Sort By */}
      <div>
        <div 
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => toggleSection('sort')}
        >
          <CosmicHeading as="h3" size="sm">Sort By</CosmicHeading>
          {expandedSections.sort ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
        
        {expandedSections.sort && (
          <div className="space-y-2">
            <div>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-1 focus:ring-cosmic-primary"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as FilterOptions['sortBy'])}
              >
                <option value="newest">Newest</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="name-a-z">Name: A to Z</option>
                <option value="name-z-a">Name: Z to A</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Clear Filters */}
      <div className="pt-4 border-t border-gray-800">
        <CosmicButton 
          variant="outline" 
          size="sm"
          onClick={handleClearFilters}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </CosmicButton>
      </div>
    </div>
  );

  // Mobile toggle for filters
  if (isMobile) {
    return (
      <div className={className}>
        <div className="mb-4">
          <CosmicButton
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            {isOpen ? 'Hide Filters' : 'Show Filters'}
          </CosmicButton>
        </div>
        
        {isOpen && (
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 mb-6">
            {filterContent}
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 ${className}`}>
      {filterContent}
    </div>
  );
};

export { ProductFilter };
export default ProductFilter;