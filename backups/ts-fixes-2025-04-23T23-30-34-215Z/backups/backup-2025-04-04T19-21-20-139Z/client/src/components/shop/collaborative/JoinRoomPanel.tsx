import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ArrowRight } from 'lucide-react';
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
  return (
    <Card className="cosmic-glass-card cosmic-scale in">
      <CardHeader>
        <CardTitle className="cosmic-gradient-text text-center">
          Join Shopping Room
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="room-id" className="cosmic-label">
            Room ID
          </Label>
          
          <div className="flex space-x-2">
            <Input
              id="room-id"
              value={roomId}
              readOnly
              className="cosmic-glass-field flex-1 font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyRoomId}
              className="cosmic-hover-glow"
            >
              <Copy className={`h-4 w-4 ${isCopied ? 'text-green-500' : ''}`} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You can share this room ID with friends to let them join your shopping room.
          </p>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="username" className="cosmic-label">
            Your Display Name
          </Label>
          <Input
            id="username"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="cosmic-glass-field"
          />
        </div>
        
        <Button
          onClick={joinRoom}
          disabled={!username.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 cosmic-hover-glow"
        >
          Join Room
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default JoinRoomPanel;