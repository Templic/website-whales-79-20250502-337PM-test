
import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Sparkles, 
  Award, 
  Star, 
  Leaf, 
  Gem, 
  Diamond, 
  ShieldPlus, 
  Wallet
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CosmicCollectiblesProps {
  userPoints?: number;
}

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: "common" | "uncommon" | "rare" | "legendary" | "mythic";
  price: number; // in loyalty points
}

const COLLECTIBLES: NFT[] = [
  {
    id: "nft-1",
    name: "Harmonic Resonance",
    description: "A digital representation of the cosmic frequencies that inspire our music.",
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9",
    rarity: "common",
    price: 500
  },
  {
    id: "nft-2", 
    name: "Celestial Aura",
    description: "This digital aura changes colors based on the phases of the moon.",
    image: "https://images.unsplash.com/photo-1464802686167-b939a6910659",
    rarity: "uncommon",
    price: 1000
  },
  {
    id: "nft-3",
    name: "Quantum Vibration",
    description: "An interactive energy pattern that responds to your device's movements.",
    image: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986",
    rarity: "rare",
    price: 2500
  },
  {
    id: "nft-4",
    name: "Astral Gateway",
    description: "Limited-edition digital portal that grants early access to new music releases.",
    image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73",
    rarity: "legendary",
    price: 5000
  },
]

const getRarityColor = (rarity: string) => {
  switch(rarity) {
    case "common": return "bg-blue-400";
    case "uncommon": return "bg-green-400";
    case "rare": return "bg-purple-500";
    case "legendary": return "bg-amber-500";
    case "mythic": return "bg-gradient-to-r from-red-500 via-purple-500 to-blue-500";
    default: return "bg-gray-400";
  }
};

const getRarityIcon = (rarity: string) => {
  switch(rarity) {
    case "common": return <Leaf className="h-3 w-3" />;
    case "uncommon": return <Star className="h-3 w-3" />;
    case "rare": return <Gem className="h-3 w-3" />;
    case "legendary": return <Diamond className="h-3 w-3" />; // Changed from Crystal to Diamond
    case "mythic": return <ShieldPlus className="h-3 w-3" />;
    default: return <Star className="h-3 w-3" />;
  }
};

const CosmicCollectibles = ({ userPoints = 1250 }: CosmicCollectiblesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const handlePurchaseNFT = (nft: NFT) => {
    if (userPoints >= nft.price) {
      toast({
        title: "Digital Collectible Acquired",
        description: `You now own the "${nft.name}" collectible! Check your wallet.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Insufficient Cosmic Points",
        description: `You need ${nft.price - userPoints} more points to acquire this collectible.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full bg-cosmic-dark/40 backdrop-blur-lg rounded-lg border border-cosmic-primary/30 overflow-hidden transition-all duration-300 mb-6"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-cosmic-primary" />
          <h3 className="font-orbitron text-lg text-cosmic-light">Cosmic Collectibles & Rewards</h3>
          <Badge variant="cosmic" className="ml-2">Beta</Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-cosmic-primary/20 backdrop-blur-sm px-3 py-1 rounded-full">
            <Sparkles className="h-4 w-4 text-cosmic-primary animate-pulse" />
            <span className="font-medium text-cosmic-light">{userPoints} Points</span>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="font-space text-cosmic-primary hover:text-cosmic-light hover:bg-cosmic-primary/20">
              {isOpen ? "Hide Collectibles" : "View Collectibles"}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      
      <CollapsibleContent>
        <div className="p-4 pt-0">
          <div className="mb-4 border-t border-cosmic-primary/20 pt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-cosmic-light/80 font-space">
                Earn Cosmic Points with every purchase. Connect your wallet to claim exclusive digital collectibles.
              </p>
              <Button variant="outline" size="sm" className="gap-2 text-xs bg-cosmic-primary/10 border-cosmic-primary/30 hover:bg-cosmic-primary/20">
                <Wallet className="h-3.5 w-3.5" />
                Connect Wallet
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {COLLECTIBLES.map((nft) => (
                <div key={nft.id} className="nft-card nft-glow transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square overflow-hidden">
                    <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-orbitron text-sm text-cosmic-light">{nft.name}</h4>
                      <Badge 
                        className={`text-xs px-2 py-0.5 flex items-center gap-1 ${getRarityColor(nft.rarity)} text-white`}
                      >
                        {getRarityIcon(nft.rarity)}
                        {nft.rarity}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-cosmic-light/70 line-clamp-2 mb-3">{nft.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-cosmic-primary" />
                        <span className="text-xs font-medium">{nft.price} pts</span>
                      </div>
                      
                      <Button 
                        variant={userPoints >= nft.price ? "outline" : "ghost"}
                        size="sm" 
                        className="text-xs h-7 px-2 py-1"
                        onClick={() => handlePurchaseNFT(nft)}
                      >
                        {userPoints >= nft.price ? "Redeem" : "Need More Points"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CosmicCollectibles;
