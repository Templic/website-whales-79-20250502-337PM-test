
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Users, Send, Share2, Copy, Check } from "lucide-react";
import { Product } from "@/pages/Shop";

interface CollaborativeShoppingProps {
  onProductView: (productId: string) => void;
  products: Product[];
}

type RoomMessage = {
  id: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
  productRef?: string;
};

type RoomParticipant = {
  id: string;
  username: string;
  avatar: string;
  isActive: boolean;
  lastActive: Date;
};

// In a real app, this would connect to a real-time backend service
const CollaborativeShopping = ({ onProductView, products }: CollaborativeShoppingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate a room ID on initial open
  useEffect(() => {
    if (isOpen && !roomId) {
      const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(generatedId);
    }
  }, [isOpen, roomId]);

  // Generate a random username if not set
  useEffect(() => {
    if (!username) {
      const names = ["CosmicFan", "StarGazer", "MelodySeeker", "VibeMaster", "HarmonyHunter"];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomNum = Math.floor(Math.random() * 1000);
      setUsername(`${randomName}${randomNum}`);
    }
  }, [username]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mock joining a room
  const joinRoom = () => {
    setIsJoined(true);
    
    // Mock participants (in a real app, this would come from a server)
    const mockParticipants: RoomParticipant[] = [
      {
        id: "user-1",
        username: username,
        avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${username}`,
        isActive: true,
        lastActive: new Date()
      },
      {
        id: "user-2",
        username: "CosmicExplorer",
        avatar: "https://api.dicebear.com/7.x/personas/svg?seed=CosmicExplorer",
        isActive: true,
        lastActive: new Date()
      },
      {
        id: "user-3",
        username: "MoonChild",
        avatar: "https://api.dicebear.com/7.x/personas/svg?seed=MoonChild",
        isActive: false,
        lastActive: new Date(Date.now() - 120000)
      }
    ];
    
    setParticipants(mockParticipants);
    
    // Add welcome message
    const welcomeMessage: RoomMessage = {
      id: `msg-${Date.now()}`,
      username: "System",
      avatar: "",
      message: `Welcome to Cosmic Shopping Room #${roomId}! Share this room code with friends to shop together.`,
      timestamp: new Date(),
      isSystem: true
    };
    
    setMessages([welcomeMessage]);
    
    toast({
      title: "Joined shopping room",
      description: `You're now shopping in room #${roomId}`,
    });
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Check if message is referencing a product
    const productMatch = inputMessage.match(/check out product (\d+)/i);
    let productRef = undefined;
    
    if (productMatch && productMatch[1]) {
      const productId = productMatch[1];
      const product = products.find(p => p.id === productId);
      
      if (product) {
        productRef = productId;
        
        // Notify that we're viewing this product
        setTimeout(() => {
          onProductView(productId);
        }, 1000);
      }
    }
    
    const newMessage: RoomMessage = {
      id: `msg-${Date.now()}`,
      username: username,
      avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${username}`,
      message: inputMessage,
      timestamp: new Date(),
      productRef
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
    
    // Mock response (in a real app, this would come from other users via a server)
    if (productRef) {
      setTimeout(() => {
        const responseMessage: RoomMessage = {
          id: `msg-${Date.now() + 1}`,
          username: "CosmicExplorer",
          avatar: "https://api.dicebear.com/7.x/personas/svg?seed=CosmicExplorer",
          message: `That's a great choice! I love the design on that one.`,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, responseMessage]);
      }, 2000);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    toast({
      title: "Room ID copied",
      description: "Share this with friends to shop together!",
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-cosmic-primary/10 border-cosmic-primary/20 hover:bg-cosmic-primary/20">
          <Users className="h-4 w-4 mr-2" />
          Shop Together
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cosmic-primary" />
            Collaborative Shopping Room
          </DialogTitle>
        </DialogHeader>
        
        {!isJoined ? (
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-md text-center">
              <h3 className="font-semibold text-lg mb-1">Room #{roomId}</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Share this code with friends to shop together in real-time!
              </p>
              <Button onClick={copyRoomId} variant="outline" className="gap-2">
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isCopied ? "Copied!" : "Copy Room ID"}
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="username" className="text-sm font-medium">
                  Your Display Name
                </label>
                <Input 
                  id="username"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              
              <Button 
                onClick={joinRoom} 
                className="w-full bg-cosmic-primary hover:bg-cosmic-vivid"
              >
                Join Shopping Room
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full max-h-[600px]">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">Room: #{roomId}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={copyRoomId}
                >
                  {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              
              <div className="flex -space-x-2">
                {participants.map((participant) => (
                  <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={participant.avatar} alt={participant.username} />
                    <AvatarFallback>{participant.username.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                  {participants.length}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'} ${msg.isSystem ? 'justify-center' : ''}`}
                >
                  {msg.isSystem ? (
                    <div className="bg-muted/30 text-muted-foreground text-xs py-1 px-3 rounded-full">
                      {msg.message}
                    </div>
                  ) : (
                    <div className={`max-w-[80%] ${msg.username === username ? 'bg-cosmic-primary/20 text-primary' : 'bg-muted text-foreground'} rounded-lg p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={msg.avatar} alt={msg.username} />
                          <AvatarFallback>{msg.username.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{msg.username}</span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      {msg.productRef && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-xs mt-1"
                          onClick={() => onProductView(msg.productRef!)}
                        >
                          View Product
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="border-t p-2">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Input 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message or 'check out product 1'..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" className="bg-cosmic-primary hover:bg-cosmic-vivid">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CollaborativeShopping;
