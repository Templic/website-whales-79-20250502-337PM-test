import { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Mic, 
  MicOff,
  ChevronDown,
  Tag
} from 'lucide-react';
import { CosmicButton } from '@/components/ui/cosmic-button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import CosmicHeading from '@/components/ui/cosmic-heading';
import { Link } from 'wouter';

interface ShopHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  categories: { id: number; name: string }[];
  cartItemCount: number;
  setIsCartOpen: (isOpen: boolean) => void;
  onVoiceAddToCart?: (productId: string) => void;
  onVoiceFilterCategory?: (category: string | null) => void;
  onVoiceSearch?: (query: string) => void;
}

export default function ShopHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  cartItemCount,
  setIsCartOpen,
  onVoiceAddToCart,
  onVoiceFilterCategory,
  onVoiceSearch
}: ShopHeaderProps) {
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const [showVoiceInfo, setShowVoiceInfo] = useState(false);

  // Check for SpeechRecognition support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    setHasSpeechRecognition(!!SpeechRecognition);
  }, []);

  const handleVoiceCommand = () => {
    if (!hasSpeechRecognition) {
      alert("Your browser doesn't support Speech Recognition. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log(`Voice command: ${transcript}`);
      
      // Parse the command
      if (transcript.includes('search for')) {
        const query = transcript.replace('search for', '').trim();
        if (onVoiceSearch) onVoiceSearch(query);
      } else if (transcript.includes('filter by')) {
        const category = transcript.replace('filter by', '').trim();
        const matchedCategory = categories.find(
          c => c.name.toLowerCase() === category
        );
        if (matchedCategory && onVoiceFilterCategory) {
          onVoiceFilterCategory(matchedCategory.id.toString());
        }
      } else if (transcript.includes('add to cart')) {
        // This would need product context to work properly
        if (onVoiceAddToCart) {
          alert("To add a product to cart by voice, view the product detail page first.");
        }
      } else if (transcript.includes('clear filter')) {
        if (onVoiceFilterCategory) onVoiceFilterCategory(null);
      } else if (transcript.includes('show cart')) {
        setIsCartOpen(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <CosmicHeading as="h1" size="xl" weight="bold" className="mr-4">
              Cosmic Shop
            </CosmicHeading>
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/shop">
                <CosmicButton variant="ghost" size="sm">All Products</CosmicButton>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <CosmicButton variant="ghost" size="sm">
                    Categories <ChevronDown className="h-4 w-4 ml-1" />
                  </CosmicButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {categories.map((category) => (
                    <DropdownMenuItem 
                      key={category.id} 
                      onClick={() => setSelectedCategory(
                        selectedCategory === category.id.toString() ? null : category.id.toString()
                      )}
                      className={selectedCategory === category.id.toString() ? "bg-primary/10" : ""}
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <div className="relative flex-grow max-w-md">
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-9 pr-4 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            {hasSpeechRecognition && (
              <div className="relative">
                <CosmicButton
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={handleVoiceCommand}
                  className="transition-colors"
                  onMouseEnter={() => setShowVoiceInfo(true)}
                  onMouseLeave={() => setShowVoiceInfo(false)}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </CosmicButton>
                {showVoiceInfo && (
                  <div className="absolute right-0 top-full mt-2 w-60 p-2 bg-background border border-border rounded-md shadow-md text-xs z-10">
                    <p className="font-semibold mb-1">Voice Commands:</p>
                    <ul className="space-y-1">
                      <li>"Search for [term]"</li>
                      <li>"Filter by [category]"</li>
                      <li>"Clear filter"</li>
                      <li>"Show cart"</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <CosmicButton
              variant="outline"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                >
                  {cartItemCount}
                </Badge>
              )}
            </CosmicButton>
          </div>
        </div>

        {/* Active Filters */}
        {selectedCategory && (
          <div className="flex items-center mt-2 text-sm">
            <span className="text-muted-foreground mr-2">Filters:</span>
            <div className="flex gap-1 flex-wrap">
              {selectedCategory && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  {categories.find(c => c.id.toString() === selectedCategory)?.name}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}