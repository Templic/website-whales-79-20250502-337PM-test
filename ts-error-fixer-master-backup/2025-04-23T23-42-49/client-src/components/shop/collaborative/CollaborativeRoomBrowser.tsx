import React from "react";
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Room } from './types';
import {
  Search,
  Plus,
  Users,
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface CollaborativeRoomBrowserProps {
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (roomData: Partial<Room>) => void;
}

export default function CollaborativeRoomBrowser({
  onJoinRoom,
  onCreateRoom,
}: CollaborativeRoomBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<Room | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  const { toast } = useToast();

  // In a real implementation, this would fetch rooms from the server
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Mock data
      const mockRooms: Room[] = [
        {
          id: 'room-1',
          name: 'Cosmic Friends Shopping',
          hostId: 'user-1',
          hostName: 'CosmicHost',
          participantCount: 3,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isPrivate: false,
          description: 'Shopping for cosmic merchandise together!'
        },
        {
          id: 'room-2',
          name: 'Private Cosmic Party',
          hostId: 'user-2',
          hostName: 'StarGazer',
          participantCount: 2,
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          isPrivate: true,
          description: 'Private shopping for the upcoming cosmic event'
        },
        {
          id: 'room-3',
          name: 'Cosmic Merch Hunt',
          hostId: 'user-3',
          hostName: 'AstralShopper',
          participantCount: 4,
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          isPrivate: false,
          description: 'Looking for the best cosmic merchandise deals'
        }
      ];
      
      setRooms(mockRooms);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    // In a real implementation, this would fetch rooms from the server again
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Rooms Refreshed',
        description: 'The room list has been updated.',
      });
    }, 1000);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a room name',
        variant: 'destructive',
      });
      return;
    }

    if (isPrivate && !password.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a password for your private room',
        variant: 'destructive',
      });
      return;
    }

    const newRoom: Partial<Room> = {
      name: newRoomName,
      description: newRoomDescription,
      isPrivate,
      password: isPrivate ? password : undefined,
    };

    onCreateRoom(newRoom);
    setShowCreateDialog(false);
    
    // Reset form
    setNewRoomName('');
    setNewRoomDescription('');
    setIsPrivate(false);
    setPassword('');

    toast({
      title: 'Room Created',
      description: 'Your shopping room has been created!',
    });
  };

  const handleJoinRoom = (room: Room) => {
    if (room.isPrivate) {
      setSelectedPrivateRoom(room);
      setShowPasswordDialog(true);
    } else {
      onJoinRoom(room.id);
    }
  };

  const handleJoinPrivateRoom = () => {
    if (!selectedPrivateRoom) return;
    
    // In a real implementation, this would verify the password with the server
    if (passwordInput === selectedPrivateRoom.password) {
      onJoinRoom(selectedPrivateRoom.id);
      setShowPasswordDialog(false);
      setPasswordInput('');
      setSelectedPrivateRoom(null);
    } else {
      toast({
        title: 'Incorrect Password',
        description: 'The password you entered is incorrect.',
        variant: 'destructive',
      });
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Collaborative Shopping</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-1">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Create Room</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Shopping Room</DialogTitle>
              <DialogDescription>
                Create a room to shop collaboratively with friends.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="Enter room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roomDescription">Description (Optional)</Label>
                <Input
                  id="roomDescription"
                  placeholder="What are you shopping for?"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPrivate"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked === true)}
                />
                <label
                  htmlFor="isPrivate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Private Room (Password Protected)
                </label>
              </div>
              
              {isPrivate && (
                <div className="space-y-2">
                  <Label htmlFor="roomPassword">Password</Label>
                  <Input
                    id="roomPassword"
                    type="password"
                    placeholder="Enter room password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRoom}>Create Room</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Rooms</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="private">Private</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} onJoin={() => handleJoinRoom(room)} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No rooms found matching your search.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="public" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRooms.filter((r) => !r.isPrivate).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms
                .filter((r) => !r.isPrivate)
                .map((room) => (
                  <RoomCard key={room.id} room={room} onJoin={() => handleJoinRoom(room)} />
                ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No public rooms found.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="private" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRooms.filter((r) => r.isPrivate).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms
                .filter((r) => r.isPrivate)
                .map((room) => (
                  <RoomCard key={room.id} room={room} onJoin={() => handleJoinRoom(room)} />
                ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No private rooms found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Password Dialog for Private Rooms */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Room Password</DialogTitle>
            <DialogDescription>
              This is a private room. Please enter the password to join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="roomPasswordInput">Password</Label>
              <Input
                id="roomPasswordInput"
                type="password"
                placeholder="Enter room password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinPrivateRoom}>Join Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoomCard({ room, onJoin }: { room: Room; onJoin: () => void }) {
  // Format the created time as a relative time (e.g., "5 minutes ago")
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMin = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMin < 1) return 'just now';
    if (diffInMin === 1) return '1 minute ago';
    if (diffInMin < 60) return `${diffInMin} minutes ago`;
    
    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{room.name}</CardTitle>
              {room.isPrivate ? (
                <Badge variant="outline" className="border-amber-500 text-amber-500">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-500 text-green-500">
                  <Unlock className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">{room.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <div className="flex items-center mr-4">
            <Users className="h-4 w-4 mr-1" />
            <span>{room.participantCount} participants</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{getRelativeTime(room.createdAt)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="text-sm">Host: {room.hostName}</span>
        <Button size="sm" onClick={onJoin}>
          Join Room
        </Button>
      </CardFooter>
    </Card>
  );
}