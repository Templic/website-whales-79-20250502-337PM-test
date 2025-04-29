/**
 * CollaborativeShoppingPage.tsx
 * 
 * Collaborative Shopping experience with cosmic sacred geometry themes.
 */
import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import CollaborativeShoppingRoom from '@/components/shop/collaborative/CollaborativeShoppingRoom';
import JoinRoom from '@/components/shop/collaborative/JoinRoom';
import { v4 as uuidv4 } from 'uuid';
import CosmicBackground from '@/components/features/cosmic/CosmicBackground';
import StarBackground from '@/components/cosmic/StarBackground';
import SacredGeometry from '@/components/cosmic/SacredGeometry';

export default function CollaborativeShoppingPage() {
  const [match, params] = useRoute('/shop/collaborative/room/:roomId');
  const [, setLocation] = useLocation();
  const roomId = match ? params?.roomId : null;
  
  useEffect(() => {
    document.title = "Collaborative Shopping - Dale Loves Whales";
    // Scroll to top when the page loads
    window.scrollTo(0, 0);
  }, []);
  
  const handleJoinRoom = (joinRoomId: string) => {
    setLocation(`/shop/collaborative/room/${joinRoomId}`);
  };
  
  const handleProductView = (productId: string) => {
    // This would navigate to the product detail page
    setLocation(`/shop/products/${productId}`);
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic Background with vibrant teal color scheme for collaborative experience */}
      <CosmicBackground 
        className="fixed inset-0 z-0" 
        colorScheme="teal"
        intensity={0.6}
      />
      
      {/* Star elements for cosmic feel */}
      <StarBackground className="fixed inset-0 z-0 opacity-40" />
      
      {/* Sacred Geometry elements on the sides */}
      <div className="absolute top-20 left-4 opacity-20 hidden lg:block">
        <SacredGeometry type="flower-of-life" size={200} color="rgba(64, 224, 208, 0.3)" />
      </div>
      <div className="absolute bottom-20 right-4 opacity-20 hidden lg:block">
        <SacredGeometry type="metatron-cube" size={180} color="rgba(138, 43, 226, 0.3)" />
      </div>
      
      {/* Main content */}
      <div className="container relative z-10 mx-auto px-4 py-12 min-h-screen">
        <h1 className="cosmic-gradient-text text-4xl font-bold text-center mb-10">
          Cosmic Collaborative Shopping
        </h1>
        
        <div className="max-w-6xl mx-auto">
          {/* Render the appropriate component based on whether we're in a room */}
          {roomId ? (
            <div className="cosmic-glass-card p-6 rounded-xl shadow-cosmic">
              <CollaborativeShoppingRoom
                roomId={roomId}
                onProductView={handleProductView}
              />
            </div>
          ) : (
            <JoinRoom
              onJoinRoom={handleJoinRoom}
              rooms={[]} // Would come from API in real implementation
            />
          )}
        </div>
      </div>
    </div>
  );
}