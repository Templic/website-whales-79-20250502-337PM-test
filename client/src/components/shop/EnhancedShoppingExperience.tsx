import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Sparkles, Wand2 } from "lucide-react";
import { Product } from "@/pages/imported-pages/CosmicMerchandisePage";
import { useToast } from "@/hooks/use-toast";

// Props definition
interface EnhancedShoppingExperienceProps {
  onProductView: (productId: string) => void;
  products: Product[];
}

// Derived from the EnhancedShopping component in the source project
export default function EnhancedShoppingExperience({ 
  onProductView, 
  products 
}: EnhancedShoppingExperienceProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("shop-together");
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [designDialogOpen, setDesignDialogOpen] = useState(false);

  // Generate a random room code
  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    return code;
  };

  // Handle creating a new shopping room
  const createRoom = () => {
    const code = generateRoomCode();
    toast({
      title: "Room Created",
      description: `Your shopping room code is: ${code}`,
    });
    setRoomDialogOpen(false);
  };

  // Handle joining an existing room
  const joinRoom = () => {
    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid room code",
        variant: "destructive",
      });
      return;
    }

    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter your display name",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Joining Room",
      description: `Connecting to room: ${roomCode}`,
    });
    setRoomDialogOpen(false);
  };

  // Handle co-design studio
  const startDesign = () => {
    toast({
      title: "Co-Design Studio",
      description: "Opening the co-design studio...",
    });
    setDesignDialogOpen(false);
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
          Enhanced Shopping Experience
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover new ways to shop with friends and design your own custom cosmic products
        </p>
      </div>

      <Tabs defaultValue="shop-together" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="shop-together" className="text-sm sm:text-base">
            <Users className="h-4 w-4 mr-2 hidden sm:inline" />
            Shop Together
          </TabsTrigger>
          <TabsTrigger value="co-design" className="text-sm sm:text-base">
            <Sparkles className="h-4 w-4 mr-2 hidden sm:inline" />
            Co-Design Studio
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shop-together" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="cosmic-glass-card p-6 flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create a Shopping Room</h3>
                <p className="text-muted-foreground mb-4">
                  Invite friends to shop with you in real-time. Share discoveries and make decisions together.
                </p>
              </div>
              <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">Create Room</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Shopping Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Display Name</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 bg-black/20 border border-purple-500/30 rounded-md"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Create a room and invite friends to shop with you. Share the room code with them.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={createRoom}>
                      Create Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>

            <Card className="cosmic-glass-card p-6 flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Join Shopping Room</h3>
                <p className="text-muted-foreground mb-4">
                  Join a friend's shopping session with a room code. Browse together and share your favorites.
                </p>
              </div>
              <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">Join Room</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Shopping Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Room Code</label>
                      <input 
                        type="text" 
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="w-full p-2 bg-black/20 border border-purple-500/30 rounded-md"
                        placeholder="Enter room code"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Display Name</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 bg-black/20 border border-purple-500/30 rounded-md"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={joinRoom}>
                      Join Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="co-design" className="space-y-4">
          <Card className="cosmic-glass-card p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                  <Wand2 className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Co-Design Studio</h3>
                <p className="text-muted-foreground mb-4">
                  Design custom cosmic products with our interactive tools. Collaborate with others or create your own unique items.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-purple-500/10 text-purple-400 p-1 mt-0.5">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <span className="text-sm">Customize designs with cosmic elements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-purple-500/10 text-purple-400 p-1 mt-0.5">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <span className="text-sm">Work with friends in real-time on designs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-purple-500/10 text-purple-400 p-1 mt-0.5">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <span className="text-sm">Create one-of-a-kind cosmic merchandise</span>
                  </li>
                </ul>
                <Dialog open={designDialogOpen} onOpenChange={setDesignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Launch Co-Design Studio</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Co-Design Studio</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-center text-muted-foreground mb-4">
                        The Co-Design Studio is currently in development. Coming soon!
                      </p>
                      <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-lg flex items-center justify-center">
                        <div className="text-center p-6">
                          <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-400 animate-pulse-gentle" />
                          <h3 className="text-xl font-semibold mb-2">Co-Design Studio Preview</h3>
                          <p className="text-sm text-muted-foreground">
                            Our interactive design studio is coming soon. Join the waitlist to be among the first to create your custom cosmic merchandise.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={startDesign}>
                        Join Waitlist
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-full max-w-xs aspect-square bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-lg flex items-center justify-center border border-purple-500/20">
                  <Sparkles className="h-16 w-16 text-purple-400 animate-pulse-gentle" />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}