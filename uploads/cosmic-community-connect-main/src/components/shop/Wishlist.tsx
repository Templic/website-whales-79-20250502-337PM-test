
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SacredGeometry } from "@/components/ui/sacred-geometry";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/pages/Shop";
import { Heart, ShoppingCart, Trash2, PlusCircle, Star, Share2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface WishlistItem {
  product: Product;
  addedAt: Date;
  notes?: string;
}

interface WishlistProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const Wishlist = ({ products, onAddToCart }: WishlistProps) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  
  // For demo purposes, populate with some items if empty
  const initializeWishlist = () => {
    if (wishlist.length === 0 && products.length > 0) {
      const sampleItems: WishlistItem[] = [
        {
          product: products[0],
          addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
          product: products.length > 1 ? products[1] : products[0],
          addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          notes: "Would be perfect for meditation sessions"
        }
      ];
      setWishlist(sampleItems);
    }
  };
  
  const addToWishlist = (product: Product) => {
    if (wishlist.some(item => item.product.id === product.id)) {
      toast.error("This product is already in your wishlist");
      return;
    }
    
    const newItem: WishlistItem = {
      product,
      addedAt: new Date()
    };
    
    setWishlist([...wishlist, newItem]);
    toast.success("Added to wishlist");
  };
  
  const removeFromWishlist = (productId: string) => {
    setWishlist(wishlist.filter(item => item.product.id !== productId));
    toast.success("Removed from wishlist");
  };
  
  const moveToCart = (product: Product) => {
    onAddToCart(product);
    removeFromWishlist(product.id);
    toast.success("Moved to cart");
  };
  
  const updateNotes = (productId: string, notes: string) => {
    setWishlist(wishlist.map(item => 
      item.product.id === productId 
        ? { ...item, notes } 
        : item
    ));
    setIsEditing(null);
    toast.success("Notes updated");
  };
  
  const startEditing = (productId: string, currentNotes?: string) => {
    setIsEditing(productId);
    setNoteText(currentNotes || "");
  };
  
  // Available products for adding to wishlist (those not already in wishlist)
  const availableProducts = products.filter(
    product => !wishlist.some(item => item.product.id === product.id)
  );
  
  return (
    <Dialog onOpenChange={() => initializeWishlist()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-cosmic-primary/10 border-cosmic-primary/20 hover:bg-cosmic-primary/20">
          <Heart className="h-4 w-4 mr-2" />
          Wishlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] border-cosmic-primary/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent flex items-center">
            <Heart className="h-5 w-5 mr-2 text-cosmic-primary" />
            Your Cosmic Wishlist
          </DialogTitle>
          <DialogDescription>
            Save your favorite cosmic products for later or share them with friends.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-6 mt-4">
          {/* Wishlist Items */}
          {wishlist.length === 0 ? (
            <div className="text-center py-8">
              <SacredGeometry variant="flower-of-life" intensity="medium" className="mx-auto w-24 h-24 flex items-center justify-center">
                <Heart className="h-8 w-8 text-cosmic-primary" />
              </SacredGeometry>
              <h3 className="mt-4 text-lg font-medium">Your wishlist is empty</h3>
              <p className="text-muted-foreground mt-2">
                Add items from our catalog to save them for later
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[40vh]">
              <div className="space-y-4">
                {wishlist.map((item) => (
                  <SacredGeometry key={item.product.id} variant="tetrahedron" intensity="subtle" className="relative">
                    <div className="p-4">
                      <div className="flex items-start">
                        <div className="h-20 w-20 rounded-md overflow-hidden mr-4 flex-shrink-0 bg-cosmic-primary/10">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-cosmic-primary font-semibold mt-1">
                            {formatPrice(item.product.price)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added {item.addedAt.toLocaleDateString()}
                          </p>
                          
                          {isEditing === item.product.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea 
                                placeholder="Add notes about this item..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="text-xs h-20"
                              />
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setIsEditing(null)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateNotes(item.product.id, noteText)}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {item.notes && (
                                <div className="mt-2 text-xs italic border-l-2 border-cosmic-primary/20 pl-2">
                                  {item.notes}
                                </div>
                              )}
                              <div className="flex items-center mt-2 space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs h-8"
                                  onClick={() => moveToCart(item.product)}
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Add to Cart
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => startEditing(item.product.id, item.notes)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeFromWishlist(item.product.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </SacredGeometry>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {/* Add to Wishlist Section */}
          <div>
            <h3 className="text-lg font-medium mb-4">Add to Your Wishlist</h3>
            
            <ScrollArea className="h-[20vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="flex items-center p-3 rounded-lg border border-cosmic-primary/10 hover:bg-cosmic-primary/5 cursor-pointer transition-colors"
                    onClick={() => addToWishlist(product)}
                  >
                    <div className="h-12 w-12 rounded-md overflow-hidden mr-3">
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{product.name}</h4>
                      <p className="text-xs text-cosmic-primary">{formatPrice(product.price)}</p>
                    </div>
                    <PlusCircle className="h-5 w-5 text-cosmic-primary ml-2" />
                  </div>
                ))}
              </div>
              
              {availableProducts.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  All available products are already in your wishlist
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" className="text-sm">
              <Star className="h-4 w-4 mr-2" />
              Create Gift Registry
            </Button>
            <Button variant="outline" className="text-sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Wishlist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Wishlist;
