
# Shop Components Structure

This document outlines the structure and responsibilities of the shop-related components in the Cosmic Merchandise application.

## Core Components

### ShopProducts
Displays the product grid with filtering and search capabilities.

### ShoppingCart
Manages the shopping cart sidebar, displaying items and handling quantity changes.

### SampleOrder
Simulates order processing and checkout flow.

### ProductDetailDropdown
Shows detailed information about a product in an expandable section.

### PaymentSelector
Allows users to select different payment methods.

### EnhancedShopping
Provides collaborative shopping experiences.

## Collaborative Shopping Components

### CollaborativeShopping
Main component for the collaborative shopping experience.

### ChatRoom
Real-time chat functionality for collaborative shopping.

### RoomParticipants
Displays the active participants in a collaborative shopping session.

## Future Component Refactoring

1. **Extract Product Card**: Move product card UI to a separate component
2. **Create Order Summary**: Extract order summary into a reusable component
3. **Shopping Cart Item**: Move cart item rendering to its own component
4. **Payment Method Selector**: Refactor payment method selection logic

## Component Relationships

- **Shop Page** uses ShopProducts, ShoppingCart, PaymentSelector
- **ShopProducts** contains Product Cards
- **ShoppingCart** manages CartItems
- **EnhancedShopping** uses CollaborativeShopping
- **CollaborativeShopping** contains ChatRoom, RoomParticipants

## State Management

Currently, state is managed through React's useState in the Shop component. Consider moving to a more robust state management solution as the application grows.
