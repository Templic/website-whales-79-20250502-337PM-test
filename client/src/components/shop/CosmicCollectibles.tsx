import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Gem, Star, Lock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CosmicCollectiblesProps {
  userPoints: number;
}

// Items that can be redeemed with points
interface CollectibleItem {
  id: string;
  name: string;
  description: string;
  image: string;
  pointCost: number;
  limited?: boolean;
  exclusive?: boolean;
}

// Sample collectible items
const collectibles: CollectibleItem[] = [
  {
    id: "collectible-1",
    name: "Celestial Crystal Meditation Tool",
    description: "A handcrafted crystal tool designed for enhanced meditation practices",
    image: "https://images.unsplash.com/photo-1611695628695-1071c6727e6c?auto=format&fit=crop&w=500&q=80",
    pointCost: 1500,
    exclusive: true
  },
  {
    id: "collectible-2",
    name: "Limited Edition Cosmic Print",
    description: "Signed cosmic artwork print, limited to only 100 copies worldwide",
    image: "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=500&q=80",
    pointCost: 2200,
    limited: true
  },
  {
    id: "collectible-3",
    name: "Cosmic Energy Necklace",
    description: "Handmade necklace designed to align with cosmic energies",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=80",
    pointCost: 3500
  }
];

export default function CosmicCollectibles({ userPoints }: CosmicCollectiblesProps) {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<CollectibleItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Handle selecting an item
  const selectItem = (item: CollectibleItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  // Handle redeeming an item with points
  const redeemItem = () => {
    if (!selectedItem) return;
    
    if (userPoints < selectedItem.pointCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${selectedItem.pointCost - userPoints} more points to redeem this item.`,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Item Redeemed!",
      description: `You have successfully redeemed the ${selectedItem.name}.`,
    });
    
    setDialogOpen(false);
  };

  // Calculate the nearest redeemable item
  const nearestRedeemable = collectibles
    .filter(item => item.pointCost > userPoints)
    .sort((a, b) => a.pointCost - b.pointCost)[0];
  
  const pointsNeeded = nearestRedeemable ? nearestRedeemable.pointCost - userPoints : 0;
  const progressPercentage = nearestRedeemable 
    ? (userPoints / nearestRedeemable.pointCost) * 100 
    : 100;

  return (
    <div className="cosmic-collectibles">
      <Card className="cosmic-glass-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Gem className="h-6 w-6 text-purple-400 mr-2" />
            <h3 className="text-xl font-semibold">Cosmic Collectibles</h3>
          </div>
          <div className="flex items-center">
            <Star className="h-5 w-5 text-amber-400 mr-1" />
            <span className="text-lg font-bold">{userPoints.toLocaleString()} points</span>
          </div>
        </div>
        
        {nearestRedeemable && (
          <div className="mb-6">
            <div className="flex justify-between mb-2 text-sm">
              <span>Current Points</span>
              <span>{nearestRedeemable.pointCost} needed for next reward</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Earn {pointsNeeded} more points to unlock {nearestRedeemable.name}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collectibles.map((item) => (
            <Card 
              key={item.id} 
              className={`overflow-hidden transition-all cosmic-hover-scale ${
                userPoints >= item.pointCost 
                  ? "border-purple-500/30" 
                  : "border-gray-500/20 opacity-70"
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
                {item.limited && (
                  <Badge className="absolute top-2 right-2 bg-amber-500">
                    Limited Edition
                  </Badge>
                )}
                {item.exclusive && (
                  <Badge className="absolute top-2 right-2 bg-purple-500">
                    Exclusive
                  </Badge>
                )}
                {userPoints < item.pointCost && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="h-8 w-8 mx-auto mb-2 text-white/70" />
                      <span className="text-sm font-medium">
                        {item.pointCost - userPoints} more points
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="font-medium truncate">{item.name}</h4>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-amber-400">
                    <Sparkles className="h-4 w-4 mr-1" />
                    <span>{item.pointCost.toLocaleString()} points</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant={userPoints >= item.pointCost ? "default" : "outline"}
                    onClick={() => selectItem(item)}
                    disabled={userPoints < item.pointCost}
                  >
                    Redeem
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Earn points for every purchase. Special items can only be acquired through our loyalty program.
          </p>
          <Button variant="outline" size="sm">View All Collectibles</Button>
        </div>
      </Card>
      
      {/* Item Redemption Dialog */}
      {selectedItem && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redeem Collectible</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col md:flex-row gap-6 py-4">
              <div className="flex-1">
                <div className="aspect-square rounded-md overflow-hidden mb-4">
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{selectedItem.name}</h3>
                <p className="text-muted-foreground mb-4">{selectedItem.description}</p>
                
                <div className="flex items-center mb-6">
                  <Sparkles className="h-5 w-5 text-amber-400 mr-1" />
                  <span className="text-lg font-bold">{selectedItem.pointCost.toLocaleString()} points</span>
                </div>
                
                {selectedItem.limited && (
                  <p className="text-sm text-amber-400 flex items-center mb-2">
                    <Star className="h-4 w-4 mr-1" />
                    Limited Edition Item
                  </p>
                )}
                
                {selectedItem.exclusive && (
                  <p className="text-sm text-purple-400 flex items-center mb-2">
                    <Gem className="h-4 w-4 mr-1" />
                    Exclusive Rewards Program Item
                  </p>
                )}
                
                <div className="mt-4">
                  <Button 
                    onClick={redeemItem}
                    disabled={userPoints < selectedItem.pointCost}
                    className="w-full"
                  >
                    {userPoints >= selectedItem.pointCost 
                      ? "Confirm Redemption" 
                      : `Need ${selectedItem.pointCost - userPoints} More Points`
                    }
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}