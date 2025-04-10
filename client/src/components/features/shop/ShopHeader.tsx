/**
 * ShopHeader.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  ShoppingCart,
  Mic, 
  MicOff,
  Home,
  ShoppingBag
} from 'lucide-react';
import CosmicButton from '@/components/features/cosmic/cosmic-button';
import { 
  ShopHeaderProps, 
  SpeechRecognition, 
  SpeechRecognitionEvent 
} from '@/types/shop';

const ShopHeader: React.FC<ShopHeaderProps> = ({ 
  onSearch, 
  onVoiceSearch,
  cartItemCount = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  // Toggle voice search
  const toggleVoiceSearch = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Start speech recognition
  const startSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      try {
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

          setSearchQuery(transcript);

          if (event.results[0].isFinal) {
            setIsRecording(false);
            onVoiceSearch?.(transcript);
          }
        };

        recognitionInstance.onerror = () => {
          setIsRecording(false);
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        recognitionInstance.start();
        setIsRecording(true);

        // Set as any to bypass TypeScript type checking as these are incompatible types
        setRecognition(recognitionInstance as any);
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
      }
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };

  // Stop speech recognition
  const stopSpeechRecognition = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

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

          {(onVoiceSearch && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={toggleVoiceSearch}
              className="cosmic-hover-glow"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

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

export default ShopHeader;