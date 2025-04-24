# Shop Components

This directory contains shop-related components for product display, shopping cart functionality, checkout process, and e-commerce features within the Cosmic Merchandise application.

## Core Features

- **Product Display**: Browse and filter products by category with search functionality
- **Shopping Cart**: Add, remove, and update quantities of items
- **Payment Selection**: Choose between different payment methods
- **Order Processing**: Complete checkout flow with order confirmation
- **Collaborative Shopping**: Shop with other users in real-time
- **Cosmic Collectibles**: Special items available through loyalty points

## Components

### Active Components

| Component | Description | Status |
|-----------|-------------|--------|
| `ProductCard` | Display product information in card format | Active |
| `ProductGrid` | Grid layout for product display | Active |
| `ProductDetails` | Detailed product information display | Active |
| `ShoppingCart` | Cart functionality for product selection | Active |
| `CartItem` | Individual item in shopping cart | Active |
| `CheckoutForm` | Form for completing purchase | Active |
| `PaymentSelector` | Payment method selection interface | Active |
| `OrderSummary` | Order summary and confirmation | Active |
| `CollaborativeShopping` | Real-time collaborative shopping experience | Active |
| `ChatRoom` | Real-time chat for collaborative shopping | Active |
| `RoomParticipants` | Display active participants in collaborative shopping | Active |
| `ProductDetailDropdown` | Expandable product information section | Active |
| `WishlistButton` | Add/remove items from wishlist | Active |
| `SampleOrder` | Simulate order processing for demonstration | Active |

## Usage

### Basic Product Display

```tsx
import { ProductCard, ProductGrid } from '@/components/features/shop';

export default function ShopExample() {
  const products = [
    { id: 1, name: 'Cosmic Shirt', price: 29.99, image: '/images/cosmic-shirt.jpg' },
    { id: 2, name: 'Galaxy Pendant', price: 49.99, image: '/images/galaxy-pendant.jpg' },
    { id: 3, name: 'Star Map Poster', price: 19.99, image: '/images/star-map.jpg' },
  ];
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shop Our Products</h1>
      
      <ProductGrid>
        {products.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
            onAddToCart={() => handleAddToCart(product)}
          />
        ))}
      </ProductGrid>
    </div>
  );
}
```

### Shopping Cart Implementation

```tsx
import { ShoppingCart, CartItem } from '@/components/features/shop';
import { useState } from 'react';

export default function CartExample() {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Cosmic Shirt', price: 29.99, quantity: 1, image: '/images/cosmic-shirt.jpg' },
    { id: 2, name: 'Galaxy Pendant', price: 49.99, quantity: 2, image: '/images/galaxy-pendant.jpg' },
  ]);
  
  const handleQuantityChange = (id, newQuantity) => {
    setCartItems(prev => 
      prev.map(item => item.id === id ? {...item, quantity: newQuantity} : item)
    );
  };
  
  const handleRemoveItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      
      <ShoppingCart>
        {cartItems.map(item => (
          <CartItem 
            key={item.id}
            item={item}
            onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
            onRemove={() => handleRemoveItem(item.id)}
          />
        ))}
      </ShoppingCart>
      
      <OrderSummary 
        items={cartItems}
        onCheckout={() => handleCheckout()}
      />
    </div>
  );
}
```

### Collaborative Shopping Experience

```tsx
import { CollaborativeShopping, ChatRoom, RoomParticipants } from '@/components/features/shop';
import { useState } from 'react';

export default function CollaborativeShoppingExample() {
  const [roomId, setRoomId] = useState('cosmic-room-123');
  const [participants, setParticipants] = useState([
    { id: 'user1', name: 'Alex', avatar: '/avatars/user1.jpg' },
    { id: 'user2', name: 'Jordan', avatar: '/avatars/user2.jpg' },
  ]);
  const [messages, setMessages] = useState([
    { id: 1, userId: 'user1', text: 'What do you think of this cosmic shirt?', timestamp: new Date().toISOString() },
    { id: 2, userId: 'user2', text: 'I love it! The galaxy design is amazing.', timestamp: new Date().toISOString() },
  ]);
  
  const sendMessage = (text) => {
    const newMessage = {
      id: messages.length + 1,
      userId: 'user1', // Current user
      text,
      timestamp: new Date().toISOString()
    };
    setMessages([...messages, newMessage]);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Collaborative Shopping</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CollaborativeShopping 
            roomId={roomId}
            currentUserId="user1"
          />
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <RoomParticipants 
            participants={participants}
            roomId={roomId}
          />
          
          <div className="mt-4">
            <ChatRoom 
              messages={messages}
              participants={participants}
              onSendMessage={sendMessage}
              currentUserId="user1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Component Relationships

```
ShopPage
├── ProductGrid
│   └── ProductCard
│       └── ProductDetailDropdown
├── ShoppingCart
│   └── CartItem
└── CheckoutProcess
    ├── CheckoutForm
    ├── PaymentSelector
    └── OrderSummary

CollaborativeShopping
├── SharedProductView
├── ChatRoom
│   └── ChatMessage
├── RoomParticipants
│   └── ParticipantAvatar
└── CollaborationControls
```

## Props Documentation

### ProductCard Props

```tsx
interface ProductCardProps {
  /**
   * Product data to display
   * @required
   */
  product: {
    id: number | string;
    name: string;
    price: number;
    image: string;
    description?: string;
    rating?: number;
    inStock?: boolean;
    category?: string;
    tags?: string[];
  };
  
  /**
   * Whether to show detailed product description
   * @default false
   */
  showDetails?: boolean;
  
  /**
   * Callback when Add to Cart is clicked
   */
  onAddToCart?: () => void;
  
  /**
   * Callback when product card is clicked
   */
  onClick?: () => void;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}
```

### CollaborativeShopping Props

```tsx
interface CollaborativeShoppingProps {
  /**
   * Unique identifier for the shopping room
   * @required
   */
  roomId: string;
  
  /**
   * ID of the current user
   * @required
   */
  currentUserId: string;
  
  /**
   * Whether to enable chat functionality
   * @default true
   */
  enableChat?: boolean;
  
  /**
   * Whether to show participant list
   * @default true
   */
  showParticipants?: boolean;
  
  /**
   * Whether to enable shared cart functionality
   * @default false
   */
  enableSharedCart?: boolean;
  
  /**
   * Callback when a user joins the room
   */
  onUserJoin?: (userId: string) => void;
  
  /**
   * Callback when a user leaves the room
   */
  onUserLeave?: (userId: string) => void;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}
```

## Design Aesthetic

The shop components follow a cosmic theme with:
- Dark backgrounds with purple/blue accents
- Animated star backgrounds for immersive experience
- Responsive card layouts with hover effects
- Clean, minimalist interface focused on product imagery

## Styling

All components use Tailwind CSS for styling and follow the application's theme defined in `theme.json`. Custom styling can be applied through the `className` prop on most components.

## State Management

Currently, state is managed through React's useState in the Shop component. Future plans include migration to a more robust state management solution as the application grows.

## Feature Roadmap

### Short-term Improvements (Next 3 Months)

- [ ] Authentication system for user accounts
- [ ] Dynamic product loading from database
- [ ] Product reviews and ratings system
- [ ] Wishlist functionality
- [ ] Save cart for later

### Medium-term Goals (3-6 Months)

- [ ] Integration with payment gateways (Stripe, PayPal)
- [ ] Order confirmation emails
- [ ] Enhanced collaborative shopping features
- [ ] Image optimization and lazy loading
- [ ] Related products suggestions

### Long-term Vision (6+ Months)

- [ ] Analytics dashboard for product performance
- [ ] AI-powered product recommendations
- [ ] Inventory management integration
- [ ] Customer segmentation
- [ ] Mobile app version

## Known Issues

- Limited error handling in form submissions
- Performance optimization needed for collaborative features
- Missing proper authentication system

## Component Refactoring Plans

1. Extract product card UI into a separate component
2. Create reusable order summary component
3. Refactor shopping cart item rendering
4. Improve payment method selection logic

## Maintainers

- Shop Team (@shopTeam)

## References

- [Integration Guide](../../../docs/INTEGRATION_GUIDE.md)
- [Repository Reorganization Plan](../../../docs/REPOSITORY_REORGANIZATION_PLAN.md)

## Last Updated

April 9, 2025
