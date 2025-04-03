import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CosmicButton from '@/components/ui/cosmic-button';

interface JoinRoomPanelProps {
  roomId: string;
  username: string;
  setUsername: (username: string) => void;
  joinRoom: () => void;
  isCopied: boolean;
  copyRoomId: () => void;
}

export const JoinRoomPanel = ({
  roomId,
  username,
  setUsername,
  joinRoom,
  isCopied,
  copyRoomId
}: JoinRoomPanelProps) => {
  const { toast } = useToast();
  const [localUsername, setLocalUsername] = useState(username);
  
  const handleJoin = () => {
    if (localUsername.trim().length < 3) {
      toast({
        title: 'Username required',
        description: 'Please enter a username with at least 3 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    setUsername(localUsername);
    joinRoom();
  };
  
  return (
    <Card className="w-full max-w-md mx-auto cosmic-glass-card cosmic-scale in">
      <CardHeader>
        <CardTitle className="text-center cosmic-gradient-text">
          Join Shopping Room
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="cosmic-label">
            Your Name
          </Label>
          <Input
            id="username"
            placeholder="Enter your name"
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
            className="cosmic-glass-field"
            autoFocus
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="room-id" className="cosmic-label">
            Room ID
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="room-id"
              value={roomId}
              readOnly
              className="cosmic-glass-field font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyRoomId}
              className="shrink-0 cosmic-hover-glow"
            >
              {isCopied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Share this ID with friends to shop together
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <CosmicButton
          onClick={handleJoin}
          className="w-full cosmic-btn"
          variant="cosmic"
        >
          Join Room
        </CosmicButton>
      </CardFooter>
    </Card>
  );
};

export default JoinRoomPanel;