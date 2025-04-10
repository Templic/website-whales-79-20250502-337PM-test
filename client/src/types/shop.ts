/**
 * shop.ts
 * 
 * Contains centralized type definitions for the shop features
 * and components.
 */

/**
 * Represents a product in the shop
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  inStock: boolean;
  categories: string[];
  featured?: boolean;
  new?: boolean;
  discountPercent?: number;
  attributes?: {
    [key: string]: string;
  };
}

/**
 * Represents an item in the shopping cart
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Props for the ShoppingCart component
 */
export interface ShoppingCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  total: number;
}

/**
 * Props for the ShopHeader component
 */
export interface ShopHeaderProps {
  onSearch: (query: string) => void;
  onVoiceSearch?: (transcript: string) => void;
  cartItemCount?: number;
}

/**
 * Voice recognition related types for shop components
 */
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

/**
 * Speech Recognition Constructor type
 */
export interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

// The global type declarations need to be exported to avoid conflicts
export {}

/**
 * Global SpeechRecognition type extension
 */
// This is a type declaration, not an actual interface implementation
// Use this in components where speech recognition is used
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}