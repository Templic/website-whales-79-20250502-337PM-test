/**
 * VoiceCommands.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
import React from "react";

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommandsProps {
  onAddToCart?: (productId: string) => void;
  onFilterCategory?: (category: string | null) => void;
  onSearch?: (query: string) => void;
  onToggleCart?: () => void;
  className?: string;
  productId?: string; // Current product ID if on a product page
  availableCategories?: { id: number; name: string }[]; // Available categories for filtering
}



/**
 * Original VoiceCommands component merged from: client/src/components/shop/VoiceCommands.tsx
 * Merge date: 2025-04-05
 */
function VoiceCommandsOriginal({
  onAddToCart,
  onFilterCategory,
  onSearch,
  onToggleCart,
  className = '',
  productId,
  availableCategories = []
}: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const { toast } = useToast();

  // Check for SpeechRecognition support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    setHasSpeechRecognition(!!SpeechRecognition);
  }, []);

  const processVoiceCommand = useCallback((transcript: string) => {
    // Convert to lowercase for easier comparison
    const command = transcript.toLowerCase();
    
    // Handle search commands
    if (command.includes('search for')) {
      const query = command.replace('search for', '').trim();
      if (onSearch && query) {
        onSearch(query);
        toast({
          title: "Voice Search",
          description: `Searching for "${query}"`,
        });
        return true;
      }
    }
    
    // Handle category filtering
    if (command.includes('filter by')) {
      const categoryName = command.replace('filter by', '').trim();
      
      if (command.includes('clear') || categoryName === 'all') {
        if (onFilterCategory) {
          onFilterCategory(null);
          toast({
            title: "Voice Filter",
            description: "Cleared category filters",
          });
          return true;
        }
      } else if (availableCategories.length > 0) {
        // Find the closest matching category
        const matchedCategory = availableCategories.find(
          c => c.name.toLowerCase().includes(categoryName) || 
               categoryName.includes(c.name.toLowerCase())
        );
        
        if (matchedCategory && onFilterCategory) {
          onFilterCategory(matchedCategory.id.toString());
          toast({
            title: "Voice Filter",
            description: `Filtered by "${matchedCategory.name}"`,
          });
          return true;
        } else {
          toast({
            title: "Voice Command Error",
            description: `Couldn't find category "${categoryName}"`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    
    // Handle cart commands
    if (command.includes('add to cart') || command.includes('buy this')) {
      if (productId && onAddToCart) {
        onAddToCart(productId);
        toast({
          title: "Voice Command",
          description: "Added current product to cart",
        });
        return true;
      } else if (!productId) {
        toast({
          title: "Voice Command Error",
          description: "Please go to a product page to add items to cart by voice",
          variant: "destructive",
        });
        return false;
      }
    }
    
    if (command.includes('show cart') || command.includes('open cart')) {
      if (onToggleCart) {
        onToggleCart();
        toast({
          title: "Voice Command",
          description: "Opening shopping cart",
        });
        return true;
      }
    }
    
    // If no command matched
    toast({
      title: "Voice Command Not Recognized",
      description: `Try saying "search for [product]", "filter by [category]", "add to cart", or "show cart"`,
      variant: "destructive",
    });
    return false;
  }, [onAddToCart, onFilterCategory, onSearch, onToggleCart, productId, availableCategories, toast]);

  const toggleVoiceRecognition = useCallback(() => {
    if (!hasSpeechRecognition) {
      toast({
        title: "Voice Commands Unavailable",
        description: "Your browser doesn't support Speech Recognition. Try Chrome or Edge.",
        variant: "destructive",
      });
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
      toast({
        title: "Voice Command Mode Active",
        description: "Say a command like 'search for t-shirts'",
      });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log(`Voice command detected: ${transcript}`);
      processVoiceCommand(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast({
        title: "Voice Recognition Error",
        description: event.error === 'no-speech' 
          ? "No speech was detected. Please try again." 
          : `Error: ${event.error}`,
        variant: "destructive",
      });
    };

    recognition.start();
  }, [hasSpeechRecognition, isListening, processVoiceCommand, toast]);

  if (!hasSpeechRecognition) {
    return null;
  }

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={toggleVoiceRecognition}
      className={`transition-colors ${className}`}
      title={isListening ? "Stop voice command" : "Start voice command"}
    >
      {isListening ? (
        <MicOff className="h-4 w-4 animate-pulse" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function VoiceCommands({
  onAddToCart,
  onFilterCategory,
  onSearch,
  onToggleCart,
  className = '',
  productId,
  availableCategories = []
}: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const { toast } = useToast();

  // Check for SpeechRecognition support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    setHasSpeechRecognition(!!SpeechRecognition);
  }, []);

  const processVoiceCommand = useCallback((transcript: string) => {
    // Convert to lowercase for easier comparison
    const command = transcript.toLowerCase();
    
    // Handle search commands
    if (command.includes('search for')) {
      const query = command.replace('search for', '').trim();
      if (onSearch && query) {
        onSearch(query);
        toast({
          title: "Voice Search",
          description: `Searching for "${query}"`,
        });
        return true;
      }
    }
    
    // Handle category filtering
    if (command.includes('filter by')) {
      const categoryName = command.replace('filter by', '').trim();
      
      if (command.includes('clear') || categoryName === 'all') {
        if (onFilterCategory) {
          onFilterCategory(null);
          toast({
            title: "Voice Filter",
            description: "Cleared category filters",
          });
          return true;
        }
      } else if (availableCategories.length > 0) {
        // Find the closest matching category
        const matchedCategory = availableCategories.find(
          c => c.name.toLowerCase().includes(categoryName) || 
               categoryName.includes(c.name.toLowerCase())
        );
        
        if (matchedCategory && onFilterCategory) {
          onFilterCategory(matchedCategory.id.toString());
          toast({
            title: "Voice Filter",
            description: `Filtered by "${matchedCategory.name}"`,
          });
          return true;
        } else {
          toast({
            title: "Voice Command Error",
            description: `Couldn't find category "${categoryName}"`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    
    // Handle cart commands
    if (command.includes('add to cart') || command.includes('buy this')) {
      if (productId && onAddToCart) {
        onAddToCart(productId);
        toast({
          title: "Voice Command",
          description: "Added current product to cart",
        });
        return true;
      } else if (!productId) {
        toast({
          title: "Voice Command Error",
          description: "Please go to a product page to add items to cart by voice",
          variant: "destructive",
        });
        return false;
      }
    }
    
    if (command.includes('show cart') || command.includes('open cart')) {
      if (onToggleCart) {
        onToggleCart();
        toast({
          title: "Voice Command",
          description: "Opening shopping cart",
        });
        return true;
      }
    }
    
    // If no command matched
    toast({
      title: "Voice Command Not Recognized",
      description: `Try saying "search for [product]", "filter by [category]", "add to cart", or "show cart"`,
      variant: "destructive",
    });
    return false;
  }, [onAddToCart, onFilterCategory, onSearch, onToggleCart, productId, availableCategories, toast]);

  const toggleVoiceRecognition = useCallback(() => {
    if (!hasSpeechRecognition) {
      toast({
        title: "Voice Commands Unavailable",
        description: "Your browser doesn't support Speech Recognition. Try Chrome or Edge.",
        variant: "destructive",
      });
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
      toast({
        title: "Voice Command Mode Active",
        description: "Say a command like 'search for t-shirts'",
      });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log(`Voice command detected: ${transcript}`);
      processVoiceCommand(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast({
        title: "Voice Recognition Error",
        description: event.error === 'no-speech' 
          ? "No speech was detected. Please try again." 
          : `Error: ${event.error}`,
        variant: "destructive",
      });
    };

    recognition.start();
  }, [hasSpeechRecognition, isListening, processVoiceCommand, toast]);

  if (!hasSpeechRecognition) {
    return null;
  }

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={toggleVoiceRecognition}
      className={`transition-colors ${className}`}
      title={isListening ? "Stop voice command" : "Start voice command"}
    >
      {isListening ? (
        <MicOff className="h-4 w-4 animate-pulse" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}