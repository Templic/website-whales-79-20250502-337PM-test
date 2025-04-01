
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { RoomMessage, RoomParticipant, CollaborativeShoppingProps } from "./types";
import JoinRoom from "./JoinRoom";
import ChatRoom from "./ChatRoom";

const CollaborativeShopping = ({ onProductView, products }: CollaborativeShoppingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isJoined, setIsJoined] = useState(false);
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

  const sendMessage = (inputMessage: string) => {
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
          <JoinRoom
            roomId={roomId}
            username={username}
            setUsername={setUsername}
            onJoinRoom={joinRoom}
          />
        ) : (
          <ChatRoom
            username={username}
            roomId={roomId}
            messages={messages}
            participants={participants}
            onSendMessage={sendMessage}
            onProductView={onProductView}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CollaborativeShopping;
