
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import type { SpeechRecognition } from "@/types/speechRecognition";

interface VoiceCommandsProps {
  onAddToCart: (productId: string) => void;
  onFilterCategory: (category: string | null) => void;
  onSearch: (query: string) => void;
}

const VoiceCommands = ({ onAddToCart, onFilterCategory, onSearch }: VoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      toast({
        title: "Voice commands not supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setTranscript(command);
      processCommand(command);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast({
        title: "Voice recognition error",
        description: `Error: ${event.error}`,
        variant: "destructive"
      });
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.abort();
      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current?.start();
      setIsListening(true);
      toast({
        title: "Listening for commands",
        description: "Try saying: 'show clothes', 'add item 1 to cart', or 'search vinyl'",
      });
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast({
        title: "Could not start voice recognition",
        description: "There was an error starting the voice recognition service.",
        variant: "destructive"
      });
    }
  };

  const processCommand = (command: string) => {
    if (command.includes("show all") || command.includes("show everything")) {
      onFilterCategory(null);
      speak("Showing all products");
      return;
    }
    
    if (command.includes("show clothes") || command.includes("show clothing")) {
      onFilterCategory("clothing");
      speak("Showing clothing items");
      return;
    }
    
    if (command.includes("show accessories")) {
      onFilterCategory("accessories");
      speak("Showing accessories");
      return;
    }
    
    if (command.includes("show music") || command.includes("show vinyl")) {
      onFilterCategory("music");
      speak("Showing music items");
      return;
    }
    
    if (command.includes("show collectibles")) {
      onFilterCategory("collectibles");
      speak("Showing collectibles");
      return;
    }
    
    const addToCartMatch = command.match(/add (item|product)? ?(\d+) to( my)? cart/i);
    if (addToCartMatch && addToCartMatch[2]) {
      const productId = addToCartMatch[2];
      onAddToCart(productId);
      speak(`Adding item ${productId} to your cart`);
      return;
    }
    
    const searchMatch = command.match(/search (for )?([a-z0-9 ]+)/i);
    if (searchMatch && searchMatch[2]) {
      const searchTerm = searchMatch[2].trim();
      onSearch(searchTerm);
      speak(`Searching for ${searchTerm}`);
      return;
    }
    
    speak("I didn't understand that command. Try again.");
    toast({
      title: "Command not recognized",
      description: "Try saying: 'show clothes', 'add item 1 to cart', or 'search vinyl'",
    });
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative group">
      <Button
        onClick={toggleListening}
        variant={isListening ? "destructive" : "outline"}
        className={`relative ${isListening ? "animate-pulse" : ""} hover:bg-cosmic-primary/30 transition-all duration-300`}
        size="icon"
      >
        {isListening ? 
          <MicOff className="h-5 w-5" /> : 
          <div className="relative">
            <Mic className="h-5 w-5" />
            <span className="absolute -right-1 -top-1">
              <Sparkles className="h-2 w-2 text-cosmic-primary animate-pulse" />
            </span>
          </div>
        }
      </Button>
      
      {transcript && (
        <div className="absolute top-full mt-2 right-0 bg-background/40 backdrop-blur-md p-3 rounded-md border border-cosmic-primary/30 text-xs min-w-48 z-10 shadow-lg shadow-cosmic-primary/20 animate-fade-in">
          <div className="flex items-center gap-1 text-cosmic-primary mb-1">
            <Volume2 className="h-3 w-3" />
            <span>Cosmic command recognized:</span>
          </div>
          <p className="font-medium text-cosmic-light">{transcript}</p>
          <Badge variant="cosmic" className="mt-2 text-[10px]">Voice Activated</Badge>
        </div>
      )}
    </div>
  );
};

export default VoiceCommands;
