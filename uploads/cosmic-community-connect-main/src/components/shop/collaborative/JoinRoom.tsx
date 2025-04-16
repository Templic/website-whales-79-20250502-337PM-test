
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface JoinRoomProps {
  roomId: string;
  username: string;
  setUsername: (name: string) => void;
  onJoinRoom: () => void;
}

const JoinRoom = ({ roomId, username, setUsername, onJoinRoom }: JoinRoomProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

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
          onClick={onJoinRoom} 
          className="w-full bg-cosmic-primary hover:bg-cosmic-vivid"
        >
          Join Shopping Room
        </Button>
      </div>
    </div>
  );
};

export default JoinRoom;
