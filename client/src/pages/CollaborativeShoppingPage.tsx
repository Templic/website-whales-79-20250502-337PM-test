import { useState, useEffect } from 'react';
import { Route, useLocation, useParams } from 'wouter';
import CollaborativeRoomBrowser from '@/components/shop/collaborative/CollaborativeRoomBrowser';
import CollaborativeShoppingRoom from '@/components/shop/collaborative/CollaborativeShoppingRoom';
import SharedCartComponent from '@/components/shop/collaborative/SharedCart';
import { Room, RoomParticipant, RoomMessage, SharedCartItem } from '@/components/shop/collaborative/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Share2 } from 'lucide-react';

export default function CollaborativeShoppingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Route path="/shop/collaborative" component={RoomBrowserPage} />
      <Route path="/shop/collaborative/room/:roomId" component={RoomPage} />
    </div>
  );
}

function RoomBrowserPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleJoinRoom = (roomId: string) => {
    navigate(`/shop/collaborative/room/${roomId}`);
  };

  const handleCreateRoom = (roomData: Partial<Room>) => {
    // In a real implementation, this would create a room on the server
    // For now, we'll create a mock room and navigate to it
    const newRoomId = `room-${uuidv4()}`;
    navigate(`/shop/collaborative/room/${newRoomId}`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Collaborative Shopping</h1>
        <p className="text-lg text-muted-foreground">
          Browse and join shopping rooms or create your own to shop with friends!
        </p>
      </div>

      <CollaborativeRoomBrowser 
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}

function RoomPage() {
  const { roomId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'room' | 'cart'>('room');
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [sharedCart, setSharedCart] = useState<SharedCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roomDetails, setRoomDetails] = useState<Partial<Room> | null>(null);

  // Mock user info - in a real app, this would come from authentication
  const currentUser = {
    id: 'current-user',
    name: 'You',
    avatar: undefined,
  };

  // Mock product data - in a real app, this would come from an API
  const products: Record<string, {
    id: string;
    name: string;
    price: number;
    image: string;
  }> = {
    'product-1': {
      id: 'product-1',
      name: 'Cosmic T-Shirt',
      price: 29.99,
      image: 'https://via.placeholder.com/150',
    },
    'product-2': {
      id: 'product-2',
      name: 'Galaxy Hoodie',
      price: 59.99,
      image: 'https://via.placeholder.com/150',
    },
    'product-3': {
      id: 'product-3',
      name: 'Cosmic Mug',
      price: 14.99,
      image: 'https://via.placeholder.com/150',
    },
  };

  // Mock participants data
  const participantsData: Record<string, {
    id: string;
    username: string;
    avatar?: string;
  }> = {
    'current-user': {
      id: 'current-user',
      username: 'You',
      avatar: undefined,
    },
    'user-2': {
      id: 'user-2',
      username: 'Cosmic Friend',
      avatar: undefined,
    },
  };

  // In a real implementation, this would fetch room data from the server
  useEffect(() => {
    if (!roomId) return;

    // Simulate API call
    setTimeout(() => {
      // Mock data for room
      const mockRoom: Partial<Room> = {
        id: roomId,
        name: 'Cosmic Shopping Room',
        hostId: 'current-user',
        hostName: 'You',
        description: 'Shopping for cosmic merchandise together!',
        isPrivate: false,
      };
      
      const mockParticipants: RoomParticipant[] = [
        {
          id: 'current-user',
          username: 'You',
          isHost: true,
          joinedAt: new Date(),
          status: 'online',
        },
        {
          id: 'user-2',
          username: 'Cosmic Friend',
          isHost: false,
          joinedAt: new Date(Date.now() - 300000), // 5 minutes ago
          status: 'online',
        },
      ];
      
      const mockMessages: RoomMessage[] = [
        {
          id: 'welcome',
          senderId: 'system',
          senderName: 'System',
          content: 'Welcome to the collaborative shopping room! Share products and shop together.',
          timestamp: new Date(),
          type: 'system',
        },
        {
          id: 'msg-1',
          senderId: 'user-2',
          senderName: 'Cosmic Friend',
          content: 'Hi there! I\'m looking for some cosmic merchandise. Any recommendations?',
          timestamp: new Date(Date.now() - 240000), // 4 minutes ago
          type: 'text',
        },
        {
          id: 'product-1',
          senderId: 'user-2',
          senderName: 'Cosmic Friend',
          content: 'Check out this product!',
          timestamp: new Date(Date.now() - 180000), // 3 minutes ago
          type: 'product',
          productData: {
            id: 'product-1',
            name: 'Cosmic T-Shirt',
            price: '$29.99',
            image: 'https://via.placeholder.com/150',
          },
        },
      ];
      
      const mockSharedCart: SharedCartItem[] = [
        {
          productId: 'product-1',
          quantity: 1,
          addedBy: 'user-2',
          addedAt: new Date(Date.now() - 120000), // 2 minutes ago
        },
        {
          productId: 'product-2',
          quantity: 2,
          addedBy: 'current-user',
          addedAt: new Date(Date.now() - 60000), // 1 minute ago
        },
      ];
      
      setRoomDetails(mockRoom);
      setParticipants(mockParticipants);
      setMessages(mockMessages);
      setSharedCart(mockSharedCart);
      setIsLoading(false);
    }, 1000);
  }, [roomId]);

  const handleClose = () => {
    navigate('/shop/collaborative');
  };

  const handleShareProduct = (productId: string) => {
    // In a real implementation, this would send a message via WebSocket
    const product = products[productId];
    
    if (!product) return;
    
    const newMessage: RoomMessage = {
      id: `product-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: 'Check out this product!',
      timestamp: new Date(),
      type: 'product',
      productData: {
        id: product.id,
        name: product.name,
        price: `$${product.price.toFixed(2)}`,
        image: product.image,
      },
    };
    
    setMessages([...messages, newMessage]);
    
    toast({
      title: 'Product Shared',
      description: `You shared ${product.name} with the room.`,
    });
  };

  const handleAddToSharedCart = (productId: string, quantity: number) => {
    // Check if the item is already in the cart
    const existingItemIndex = sharedCart.findIndex(
      item => item.productId === productId && item.addedBy === currentUser.id
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const updatedCart = [...sharedCart];
      updatedCart[existingItemIndex].quantity += quantity;
      setSharedCart(updatedCart);
    } else {
      // Add new item to cart
      const newItem: SharedCartItem = {
        productId,
        quantity,
        addedBy: currentUser.id,
        addedAt: new Date(),
      };
      setSharedCart([...sharedCart, newItem]);
    }
    
    const product = products[productId];
    
    toast({
      title: 'Added to Shared Cart',
      description: `Added ${quantity} × ${product?.name || 'product'} to the shared cart.`,
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    
    const updatedCart = sharedCart.map(item => {
      if (item.productId === productId && item.addedBy === currentUser.id) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setSharedCart(updatedCart);
  };

  const handleRemoveItem = (productId: string) => {
    const updatedCart = sharedCart.filter(
      item => !(item.productId === productId && item.addedBy === currentUser.id)
    );
    
    setSharedCart(updatedCart);
    
    const product = products[productId];
    
    toast({
      title: 'Removed from Cart',
      description: `Removed ${product?.name || 'product'} from the shared cart.`,
    });
  };

  const handleCheckout = () => {
    // In a real implementation, this would initiate the checkout process
    toast({
      title: 'Checkout Initiated',
      description: 'Proceeding to checkout with shared cart items.',
    });
    
    // Navigate to checkout page (not implemented in this example)
    // navigate('/shop/checkout');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading shopping room...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{roomDetails?.name || 'Shopping Room'}</h1>
            <p className="text-muted-foreground">{roomDetails?.description || 'Shop together with friends'}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1" onClick={() => {
            // Copy room link to clipboard
            const roomLink = window.location.href;
            navigator.clipboard.writeText(roomLink).then(
              () => {
                toast({
                  title: 'Room Link Copied!',
                  description: 'Share this link with friends to shop together.',
                });
              },
              (err) => {
                console.error('Could not copy room link:', err);
              }
            );
          }}>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share Room</span>
          </Button>
          
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={activeTab === 'room' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setActiveTab('room')}
            >
              Room
            </Button>
            <Button 
              variant={activeTab === 'cart' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setActiveTab('cart')}
            >
              Shared Cart
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Room Section */}
        {activeTab === 'room' && (
          <>
            <div className="md:col-span-2">
              <CollaborativeShoppingRoom
                roomId={roomId || ''}
                onClose={handleClose}
                currentUser={currentUser}
                initialParticipants={participants}
                initialMessages={messages}
                onShareProduct={handleShareProduct}
                onAddToSharedCart={handleAddToSharedCart}
              />
            </div>
            
            <div>
              <SharedCartComponent
                roomId={roomId || ''}
                sharedCart={sharedCart}
                products={products}
                participants={participantsData}
                currentUserId={currentUser.id}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
              />
            </div>
          </>
        )}
        
        {/* Shared Cart Section (Mobile View) */}
        {activeTab === 'cart' && (
          <div className="md:col-span-3">
            <SharedCartComponent
              roomId={roomId || ''}
              sharedCart={sharedCart}
              products={products}
              participants={participantsData}
              currentUserId={currentUser.id}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onCheckout={handleCheckout}
            />
          </div>
        )}
      </div>
    </div>
  );
}