/**
 * CollaborativeShoppingPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import React from "react";

import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import CollaborativeShoppingRoom from '@/components/shop/collaborative/CollaborativeShoppingRoom';
import JoinRoom from '@/components/shop/collaborative/JoinRoom';
import { v4 as uuidv4 } from 'uuid';

export default function CollaborativeShoppingPage() {
  const [match, params] = useRoute('/shop/collaborative/room/:roomId');
  const [, setLocation] = useLocation();
  const roomId = match ? params?.roomId : null;
  
  useEffect(() => {
    document.title = "Collaborative Shopping - Dale Loves Whales";
  }, []);
  
  const handleJoinRoom = (joinRoomId: string) => {
    setLocation(`/shop/collaborative/room/${joinRoomId}`);
  };
  
  const handleProductView = (productId: string) => {
    // This would navigate to the product detail page
    setLocation(`/shop/products/${productId}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {roomId ? (
          <CollaborativeShoppingRoom
            roomId={roomId}
            onProductView={handleProductView}
          />
        ) : (
          <JoinRoom
            onJoinRoom={handleJoinRoom}
            rooms={[]} // Would come from API in real implementation
          />
        )}
      </div>
    </div>
  );
}