import { useState } from 'react';
import { Room, RoomJoinHandler } from './types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import CosmicButton from '@/components/features/cosmic/cosmic-button';

interface JoinRoomProps {
  onJoinRoom: RoomJoinHandler;
  rooms: Room[];
}

export const JoinRoom = ({ onJoinRoom, rooms }: JoinRoomProps) => {
  const { toast } = useToast();
  const [tab, setTab] = useState('join');
  const [roomId, setRoomId] = useState('');
  
  const handleCreateRoom = () => {
    const newRoomId = uuidv4().split('-')[0];
    onJoinRoom(newRoomId);
  };
  
  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      toast({
        title: 'Room ID required',
        description: 'Please enter a valid room ID.',
        variant: 'destructive',
      });
      return;
    }
    
    onJoinRoom(roomId);
  };
  
  return (
    <Card className="w-full max-w-5xl mx-auto cosmic-glass-card cosmic-scale in">
      <CardHeader>
        <CardTitle className="cosmic-gradient-text text-center">
          Collaborative Shopping
        </CardTitle>
        <CardDescription className="text-center">
          Shop together with friends in real-time. Share products, chat, and make decisions as a group.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="join" className="cosmic-hover-glow cosmic-btn">
              <Users className="mr-2 h-4 w-4" />
              Join Room
            </TabsTrigger>
            <TabsTrigger value="create" className="cosmic-hover-glow cosmic-btn">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Room
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="join" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room-code" className="cosmic-label">
                  Enter Room Code
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="room-code"
                    placeholder="Enter room code here"
                    className="cosmic-glass-field"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                  <CosmicButton
                    onClick={handleJoinRoom}
                    variant="cosmic"
                    className="shrink-0"
                  >
                    Join
                  </CosmicButton>
                </div>
              </div>
              
              {rooms.length > 0 && (
                <div className="space-y-2 pt-4">
                  <h3 className="text-sm font-medium cosmic-label">
                    Active Rooms
                  </h3>
                  <ScrollArea className="h-[200px] rounded-md border p-4 cosmic-glass-field">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 cursor-pointer mb-2 cosmic-hover-glow"
                        onClick={() => setRoomId(room.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {room.participants.slice(0, 3).map((participant, i) => (
                              <Avatar 
                                key={participant.id}
                                className="h-6 w-6 absolute cosmic-hover-glow"
                                style={{ left: `${i * 10}px` }}
                              >
                                <AvatarImage src={participant.avatar} />
                                <AvatarFallback className="bg-cosmic-primary text-white">
                                  {participant.username[0]}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <div className="ml-8">
                            <p className="text-sm font-medium">{room.name || `Room ${room.id}`}</p>
                            <p className="text-xs text-muted-foreground">
                              {room.participants.length} {room.participants.length === 1 ? 'person' : 'people'} • Created {format(new Date(room.createdAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="cosmic-hover-glow">
                          Join
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="text-center space-y-6">
            <div className="space-y-4 max-w-md mx-auto">
              <div className="p-4 rounded-lg cosmic-glass">
                <p className="text-sm">
                  Create a new shopping room and invite your friends to join. 
                  You'll get a room code you can share.
                </p>
              </div>
              
              <CosmicButton
                onClick={handleCreateRoom}
                variant="cosmic"
                size="lg"
                className="mx-auto"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Room
              </CosmicButton>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default JoinRoom;